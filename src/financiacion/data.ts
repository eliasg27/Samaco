// Medios de pago y financiación. TODO: confirmar condiciones vigentes con Samaco antes de publicar.
// Una promo con `vigenteHasta` vencida deja de mostrarse sola en el carrusel y en la página.

export interface MedioPago {
  id: string;
  nombre: string;
  beneficio: string;
  resumen: string;
  /** Condiciones para la página de financiación. */
  condiciones: string[];
  tarjetas?: string[];
  /** Para el simulador: cuotas sin interés, o descuento sobre el precio de lista. */
  cuotasSinInteres?: number;
  descuento?: number;
  compraMinima?: number;
  vigenteHasta?: string; // YYYY-MM-DD, inclusive
  color: string;      // fondo del ícono
  textColor: string;  // color del beneficio
}

export const MEDIOS_PAGO: MedioPago[] = [
  {
    id: 'debito-transferencia',
    nombre: 'Transferencia / Débito',
    beneficio: '15% OFF',
    resumen: 'Todos los días, sin mínimo de compra',
    condiciones: ['15% de descuento sobre el precio de lista.', 'Válido todos los días, en todos los productos.', 'Sin monto mínimo de compra.'],
    tarjetas: ['Transferencia bancaria', 'Tarjetas de débito'],
    descuento: 15,
    color: 'bg-emerald-500', textColor: 'text-emerald-700',
  },
  {
    id: 'bna',
    nombre: 'BNA+',
    beneficio: '18 cuotas sin interés',
    resumen: 'Mínimo $400.000',
    condiciones: ['18 cuotas sin interés pagando con BNA+.', 'Compra mínima de $400.000.'],
    tarjetas: ['Tarjetas del Banco Nación a través de BNA+'],
    cuotasSinInteres: 18,
    compraMinima: 400000,
    vigenteHasta: '2026-04-30',
    color: 'bg-[#1B4F8C]', textColor: 'text-[#1B4F8C]',
  },
  {
    id: 'visa-mastercard',
    nombre: 'Visa / Mastercard',
    beneficio: '9 cuotas sin interés',
    resumen: '3 cuotas −5% · 6 cuotas −3% · 12 fijas',
    condiciones: ['9 cuotas sin interés.', '3 cuotas con 5% de descuento.', '6 cuotas con 3% de descuento.', '12 cuotas fijas.'],
    tarjetas: ['Visa', 'Mastercard'],
    cuotasSinInteres: 9,
    color: 'bg-purple-600', textColor: 'text-purple-700',
  },
  {
    id: 'naranja-cabal',
    nombre: 'NaranjaX / Cabal',
    beneficio: '6 cuotas sin interés',
    resumen: 'Financiación especial para clientes adheridos',
    condiciones: ['6 cuotas sin interés.', 'Para clientes adheridos al programa.'],
    tarjetas: ['Naranja X', 'Cabal'],
    cuotasSinInteres: 6,
    color: 'bg-orange-500', textColor: 'text-orange-700',
  },
  {
    id: 'amex',
    nombre: 'Amex no bancaria',
    beneficio: '6 cuotas sin interés',
    resumen: 'American Express participante del programa',
    condiciones: ['6 cuotas sin interés.', 'American Express no bancaria participante del programa.'],
    tarjetas: ['American Express'],
    cuotasSinInteres: 6,
    color: 'bg-slate-700', textColor: 'text-slate-700',
  },
];

export const estaVigente = (m: MedioPago, hoy = new Date()) =>
  !m.vigenteHasta || new Date(`${m.vigenteHasta}T23:59:59-03:00`) >= hoy;

export const mediosVigentes = () => MEDIOS_PAGO.filter(m => estaVigente(m));
