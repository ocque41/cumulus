import { NextResponse } from 'next/server';

import { getShopify } from '@/lib/shopify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  let shopify;

  try {
    shopify = getShopify();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }

  // Sanitize shop parameter
  const shopDomain = shopify.utils.sanitizeShop(shop);
  if (!shopDomain) {
    return NextResponse.json({ error: 'Invalid shop parameter' }, { status: 400 });
  }

  try {
    const redirectUrl = await shopify.auth.begin({
      shop: shopDomain,
      callbackPath: '/api/shopify/callback',
      isOnline: false,
      rawRequest: request,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Failed to begin Shopify auth', error);
    return NextResponse.json({ error: 'Failed to begin auth' }, { status: 500 });
  }
}
