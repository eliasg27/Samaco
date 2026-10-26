// Medios de pago y financiación — promociones informadas por Samaco.
//
// Estos datos son el RESPALDO: el sitio los reemplaza por los que se cargan en Shopify (metaobjetos
// "Promoción de pago", "Banner de la home" y "Textos del sitio", ver api/contenido.ts y src/contenido/).
//
// Vigencia: 'mensual' = se renueva cada mes, nunca se oculta y la leyenda muestra el último día del mes en curso.
// Una fecha (YYYY-MM-DD) = promo especial que deja de mostrarse después de ese día.
// En los textos, {vigencia} se reemplaza por la fecha que corresponda ("30 de noviembre de 2026").

export type Canal = 'online' | 'sucursal' | 'ambos';

export const CANALES: Record<Canal, string> = {
  online:   'Compra online',
  sucursal: 'Solo en sucursales',
  ambos:    'Online y en sucursales',
};

export interface Plan {
  etiqueta: string;
  /** contado = un pago; sin-interes = cuotas sin interés; fijas = cuotas fijas (con interés del emisor). */
  tipo: 'contado' | 'sin-interes' | 'fijas';
  cuotas: number;
  /** % de descuento sobre el precio de lista. */
  descuento?: number;
}

export interface MedioPago {
  id: string;
  nombre: string;
  /** Titular corto para el carrusel. */
  beneficio: string;
  canal: Canal;
  tarjetas: string[];
  planes: Plan[];
  notas: string[];
  vigencia: Vigencia;
  /** Fecha desde la que se muestra (YYYY-MM-DD). Sirve para dejar cargada la promo del mes siguiente. */
  desde?: string;
  color: string;      // fondo del ícono / acento
  textColor: string;  // color del titular
}

/** 'mensual' o una fecha de fin YYYY-MM-DD (inclusive). */
export type Vigencia = 'mensual' | string;

const VIGENCIA: Vigencia = 'mensual';

/** Promo general destacada (banner de la home y cabecera de /financiacion). */
export interface PromoDestacada {
  titulo: string;
  bajada: string;
  tarjetas: string[];
  canal: Canal;
  vigencia: Vigencia;
}

export const PROMO_DESTACADA: PromoDestacada = {
  titulo: '9 cuotas sin interés',
  bajada: 'Todos los días, en todas las líneas de productos',
  tarjetas: ['BNA+', 'Visa', 'Mastercard', 'Naranja X Visa'],
  canal: 'ambos',
  vigencia: VIGENCIA,
};

const planesTarjeta = (ultimo: Plan): Plan[] => [
  { etiqueta: '3 cuotas sin interés', tipo: 'sin-interes', cuotas: 3, descuento: 5 },
  { etiqueta: '6 cuotas sin interés', tipo: 'sin-interes', cuotas: 6, descuento: 3 },
  { etiqueta: '9 cuotas sin interés', tipo: 'sin-interes', cuotas: 9 },
  ultimo,
];

export const MEDIOS_PAGO: MedioPago[] = [
  {
    id: 'contado-online',
    nombre: 'Transferencia, débito y crédito en 1 pago',
    beneficio: 'Hasta 15% OFF',
    canal: 'online',
    tarjetas: ['Transferencia bancaria', 'Tarjeta de débito', 'Tarjeta de crédito'],
    planes: [
      { etiqueta: 'Transferencia bancaria', tipo: 'contado', cuotas: 1, descuento: 15 },
      { etiqueta: 'Tarjeta de débito',      tipo: 'contado', cuotas: 1, descuento: 10 },
      { etiqueta: 'Crédito en 1 cuota',     tipo: 'contado', cuotas: 1, descuento: 10 },
    ],
    notas: ['Promoción vía página web.'],
    vigencia: VIGENCIA,
    color: 'bg-emerald-500', textColor: 'text-emerald-700',
  },
  {
    id: 'bna',
    nombre: 'BNA+',
    beneficio: 'Hasta 12 cuotas sin interés',
    canal: 'ambos',
    tarjetas: ['BNA+'],
    planes: planesTarjeta({ etiqueta: '12 cuotas sin interés', tipo: 'sin-interes', cuotas: 12 }),
    notas: ['Promoción vía sucursales y tienda web, todos los días.'],
    vigencia: VIGENCIA,
    color: 'bg-[#1B4F8C]', textColor: 'text-[#1B4F8C]',
  },
  {
    id: 'visa-mastercard',
    nombre: 'Visa, Mastercard y Naranja Visa',
    beneficio: 'Hasta 9 cuotas sin interés',
    canal: 'ambos',
    tarjetas: ['Visa', 'Mastercard', 'Naranja X Visa'],
    planes: planesTarjeta({ etiqueta: '12 cuotas fijas', tipo: 'fijas', cuotas: 12 }),
    notas: ['Incluye Naranja Visa.', 'AMEX bancaria: solo 1 cuota.'],
    vigencia: VIGENCIA,
    color: 'bg-purple-600', textColor: 'text-purple-700',
  },
  {
    id: 'tarjetas-sucursal',
    nombre: 'Naranja X, Cabal, Cencosud, Montemar y American Express',
    beneficio: 'Hasta 9 cuotas sin interés',
    canal: 'sucursal',
    tarjetas: ['Naranja X', 'Cabal', 'Cencosud', 'Montemar', 'American Express no bancaria'],
    planes: planesTarjeta({ etiqueta: '12 cuotas fijas', tipo: 'fijas', cuotas: 12 }),
    notas: ['Naranja X: hasta 6 cuotas.'],
    vigencia: VIGENCIA,
    color: 'bg-orange-500', textColor: 'text-orange-700',
  },
];

export const LEGAL = 'Aplica para todas las líneas de productos y categorías. Sujeto a modificaciones. Válido hasta el {vigencia} o hasta agotar stock.';

/** Mensajes extra de la cinta superior (además de las promos, WhatsApp, sucursales y el Círculo). */
export const CINTA: string[] = ['Envío gratis en compras +$900.000'];

const fechaLarga = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

/** Último día de vigencia: fin del mes en curso (mensual) o la fecha indicada. */
export function finDeVigencia(v: Vigencia, hoy = new Date()): Date {
  if (v === 'mensual') {
    const ar = new Date(hoy.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    return new Date(ar.getFullYear(), ar.getMonth() + 1, 0, 12);
  }
  return new Date(`${v}T12:00:00-03:00`);
}

export const textoVigencia = (v: Vigencia, hoy = new Date()) => fechaLarga.format(finDeVigencia(v, hoy));

/** Reemplaza {vigencia} en un texto editable. */
export const conVigencia = (texto: string, v: Vigencia = 'mensual') => texto.replace(/\{vigencia\}/g, textoVigencia(v));

/**
 * Se muestra si ya empezó (`desde`, inclusive, hora Argentina) y no terminó: las mensuales no terminan nunca;
 * las de fecha, hasta ese día inclusive.
 */
export const estaVigente = (m: { vigencia?: Vigencia; desde?: string }, hoy = new Date()) =>
  (!m.desde || new Date(`${m.desde}T00:00:00-03:00`) <= hoy)
  && (!m.vigencia || m.vigencia === 'mensual' || new Date(`${m.vigencia}T23:59:59-03:00`) >= hoy);

/** Máximo descuento contado (para textos como "15% OFF con transferencia"). */
export const descuentoTransferencia = (medios: MedioPago[]) =>
  medios.flatMap(m => m.planes).find(p => p.tipo === 'contado' && p.etiqueta.startsWith('Transferencia'))?.descuento ?? null;
