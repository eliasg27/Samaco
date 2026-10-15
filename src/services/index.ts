import { CommerceService } from './commerce';
import { mockCommerce } from './mock';
import { isShopifyConfigured, shopifyCommerce } from './shopify';

/**
 * Provider activo. Con VITE_SHOPIFY_STORE_DOMAIN + VITE_SHOPIFY_STOREFRONT_TOKEN usa Shopify;
 * sin credenciales (o con VITE_COMMERCE_PROVIDER=mock) usa los datos de mock-data.ts.
 */
const forceMock = import.meta.env.VITE_COMMERCE_PROVIDER === 'mock';

export const commerce: CommerceService = isShopifyConfigured && !forceMock ? shopifyCommerce : mockCommerce;

export type { CommerceService, ProductFilter, CheckoutLine, CheckoutResult } from './commerce';
