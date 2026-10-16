import { ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '../routes';
import { CANALES, Canal, mediosVigentes, promoDestacadaVigente } from './data';
import { LogosPago } from './logos';

interface Tarjeta {
  id: string;
  href: string;
  nombre: string;
  beneficio: string;
  canal: Canal;
  tarjetas: string[];
  color: string;
  textColor: string;
  destacada?: boolean;
}

/**
 * Cinta de medios de pago para la home: se desplaza sola en loop continuo (CSS, sin JS),
 * se pausa con el mouse encima o con foco, y queda quieta y deslizable si el usuario pidió menos movimiento.
 */
export function CarruselMediosPago() {
  const promo = promoDestacadaVigente();
  const items: Tarjeta[] = [
    ...(promo ? [{
      id: 'destacada', href: paths.financiacion(), nombre: promo.bajada, beneficio: promo.titulo,
      canal: promo.canal, tarjetas: promo.tarjetas, color: 'bg-[#E8593C]', textColor: 'text-[#E8593C]', destacada: true,
    }] : []),
    ...mediosVigentes().map(m => ({
      id: m.id, href: `${paths.financiacion()}#${m.id}`, nombre: m.nombre, beneficio: m.beneficio,
      canal: m.canal, tarjetas: m.tarjetas, color: m.color, textColor: m.textColor,
    })),
  ];

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-2xl p-6">
        Estamos actualizando las promociones. Consultá las financiaciones vigentes por WhatsApp.
      </p>
    );
  }

  const card = (t: Tarjeta, duplicado: boolean) => (
    <Link key={`${t.id}${duplicado ? '-b' : ''}`} to={t.href} tabIndex={duplicado ? -1 : undefined} aria-hidden={duplicado || undefined}
      className={`group/card relative shrink-0 w-72 mr-4 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden flex flex-col
        ${duplicado ? 'motion-reduce:hidden' : ''}
        ${t.destacada ? 'bg-[#0d2a4d] border-[#0d2a4d] text-white' : 'bg-white border-slate-100'}`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${t.color}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center text-white`}>
            {t.destacada ? <Sparkles className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full
            ${t.destacada ? 'bg-white/10 text-white/80' : t.canal === 'sucursal' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {CANALES[t.canal]}
          </span>
        </div>
        <p className={`text-2xl font-black leading-tight mb-1 ${t.destacada ? 'text-white' : t.textColor}`}>{t.beneficio}</p>
        <p className={`text-xs font-semibold mb-4 ${t.destacada ? 'text-slate-300' : 'text-slate-500'}`}>{t.nombre}</p>
        <div className="mt-auto">
          <LogosPago tarjetas={t.tarjetas} max={4} />
        </div>
      </div>
    </Link>
  );

  return (
    <div>
      <div className="marquee marquee-mask overflow-hidden motion-reduce:overflow-x-auto no-scrollbar -mx-4 px-4 py-2"
        role="region" aria-label="Medios de pago y financiación">
        {/* La lista va duplicada para que el loop no tenga corte; la copia está oculta para lectores de pantalla y teclado. */}
        <div className="marquee-track flex" style={{ ['--marquee-dur' as string]: `${items.length * 7}s` }}>
          {items.map(t => card(t, false))}
          {items.map(t => card(t, true))}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Link to={paths.financiacion()} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1B4F8C] hover:text-[#E8593C]">
          Ver todas las financiaciones <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
