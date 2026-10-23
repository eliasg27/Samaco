import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Info, MapPin, Monitor, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router';
import { CANALES, Canal, MedioPago, Plan, conVigencia, textoVigencia } from './data';
import { useContenido } from '../contenido';
import { LogosPago } from './logos';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const CanalBadge = ({ canal }: { canal: Canal }) => {
  const Icon = canal === 'sucursal' ? MapPin : Monitor;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full
      ${canal === 'sucursal' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      <Icon className="w-3 h-3" />{CANALES[canal]}
    </span>
  );
};

/** Resultado del simulador para un plan. Las cuotas fijas dependen de la tasa del emisor: no se calculan. */
function simular(plan: Plan, monto: number) {
  const conDescuento = monto * (1 - (plan.descuento ?? 0) / 100);
  if (plan.tipo === 'contado') return { valor: fmt(conDescuento), detalle: plan.descuento ? `Ahorrás ${fmt(monto - conDescuento)}` : 'En un pago' };
  if (plan.tipo === 'sin-interes') return {
    valor: `${plan.cuotas} × ${fmt(conDescuento / plan.cuotas)}`,
    detalle: plan.descuento ? `Total ${fmt(conDescuento)} (${plan.descuento}% OFF)` : `Total ${fmt(conDescuento)} sin interés`,
  };
  return { valor: `${plan.cuotas} cuotas fijas`, detalle: 'Valor de cuota según tu tarjeta' };
}

function PlanesTabla({ medio }: { medio: MedioPago }) {
  return (
    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {medio.planes.map(p => (
        <li key={p.etiqueta} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-slate-700">{p.etiqueta}</span>
          {p.descuento
            ? <span className="text-xs font-black text-white bg-[#E8593C] px-2 py-0.5 rounded-full">−{p.descuento}% OFF</span>
            : <span className="text-[10px] font-bold uppercase text-slate-400">{p.tipo === 'fijas' ? 'Fijas' : 'Sin interés'}</span>}
        </li>
      ))}
    </ul>
  );
}

/** /financiacion: todas las promociones vigentes, separadas por canal, con simulador. */
export function FinanciacionView() {
  const { medios, destacada: promo, legal } = useContenido();
  const { hash } = useLocation();
  const [monto, setMonto] = useState(500000);
  const [medioSim, setMedioSim] = useState(medios[0]?.id ?? '');
  const seleccionado = medios.find(m => m.id === medioSim) ?? medios[0];

  const online   = medios.filter(m => m.canal !== 'sucursal');
  const sucursal = medios.filter(m => m.canal === 'sucursal');

  // Al entrar desde una tarjeta del carrusel (/financiacion#bna) ir directo a ese medio.
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
    return () => clearTimeout(t);
  }, [hash]);

  const bloque = (titulo: string, subtitulo: string, lista: MedioPago[]) => lista.length > 0 && (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-800">{titulo}</h2>
        <p className="text-sm text-slate-500">{subtitulo}</p>
      </div>
      {lista.map(m => (
        <article key={m.id} id={m.id} className="scroll-mt-28 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
          <span className={`absolute inset-y-0 left-0 w-1 ${m.color}`} />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500">{m.nombre}</p>
              <h3 className={`text-2xl font-black ${m.textColor}`}>{m.beneficio}</h3>
            </div>
            <CanalBadge canal={m.canal} />
          </div>
          <PlanesTabla medio={m} />
          <div className="mt-4 flex flex-wrap gap-2">
            <LogosPago tarjetas={m.tarjetas} size="md" />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {m.notas.join(' ')} Vigente hasta el {textoVigencia(m.vigencia)} o hasta agotar stock.
          </p>
        </article>
      ))}
    </section>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="bg-[#1B4F8C] text-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E8593C] mb-3">Medios de pago</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Financiación y promociones</h1>
            <p className="text-slate-200 max-w-xl">Todas las formas de pagar tus materiales en Samaco, online y en nuestras sucursales.</p>
          </div>
          {promo && (
            <div className="bg-white/10 border border-white/15 rounded-3xl p-6 backdrop-blur">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#E8593C] mb-2"><Sparkles className="w-3.5 h-3.5" />Todos los días</p>
              <p className="text-4xl md:text-5xl font-black leading-none">{promo.titulo}</p>
              <p className="text-sm text-slate-200 mt-2">{promo.bajada}.</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <LogosPago tarjetas={promo.tarjetas} size="md" />
              </div>
              <p className="text-[11px] text-slate-300 mt-4">Compra presencial y web. Vigente hasta el {textoVigencia(promo.vigencia)} o hasta agotar stock.</p>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {medios.length === 0 && (
            <p className="text-slate-500 bg-white border border-slate-100 rounded-2xl p-6">Estamos actualizando las promociones. Consultá las financiaciones vigentes por WhatsApp.</p>
          )}
          {bloque('Comprando en la web', 'Disponibles en samaco online (y la mayoría también en sucursales).', online)}
          {bloque('En nuestras sucursales', 'Promociones válidas solo para compras presenciales.', sucursal)}
          <p className="flex gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 shrink-0" />{conVigencia(legal)}
          </p>
        </div>

        {/* Simulador */}
        {seleccionado && (
          <aside className="lg:sticky lg:top-28 h-fit bg-white rounded-2xl border border-slate-100 shadow-xl p-6">
            <h2 className="font-black text-slate-800 flex items-center gap-2 mb-1"><Calculator className="w-5 h-5 text-[#1B4F8C]" />Simulá tu compra</h2>
            <p className="text-xs text-slate-400 mb-4">Ingresá el total a precio de lista y elegí cómo pagar.</p>
            <label className="block mb-4">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Monto</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input type="number" inputMode="numeric" min={0} step={1000} value={monto || ''} onChange={e => setMonto(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#1B4F8C] focus:bg-white rounded-xl pl-8 pr-4 py-3 text-lg font-black text-slate-800 outline-none" />
              </div>
            </label>
            <label className="block mb-4">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Medio de pago</span>
              <select value={seleccionado.id} onChange={e => setMedioSim(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#1B4F8C] rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none">
                {medios.map(m => <option key={m.id} value={m.id}>{m.nombre}{m.canal === 'sucursal' ? ' (sucursales)' : ''}</option>)}
              </select>
            </label>
            <ul className="divide-y divide-slate-100">
              {seleccionado.planes.map(p => {
                const r = monto > 0 ? simular(p, monto) : null;
                return (
                  <li key={p.etiqueta} className="py-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">{p.etiqueta}{p.descuento ? ` · −${p.descuento}%` : ''}</span>
                    <span className="text-right">
                      <span className={`block text-sm font-black ${p.tipo === 'fijas' ? 'text-slate-500' : 'text-slate-800'}`}>{r?.valor ?? '—'}</span>
                      {r && <span className="block text-[10px] text-slate-400">{r.detalle}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3"><CanalBadge canal={seleccionado.canal} /></p>
          </aside>
        )}
      </div>
    </motion.div>
  );
}
