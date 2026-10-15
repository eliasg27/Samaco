import { Category, Product } from '../types';

/**
 * Contrato entre el front y la fuente de datos.
 * Hoy lo implementa el mock (mock.ts); en producción, Shopify Storefront API (shopify.ts),
 * que a su vez recibe catálogo, precios y stock sincronizados desde Paljet.
 * Los componentes nunca importan un provider directo: usan `commerce` (index.ts) o los hooks.
 */

export interface ProductFilter {
  /** Nombre de la categoría (como se muestra en el menú). */
  category?: string;
  featured?: boolean;
  limit?: number;
}

export interface CheckoutLine {
  product: Product;
  quantity: number;
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'not_configured' | 'missing_variant' | 'error'; message: string };

export interface CommerceService {
  readonly name: 'mock' | 'shopify';
  getCategories(): Promise<Category[]>;
  getProducts(filter?: ProductFilter): Promise<Product[]>;
  /** Producto por handle (el slug de la URL /productos/:handle). null si no existe. */
  getProductByHandle(handle: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  getProductsBySkus(skus: string[]): Promise<Product[]>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;
  /** Crea el carrito en la plataforma y devuelve la URL del checkout (Shopify). */
  createCheckout(lines: CheckoutLine[]): Promise<CheckoutResult>;
}
