// Opciones de los metaobjetos de contenido (lo que se elige en el admin de Shopify) y su traducción al sitio.
// Las usan api/contenido.ts y scripts/contenido-setup.mjs (que repite los textos de las opciones).
import type { View } from '../types';
import type { Canal } from '../financiacion/data';

export const CANAL_OPCION: Record<string, Canal> = {
  'Online y en sucursales': 'ambos',
  'Solo online': 'online',
  'Solo en sucursales': 'sucursal',
};

export const VIGENCIA_OPCION = { mensual: 'Se renueva cada mes', fecha: 'Termina en una fecha' } as const;

export const TIPO_PLAN_OPCION: Record<string, 'contado' | 'sin-interes' | 'fijas'> = {
  'Contado (1 pago)': 'contado',
  'Cuotas sin interés': 'sin-interes',
  'Cuotas fijas': 'fijas',
};

/** Colores de acento de cada promo (clases completas para que Tailwind las incluya). */
export const COLOR_PROMO: Record<string, { color: string; textColor: string }> = {
  Azul:    { color: 'bg-[#1B4F8C]', textColor: 'text-[#1B4F8C]' },
  Verde:   { color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  Violeta: { color: 'bg-purple-600', textColor: 'text-purple-700' },
  Naranja: { color: 'bg-orange-500', textColor: 'text-orange-700' },
  Rojo:    { color: 'bg-[#E8593C]', textColor: 'text-[#E8593C]' },
};

export const COLOR_ETIQUETA: Record<string, string> = { Azul: '#1B4F8C', Naranja: '#E8593C' };

export const DESTINO_OPCION: Record<string, View> = {
  'Financiación': 'financiacion',
  'Sucursales': 'sucursales',
  'Calculadora': 'calculadora',
  'Círculo de Profesionales': 'profesionales',
  'Catálogo': 'category',
  'Inicio': 'home',
};

export const IMAGENES_BANNER = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=1400',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1400',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1400',
];
/** Imagen por defecto para un banner cargado en Shopify sin foto. */
export const imagenBannerPorDefecto = (i: number) => IMAGENES_BANNER[i % IMAGENES_BANNER.length];
