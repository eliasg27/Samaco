import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { View } from '../types';
import {
  CINTA, LEGAL, MEDIOS_PAGO, MedioPago, PROMO_DESTACADA, PromoDestacada, Vigencia, estaVigente,
} from '../financiacion/data';
import { IMAGENES_BANNER } from './opciones';
export { imagenBannerPorDefecto } from './opciones';

/**
 * Contenido editable del sitio (promos, banners de la home, cinta superior, leyenda legal).
 * Se edita en Shopify → Contenido → Metaobjetos y llega por /api/contenido. Mientras carga, o si
 * Shopify no responde o no tiene nada cargado, se usan los datos del código (financiacion/data.ts y BANNERS).
 */

export interface Banner {
  id: string;
  etiqueta: string;
  /** Admite saltos de línea. */
  titulo: string;
  /** Admite {vigencia}. */
  bajada: string;
  boton: string;
  destino: View;
  imagen: string;
  colorEtiqueta: string;
  vigencia: Vigencia;
}

export interface Contenido {
  medios: MedioPago[];
  destacada: PromoDestacada | null;
  banners: Banner[];
  cinta: string[];
  legal: string;
}

export const BANNERS: Banner[] = [
  {
    id: 'cuotas', etiqueta: 'Todos los días', titulo: '9 Cuotas\nSin Interés',
    bajada: 'Con BNA+, Visa, Mastercard y Naranja X Visa, en todas las líneas de productos. Vigente hasta el {vigencia} o hasta agotar stock.',
    boton: 'Ver financiación', destino: 'financiacion', imagen: IMAGENES_BANNER[0], colorEtiqueta: '#1B4F8C', vigencia: 'mensual',
  },
  {
    id: 'transferencia', etiqueta: '15% OFF', titulo: 'Pagá con\nTransferencia',
    bajada: 'Comprando en la web: 15% OFF con transferencia bancaria y 10% OFF con débito o crédito en 1 pago. Vigente hasta el {vigencia}.',
    boton: 'Ver medios de pago', destino: 'financiacion', imagen: IMAGENES_BANNER[1], colorEtiqueta: '#E8593C', vigencia: 'mensual',
  },
  {
    id: 'stock', etiqueta: 'Samaco', titulo: 'Stock\nGarantizado',
    bajada: 'Acopio de materiales sin cargo, congelá el precio hoy y retirá cuando necesitás. Entrega en obra con flota propia.',
    boton: 'Conocer más', destino: 'sucursales', imagen: IMAGENES_BANNER[2], colorEtiqueta: '#1B4F8C', vigencia: 'mensual',
  },
];

export const CONTENIDO_POR_DEFECTO: Contenido = {
  medios: MEDIOS_PAGO,
  destacada: PROMO_DESTACADA,
  banners: BANNERS,
  cinta: CINTA,
  legal: LEGAL,
};

/** Lo que viene de Shopify reemplaza al código solo si trae algo (una lista vacía no deja el sitio sin promos). */
function combinar(base: Contenido, remoto: Partial<Contenido>): Contenido {
  return {
    medios: remoto.medios?.length ? remoto.medios : base.medios,
    destacada: remoto.destacada !== undefined ? remoto.destacada : base.destacada,
    banners: remoto.banners?.length ? remoto.banners : base.banners,
    cinta: remoto.cinta?.length ? remoto.cinta : base.cinta,
    legal: remoto.legal?.trim() ? remoto.legal : base.legal,
  };
}

const Ctx = createContext<Contenido>(CONTENIDO_POR_DEFECTO);

export function ContenidoProvider({ children }: { children: ReactNode }) {
  const [contenido, setContenido] = useState(CONTENIDO_POR_DEFECTO);
  useEffect(() => {
    let vivo = true;
    fetch('/api/contenido')
      .then(r => (r.ok ? r.json() : null))
      .then((remoto: Partial<Contenido> | null) => { if (vivo && remoto) setContenido(combinar(CONTENIDO_POR_DEFECTO, remoto)); })
      .catch(() => { /* sin conexión o sin Shopify: queda el contenido del código */ });
    return () => { vivo = false; };
  }, []);
  return <Ctx.Provider value={contenido}>{children}</Ctx.Provider>;
}

/** Contenido con las promos y banners vencidos ya filtrados (las mensuales nunca vencen). */
export function useContenido() {
  const c = useContext(Ctx);
  return {
    ...c,
    medios: c.medios.filter(m => estaVigente(m)),
    destacada: c.destacada && estaVigente(c.destacada) ? c.destacada : null,
    banners: c.banners.filter(b => estaVigente(b)),
  };
}
