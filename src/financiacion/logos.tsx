// Logos de bancos y tarjetas (public/pagos, normalizados a 96px de alto y fondo transparente).
// Se muestran siempre dentro del mismo "chip" blanco para que convivan logos de proporciones muy distintas.

const LOGOS: Record<string, { src: string; alt: string }> = {
  'BNA+':                         { src: '/pagos/bna.webp',        alt: 'BNA+' },
  'Banco Nación':                 { src: '/pagos/bna.webp',        alt: 'Banco Nación' },
  'Visa':                         { src: '/pagos/visa.webp',       alt: 'Visa' },
  'Mastercard':                   { src: '/pagos/mastercard.webp', alt: 'Mastercard' },
  'Naranja X':                    { src: '/pagos/naranjax.webp',   alt: 'Naranja X' },
  'Naranja X Visa':               { src: '/pagos/naranjax.webp',   alt: 'Naranja X Visa' },
  'Cabal':                        { src: '/pagos/cabal.webp',      alt: 'Cabal' },
  'Cencosud':                     { src: '/pagos/cencosud.webp',   alt: 'Cencosud' },
  'Montemar':                     { src: '/pagos/montemar.webp',   alt: 'Montemar' },
  'American Express':             { src: '/pagos/amex.webp',       alt: 'American Express' },
  'American Express no bancaria': { src: '/pagos/amex.webp',       alt: 'American Express no bancaria' },
};

export const tieneLogo = (tarjeta: string) => tarjeta in LOGOS;

const TAMANOS = {
  sm: 'h-8 w-[4.5rem] px-2 py-1.5',
  md: 'h-11 w-24 px-3 py-2',
} as const;

/** Chip con el logo de la tarjeta; si no hay logo (p. ej. "Transferencia bancaria") muestra el nombre. */
export function LogoPago({ tarjeta, size = 'sm' }: { tarjeta: string; size?: keyof typeof TAMANOS }) {
  const logo = LOGOS[tarjeta];
  if (!logo) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600">
        {tarjeta}
      </span>
    );
  }
  return (
    <span title={logo.alt} className={`inline-flex items-center justify-center bg-white rounded-lg border border-slate-200 shadow-sm ${TAMANOS[size]}`}>
      <img src={logo.src} alt={logo.alt} loading="lazy" className="max-h-full max-w-full object-contain" />
    </span>
  );
}

/** Fila de logos; los que no tienen logo van como texto al final. */
export function LogosPago({ tarjetas, size = 'sm', max }: { tarjetas: string[]; size?: keyof typeof TAMANOS; max?: number }) {
  const ordenadas = [...tarjetas.filter(tieneLogo), ...tarjetas.filter(t => !tieneLogo(t))];
  const visibles = max ? ordenadas.slice(0, max) : ordenadas;
  const resto = ordenadas.length - visibles.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibles.map(t => <LogoPago key={t} tarjeta={t} size={size} />)}
      {resto > 0 && <span className="text-[10px] font-bold text-slate-400 px-1">+{resto}</span>}
    </div>
  );
}
