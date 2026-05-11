import { Session } from '@shopify/shopify-api';
import { NextResponse } from 'next/server';

import { getShopify } from '@/lib/shopify';
import { createServerSupabaseClient as createClient } from '@cumulus/auth/server';

type ShopifyProduct = {
  id: number | string;
  title: string;
  handle: string;
} & Record<string, unknown>;

type ShopifyProductsResponse = {
  body: {
    products?: ShopifyProduct[];
  };
};

export async function POST() {
  let shopify;

  try {
    shopify = getShopify();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's store
    const { data: store } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'No active store found' }, { status: 404 });
    }

    const session = new Session({
      id: shopify.session.getOfflineId(store.shop_domain),
      shop: store.shop_domain,
      state: 'offline_state', // stateless or retrieved if needed
      isOnline: false,
      accessToken: store.access_token,
    });

    const client = new shopify.clients.Rest({
      session,
    });

    // Fetch Products
    const products = (await client.get({
      path: 'products',
    })) as ShopifyProductsResponse;

    if (products.body.products) {
      const productsToInsert = products.body.products.map((product) => ({
        store_id: store.id,
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
        return NextResponse.json({ error: 'Database error during sync' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: products.body.products?.length || 0 });
  } catch (error) {
    console.error('Failed to sync Shopify data', error);
    return NextResponse.json(
      {
        error: 'Failed to sync data',
        details: (error as Error).message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
