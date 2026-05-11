import '@shopify/shopify-api/adapters/web-api';
import { shopifyApi, Session, ApiVersion } from '@shopify/shopify-api';

type ShopifyClient = ReturnType<typeof shopifyApi>;

const host = process.env.NEXT_PUBLIC_HOST || process.env.SHOPIFY_APP_URL || 'http://localhost:3000';
const scopes = ['read_products', 'read_orders', 'read_customers'];

let shopifyClient: ShopifyClient | null = null;
let didWarnMissingShopifyCredentials = false;

function getShopifyApiKey(): string {
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('Shopify is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET to enable Shopify routes.');
  }

  return apiKey;
}

function getShopifyApiSecret(): string {
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiSecret) {
    throw new Error('Shopify is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET to enable Shopify routes.');
  }

  return apiSecret;
}

function warnMissingShopifyCredentialsOnce() {
  if (didWarnMissingShopifyCredentials) {
    return;
  }

  didWarnMissingShopifyCredentials = true;
  console.warn('Missing Shopify API credentials. Shopify routes will return 503 until configured.');
}

export function isShopifyConfigured(): boolean {
  return Boolean(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET);
}

export function getShopify(): ShopifyClient {
  if (!isShopifyConfigured()) {
    warnMissingShopifyCredentialsOnce();
    throw new Error('Shopify is not configured. Set SHOPIFY_API_KEY and SHOPIFY_API_SECRET to enable Shopify routes.');
  }

  if (!shopifyClient) {
    shopifyClient = shopifyApi({
      apiKey: getShopifyApiKey(),
      apiSecretKey: getShopifyApiSecret(),
      scopes,
      hostName: host.replace(/^https?:\/\//, ''),
      hostScheme: host.startsWith('https') ? 'https' : 'http',
      apiVersion: '2025-01' as ApiVersion,
      isEmbeddedApp: false, // Set to true if building an embedded app
    });
  }

  return shopifyClient;
}

export function sessionCreator(shop: string, accessToken: string) {
  const shopify = getShopify();

  return new Session({
    id: shopify.session.getOfflineId(shop),
    shop,
    state: 'offline_state', // stateless for now for simplicity in this helper
    isOnline: false,
    accessToken,
    scope: shopify.config.scopes?.toString(),
  });
}
