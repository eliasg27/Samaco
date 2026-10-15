import { Category, Product } from '../types';
import { CommerceService, ProductFilter } from './commerce';

/**
 * Provider Shopify (Storefront API, headless).
 * Shopify recibe catálogo/precios/stock desde Paljet; acá solo leemos y creamos el carrito.
 *
 * Convenciones de datos en Shopify (acordar con quien arme la sync Paljet → Shopify):
 *  - Categorías  = colecciones enlazadas en el menú de navegación `VITE_SHOPIFY_MENU_HANDLE` (default "main-menu").
 *                  Ícono opcional en el metafield de colección `samaco.icono`.
 *  - Marca       = vendor.  Categoría = productType.
 *  - Precio      = precio de la 1ª variante; precio de lista = compareAtPrice (si no hay, = precio).
 *  - Metafields de producto (namespace `samaco`):
 *      precio_contado  (number_decimal)          precio débito/transferencia; si falta, precio −15 %.
 *      cuotas          (number_integer)          cuotas sin interés; si falta, 9.
 *      caracteristicas (list.single_line_text_field)
 *  - Tags: `destacado` (home) y `nuevo` (badge).
 */

const DOMAIN      = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN as string | undefined;
const TOKEN       = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined;
const API_VERSION = (import.meta.env.VITE_SHOPIFY_API_VERSION as string | undefined) ?? '2025-07';
const MENU_HANDLE = (import.meta.env.VITE_SHOPIFY_MENU_HANDLE as string | undefined) ?? 'main-menu';

const CASH_DISCOUNT        = 0.15;
const DEFAULT_INSTALLMENTS = 9;

export const isShopifyConfigured = Boolean(DOMAIN && TOKEN);

async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify Storefront API ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  return json.data as T;
}

// ── Mapeo ────────────────────────────────────────────────────────────

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id handle title description vendor productType tags availableForSale
    featuredImage { url }
    images(first: 5) { nodes { url } }
    variants(first: 1) {
      nodes { id sku availableForSale price { amount } compareAtPrice { amount } }
    }
    cashPrice:    metafield(namespace: "samaco", key: "precio_contado")  { value }
    installments: metafield(namespace: "samaco", key: "cuotas")          { value }
    features:     metafield(namespace: "samaco", key: "caracteristicas") { value }
  }
