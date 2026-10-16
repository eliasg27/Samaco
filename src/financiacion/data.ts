// Medios de pago y financiación — promociones vigentes informadas por Samaco (hasta el 31/10/26 o hasta agotar stock).
// Una promo con `vigenteHasta` vencida deja de mostrarse sola en el carrusel, en /financiacion y en el banner de la home.

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
  vigenteHasta?: string; // YYYY-MM-DD, inclusive
  color: string;      // fondo del ícono / acento
  textColor: string;  // color del titular
}

const VIGENCIA = '2026-10-31';

/** Promo general destacada (banner de la home y cabecera de /financiacion). */
export const PROMO_DESTACADA = {
  titulo: '9 cuotas sin interés',
  bajada: 'Todos los días, en todas las líneas de productos',
  tarjetas: ['BNA+', 'Visa', 'Mastercard', 'Naranja X Visa'],
  canal: 'ambos' as Canal,
  vigenteHasta: VIGENCIA,
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
    vigenteHasta: VIGENCIA,
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
    vigenteHasta: VIGENCIA,
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
    vigenteHasta: VIGENCIA,
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
    vigenteHasta: VIGENCIA,
    color: 'bg-orange-500', textColor: 'text-orange-700',
  },
];

export const LEGAL = 'Aplica para todas las líneas de productos y categorías. Sujeto a modificaciones. Válido hasta el 31/10/26 o hasta agotar stock.';

export const estaVigente = (m: { vigenteHasta?: string }, hoy = new Date()) =>
  !m.vigenteHasta || new Date(`${m.vigenteHasta}T23:59:59-03:00`) >= hoy;

export const mediosVigentes = () => MEDIOS_PAGO.filter(m => estaVigente(m));
export const promoDestacadaVigente = () => (estaVigente(PROMO_DESTACADA) ? PROMO_DESTACADA : null);

/** Máximo descuento contado vigente (para textos como "15% OFF con transferencia"). */
export const descuentoTransferencia = () =>
  mediosVigentes().flatMap(m => m.planes).find(p => p.tipo === 'contado' && p.etiqueta.startsWith('Transferencia'))?.descuento ?? null;
