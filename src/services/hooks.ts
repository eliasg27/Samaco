import { useEffect, useState } from 'react';
import { Category, Product } from '../types';
import { ProductFilter } from './commerce';
import { commerce } from './index';

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

// Cache en memoria por sesión: evita volver a pedir lo mismo al navegar entre vistas.
const cache = new Map<string, unknown>();

function useCommerceQuery<T>(key: string | null, fetcher: () => Promise<T>, initial: T): AsyncState<T> {
  const cached = key !== null && cache.has(key);
  const [state, setState] = useState<AsyncState<T>>({
    data: cached ? (cache.get(key!) as T) : initial,
    loading: key !== null && !cached,
    error: null,
  });

  useEffect(() => {
    if (key === null) { setState({ data: initial, loading: false, error: null }); return; }
    if (cache.has(key)) { setState({ data: cache.get(key) as T, loading: false, error: null }); return; }
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    fetcher()
      .then(data => {
        cache.set(key, data);
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: Error) => {
        console.error(`[commerce] ${key}`, error);
        if (!cancelled) setState({ data: initial, loading: false, error });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export const useCategories = () =>
  useCommerceQuery('categories', () => commerce.getCategories(), EMPTY_CATEGORIES);

export const useProducts = (filter: ProductFilter = {}) =>
  useCommerceQuery(`products:${JSON.stringify(filter)}`, () => commerce.getProducts(filter), EMPTY_PRODUCTS);

export const useProductsByIds = (ids: string[]) =>
  useCommerceQuery(ids.length ? `ids:${ids.join(',')}` : null, () => commerce.getProductsByIds(ids), EMPTY_PRODUCTS);

export const useProductsBySkus = (skus: string[]) =>
  useCommerceQuery(skus.length ? `skus:${skus.join(',')}` : null, () => commerce.getProductsBySkus(skus), EMPTY_PRODUCTS);

/** Búsqueda con debounce; no consulta con menos de 2 caracteres. */
export function useProductSearch(query: string, limit = 4, delayMs = 250) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), delayMs);
    return () => clearTimeout(t);
  }, [query, delayMs]);
  const q = debounced.trim().toLowerCase();
  return useCommerceQuery(q.length >= 2 ? `search:${limit}:${q}` : null, () => commerce.searchProducts(q, limit), EMPTY_PRODUCTS);
}
