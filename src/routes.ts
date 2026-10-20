import { matchPath } from 'react-router';
import { View } from './types';

/**
 * Mapa de URLs del sitio. Los handles (categorías, productos) son los mismos que en Shopify.
 * El Círculo de Profesionales vive bajo /CPS (el matcheo no distingue mayúsculas: /cps también funciona).
 */
export const CPS = '/CPS';

export const PANEL_TABS = ['resumen', 'eventos', 'descuentos', 'red', 'perfil'] as const;
export type PanelTab = (typeof PANEL_TABS)[number];

export const paths = {
  home:        () => '/',
  categoria:   (handle?: string) => (handle ? `/categorias/${handle}` : '/categorias'),
  producto:    (handle: string) => `/productos/${handle}`,
  buscar:      (q: string) => `/buscar?q=${encodeURIComponent(q.trim())}`,
  calculadora: () => '/calculadora',
  sucursales:  () => '/sucursales',
  financiacion: () => '/financiacion',
  cps:         () => CPS,
  ingresar:    () => `${CPS}/ingresar`,
  registro:    () => `${CPS}/registro`,
  panel:       (tab: PanelTab = 'resumen') => (tab === 'resumen' ? `${CPS}/panel` : `${CPS}/panel/${tab}`),
  evento:      (id: string) => `${CPS}/eventos/${id}`,
};

/** Rutas sin parámetros, para navegar por nombre de vista. */
export const VIEW_PATHS: Partial<Record<View, string>> = {
  'home':          paths.home(),
  'category':      paths.categoria(),
  'calculadora':   paths.calculadora(),
  'sucursales':    paths.sucursales(),
  'financiacion':  paths.financiacion(),
  'profesionales': paths.cps(),
  'pro-ingresar':  paths.ingresar(),
  'pro-registro':  paths.registro(),
  'panel':         paths.panel(),
};

export type Route =
  | { view: 'home' }
  | { view: 'category'; handle?: string }
  | { view: 'product'; handle: string }
  | { view: 'search' }
  | { view: 'calculadora' }
  | { view: 'sucursales' }
  | { view: 'financiacion' }
  | { view: 'profesionales' }
  | { view: 'pro-ingresar' }
  | { view: 'pro-registro' }
  | { view: 'panel'; tab: PanelTab }
  | { view: 'evento'; id: string }
  | { view: 'not-found' };

const m = (pattern: string, pathname: string) => matchPath({ path: pattern, end: true }, pathname);

export function parseRoute(pathname: string): Route {
  let r;
  if (m('/', pathname))                         return { view: 'home' };
  if (m('/categorias', pathname))               return { view: 'category' };
  if ((r = m('/categorias/:handle', pathname))) return { view: 'category', handle: r.params.handle! };
  if ((r = m('/productos/:handle', pathname)))  return { view: 'product', handle: r.params.handle! };
  if (m('/buscar', pathname))                   return { view: 'search' };
  if (m('/calculadora', pathname))              return { view: 'calculadora' };
  if (m('/sucursales', pathname))               return { view: 'sucursales' };
  if (m('/financiacion', pathname))             return { view: 'financiacion' };
  if (m(CPS, pathname))                         return { view: 'profesionales' };
  if (m(`${CPS}/ingresar`, pathname))           return { view: 'pro-ingresar' };
  // Vuelta del login con código de Shopify (Customer Account API): la resuelve la vista de ingreso.
  if (m(`${CPS}/acceso`, pathname))             return { view: 'pro-ingresar' };
  if (m(`${CPS}/registro`, pathname))           return { view: 'pro-registro' };
  if (m(`${CPS}/panel`, pathname))              return { view: 'panel', tab: 'resumen' };
  if ((r = m(`${CPS}/panel/:tab`, pathname))) {
    const tab = r.params.tab as PanelTab;
    return PANEL_TABS.includes(tab) ? { view: 'panel', tab } : { view: 'not-found' };
  }
  if ((r = m(`${CPS}/eventos/:id`, pathname)))  return { view: 'evento', id: r.params.id! };
  return { view: 'not-found' };
}
