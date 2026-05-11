import { NextResponse } from 'next/server';

import { getShopify } from '@/lib/shopify';
import { createServerSupabaseClient as createClient } from '@cumulus/auth/server';

type ShopifyProduct = {
  id: number | string;
  title: string;
  handle: string;
} & Record<string, unknown>;

type ShopifyShopResponse = {
  body: {
    shop: Record<string, unknown>;
  };
};

type ShopifyProductsResponse = {
  body: {
    products?: ShopifyProduct[];
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');

  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  let shopify;

  try {
    shopify = getShopify();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }

  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
    });

    const { session } = callbackResponse;

    // Store session in DB
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert store
    const { error: upsertError } = await supabase.from('shopify_stores').upsert(
      {
        user_id: user.id,
        shop_domain: session.shop,
        access_token: session.accessToken,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'shop_domain' }
    );

    if (upsertError) {
      console.error('DB Error:', upsertError);
      throw new Error('Failed to save store');
    }

    // Trigger Initial Sync (Sync Store Details and Products)
    // We can do this asynchronously or synchronously. For now, let's just trigger it.
    // Ideally, call a function or another API route.
    // Here we will just fetch the store info immediately to populate `shop_data`.
    const client = new shopify.clients.Rest({
      session,
    });

    const shopInfo = (await client.get({
      path: 'shop',
    })) as ShopifyShopResponse;

    await supabase.from('shopify_stores').update({ shop_data: shopInfo.body.shop }).eq('shop_domain', session.shop);

    // Fetch Products (Basic sync)
    const products = (await client.get({
      path: 'products',
    })) as ShopifyProductsResponse;

    // Get the store ID
    const { data: storeData } = await supabase.from('shopify_stores').select('id').eq('shop_domain', session.shop).single();

    if (storeData && products.body.products) {
      const productsToInsert = products.body.products.map((product) => ({
        store_id: storeData.id,
        shopify_id: product.id.toString(),
        title: product.title,
        handle: product.handle,
        data: product,
      }));

      const { error: productsError } = await supabase
        .from('shopify_products')
        .upsert(productsToInsert, { onConflict: 'store_id,shopify_id' });

      if (productsError) {
        console.error('Error syncing products', productsError);
      }
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard/connections', request.url));
  } catch (error) {
    console.error('Failed to complete Shopify auth', error);
    return NextResponse.json(
      {
        error: 'Failed to complete auth',
        details: (error as Error).message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
