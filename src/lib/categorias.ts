import { Category } from '../types';

/** Categorías + subcategorías en una sola lista (para buscar por handle o por nombre). */
export const aplanarCategorias = (cats: Category[]): Category[] =>
  cats.flatMap(c => [c, ...(c.children ?? [])]);
