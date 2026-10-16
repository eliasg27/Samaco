import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '../routes';
import { mediosVigentes } from './data';

const INTERVALO_MS = 4000;

/** Carrusel de medios de pago para la home: avanza solo, se puede deslizar con el dedo o con las flechas. */
export function CarruselMediosPago() {
  const medios = mediosVigentes();
  const pista = useRef<HTMLDivElement>(null);
  const [pausado, setPausado] = useState(false);
  const [activo, setActivo] = useState(0);

  const paso = () => {
    const el = pista.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    return card.offsetWidth + gap;
  };

  const mover = (dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const alInicio = el.scrollLeft <= 4;
    if (dir === 1 && alFinal) el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir === -1 && alInicio) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else el.scrollBy({ left: dir * paso(), behavior: 'smooth' });
  };

  // Avance automático. Se pausa con el mouse encima, con foco, al tocar, con la pestaña oculta o si el usuario pidió menos movimiento.
  useEffect(() => {
    if (pausado || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => { if (!document.hidden) mover(1); }, INTERVALO_MS);
    return () => clearInterval(t);
  });

  const onScroll = () => {
    const p = paso();
    if (p && pista.current) setActivo(Math.round(pista.current.scrollLeft / p));
  };

  if (medios.length === 0) return null;

  return (
    <div onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)} onBlurCapture={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      aria-roledescription="carrusel" aria-label="Medios de pago">
      <div className="relative">
        <div ref={pista} onScroll={onScroll}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-4">
          {medios.map(m => (
            <Link key={m.id} to={`${paths.financiacion()}#${m.id}`}
              className="snap-start shrink-0 w-[78%] sm:w-64 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center text-white mb-4`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">{m.nombre}</p>
              <p className={`text-xl font-black ${m.textColor} mb-1`}>{m.beneficio}</p>
              <p className="text-[11px] text-slate-400 leading-snug">{m.resumen}</p>
            </Link>
          ))}
        </div>
        <button onClick={() => mover(-1)} aria-label="Medio de pago anterior"
          className="hidden md:flex absolute -left-5 top-[42%] -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-600 hover:text-[#1B4F8C]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => mover(1)} aria-label="Medio de pago siguiente"
          className="hidden md:flex absolute -right-5 top-[42%] -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-600 hover:text-[#1B4F8C]">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-4 mt-2">
        <div className="flex gap-1.5" aria-hidden>
          {medios.map((m, i) => (
            <span key={m.id} className={`h-1.5 rounded-full transition-all ${i === activo ? 'w-6 bg-[#E8593C]' : 'w-1.5 bg-slate-300'}`} />
          ))}
        </div>
        <Link to={paths.financiacion()} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1B4F8C] hover:text-[#E8593C]">
          Ver todas las financiaciones <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
