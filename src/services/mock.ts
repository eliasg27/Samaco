import { CommerceService, ProductFilter } from './commerce';
import { CATEGORIES, PRODUCTS } from './mock-data';

/** Provider de desarrollo: datos locales de mock-data.ts. Se usa mientras no haya credenciales de Shopify. */
export const mockCommerce: CommerceService = {
  name: 'mock',

  async getCategories() {
    return CATEGORIES;
  },

  async getProducts(filter: ProductFilter = {}) {
    let list = PRODUCTS;
    // En Shopify "Ofertas" es una colección más; en el mock la armamos con los productos con descuento.
    if (filter.category === 'Ofertas') list = list.filter(p => p.discount);
    else if (filter.category)          list = list.filter(p => p.category === filter.category);
    if (filter.featured) list = list.filter(p => p.isFeatured);
    return filter.limit ? list.slice(0, filter.limit) : list;
  },

  async getProductsByIds(ids) {
    return ids.map(id => PRODUCTS.find(p => p.id === id)).filter(p => p !== undefined);
  },

  async getProductsBySkus(skus) {
    return skus.map(sku => PRODUCTS.find(p => p.sku === sku)).filter(p => p !== undefined);
  },

  async searchProducts(query, limit = 10) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS
      .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, limit);
  },

  async createCheckout() {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'El checkout de Shopify todavía no está conectado. Mientras tanto podés pedir presupuesto por WhatsApp.',
    };
  },
};
