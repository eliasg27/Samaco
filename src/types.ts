export interface Product {
  id: string;
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
  features: string[];
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

export type View = 'home' | 'category' | 'product' | 'calculadora' | 'sucursales';

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  description: string;
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