`;

interface ShopifyProduct {
  id: string; handle: string; title: string; description: string;
  vendor: string; productType: string; tags: string[]; availableForSale: boolean;
  featuredImage: { url: string } | null;
  images: { nodes: { url: string }[] };
  variants: { nodes: {
    id: string; sku: string | null; availableForSale: boolean;
    price: { amount: string }; compareAtPrice: { amount: string } | null;
  }[] };
  cashPrice: { value: string } | null;
  installments: { value: string } | null;
  features: { value: string } | null;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  try { const v = JSON.parse(value); return Array.isArray(v) ? v.map(String) : []; } catch { return []; }
}

function toProduct(p: ShopifyProduct): Product {
  const variant      = p.variants.nodes[0];
  const price        = Math.round(Number(variant?.price.amount ?? 0));
  const compareAt    = variant?.compareAtPrice ? Math.round(Number(variant.compareAtPrice.amount)) : 0;
  const listPrice    = compareAt > price ? compareAt : price;
  const installments = Number(p.installments?.value) || DEFAULT_INSTALLMENTS;
  const cashPrice    = p.cashPrice ? Math.round(Number(p.cashPrice.value)) : Math.round(price * (1 - CASH_DISCOUNT));
  const available    = variant?.availableForSale ?? p.availableForSale;
  const images       = p.images.nodes.map(i => i.url);

  return {
    id: p.id,
    handle: p.handle,
    variantId: variant?.id,
    name: p.title,
    brand: p.vendor,
    category: p.productType,
    price,
    listPrice,
    cashPrice,
    installments,
    installmentPrice: Math.round(price / installments),
    image: p.featuredImage?.url ?? images[0] ?? '',
    images,
    stock: available,
    stockStatus: available ? 'in_stock' : 'out_of_stock',
    sku: variant?.sku ?? '',
    description: p.description,
    features: parseList(p.features?.value),
    discount: compareAt > price ? Math.round((1 - price / compareAt) * 100) : undefined,
    isNew: p.tags.includes('nuevo'),
    isFeatured: p.tags.includes('destacado'),
  };
}

// ── Queries ──────────────────────────────────────────────────────────

const MAX_PAGE = 250;

let categoriesPromise: Promise<Category[]> | null = null;

function getCategories(): Promise<Category[]> {
  categoriesPromise ??= storefront<{
    menu: { items: { title: string; resource: {
      __typename: string; handle?: string; title?: string; description?: string;
      image?: { url: string } | null; icon?: { value: string } | null;
    } | null }[] } | null;
  }>(/* GraphQL */ `
    query Categories($menu: String!) {
      menu(handle: $menu) {
        items {
          title
          resource {
            __typename
            ... on Collection {
              handle title description
              image { url }
              icon: metafield(namespace: "samaco", key: "icono") { value }
            }
          }
        }
      }
    }
  `, { menu: MENU_HANDLE }).then(data =>
    (data.menu?.items ?? [])
      .filter(i => i.resource?.__typename === 'Collection' && i.resource.handle)
      .map(i => ({
        id: i.resource!.handle!,
        name: i.title,
        icon: i.resource!.icon?.value ?? '📦',
        image: i.resource!.image?.url ?? '',
        description: i.resource!.description ?? '',
      })),
  ).catch(err => { categoriesPromise = null; throw err; });
  return categoriesPromise;
}

async function productsQuery(query: string | null, first: number): Promise<Product[]> {
  const data = await storefront<{ products: { nodes: ShopifyProduct[] } }>(/* GraphQL */ `
    ${PRODUCT_FIELDS}
    query Products($first: Int!, $query: String) {
      products(first: $first, query: $query) { nodes { ...ProductFields } }
    }
  `, { first, query });
  return data.products.nodes.map(toProduct);
}

const escapeQuery = (s: string) => s.replace(/["\\]/g, '\\$&');

export const shopifyCommerce: CommerceService = {
  name: 'shopify',

  getCategories,

  async getProducts(filter: ProductFilter = {}) {
    const first = Math.min(filter.limit ?? MAX_PAGE, MAX_PAGE);
    const tagQuery = filter.featured ? 'tag:destacado' : null;

    if (filter.category) {
      const cat = (await getCategories()).find(c => c.name === filter.category);
      if (!cat) return [];
      const data = await storefront<{ collection: { products: { nodes: ShopifyProduct[] } } | null }>(/* GraphQL */ `
        ${PRODUCT_FIELDS}
        query CollectionProducts($handle: String!, $first: Int!) {
          collection(handle: $handle) { products(first: $first) { nodes { ...ProductFields } } }
        }
      `, { handle: cat.id, first });
      const list = (data.collection?.products.nodes ?? []).map(toProduct);
      return filter.featured ? list.filter(p => p.isFeatured) : list;
    }

    return productsQuery(tagQuery, first);
  },

  async getProductsByIds(ids) {
    if (!ids.length) return [];
    const data = await storefront<{ nodes: (ShopifyProduct | null)[] }>(/* GraphQL */ `
      ${PRODUCT_FIELDS}
      query ProductsByIds($ids: [ID!]!) { nodes(ids: $ids) { ... on Product { ...ProductFields } } }
    `, { ids });
    return data.nodes.filter((n): n is ShopifyProduct => Boolean(n?.id)).map(toProduct);
  },

  async getProductsBySkus(skus) {
    if (!skus.length) return [];
    const list = await productsQuery(skus.map(s => `sku:"${escapeQuery(s)}"`).join(' OR '), skus.length);
    // Respetar el orden pedido (los kits listan sus productos en orden).
    return skus.map(sku => list.find(p => p.sku === sku)).filter(p => p !== undefined);
  },

  async searchProducts(query, limit = 10) {
    const q = query.trim();
    if (!q) return [];
    return productsQuery(q, limit);
  },

  async createCheckout(lines) {
    const missing = lines.filter(l => !l.product.variantId);
    if (missing.length) {
      return {
        ok: false,
        reason: 'missing_variant',
        message: `Estos productos no están disponibles para comprar online: ${missing.map(l => l.product.name).join(', ')}.`,
      };
    }
    try {
      const data = await storefront<{ cartCreate: {
        cart: { checkoutUrl: string } | null;
        userErrors: { message: string }[];
      } }>(/* GraphQL */ `
        mutation CartCreate($lines: [CartLineInput!]!) {
          cartCreate(input: { lines: $lines }) {
            cart { checkoutUrl }
            userErrors { message }
          }
        }
      `, { lines: lines.map(l => ({ merchandiseId: l.product.variantId, quantity: l.quantity })) });
      const { cart, userErrors } = data.cartCreate;
      if (!cart || userErrors.length) {
        return { ok: false, reason: 'error', message: userErrors.map(e => e.message).join('; ') || 'No se pudo crear el carrito.' };
      }
      return { ok: true, url: cart.checkoutUrl };
    } catch (err) {
      return { ok: false, reason: 'error', message: (err as Error).message };
    }
  },
};
