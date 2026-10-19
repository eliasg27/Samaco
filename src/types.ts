export interface Product {
  id: string;
  /** Slug para URLs (handle de Shopify). */
  handle?: string;
  /** ID de la variante en Shopify (gid://shopify/ProductVariant/…). Lo necesita el checkout. */
  variantId?: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  price: number;
  listPrice: number;
  cashPrice: number;
  installments?: number;
  installmentPrice?: number;
  image: string;
  images?: string[];
  stock: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  sku: string;
  description: string;
  /** Descripción con formato (Shopify: descriptionHtml, la cargan desde el admin). */
  descriptionHtml?: string;
  features: string[];
  /** Especificaciones técnicas (Shopify: metafield samaco.especificaciones, JSON {"Medida": "60x60", …}). */
  specs?: { label: string; value: string }[];
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

export type View =
  | 'home' | 'category' | 'product' | 'calculadora' | 'sucursales' | 'financiacion'
  // Círculo de Profesionales
  | 'profesionales' | 'pro-ingresar' | 'pro-registro' | 'panel';

export interface Category {
  /** En Shopify es el handle de la colección. */
  id: string;
  name: string;
  icon: string;
  image: string;
  description: string;
  /** Subcategorías (en Shopify: elementos anidados del menú del sitio). */
  children?: Category[];
  /** id de la categoría padre, solo en subcategorías. */
  parentId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: number;
  rating: number;
  userName: string;
  date: string;
  title: string;
  comment: string;
}
