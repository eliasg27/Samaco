import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Check, CreditCard, Info } from 'lucide-react';
import { useLocation } from 'react-router';
import { MedioPago, mediosVigentes } from './data';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

function cuotaPara(m: MedioPago, monto: number) {
  if (m.descuento) return { titulo: `${fmt(monto * (1 - m.descuento / 100))} en un pago`, detalle: `Ahorrás ${fmt(monto * m.descuento / 100)}` };
  if (m.cuotasSinInteres) {
    if (m.compraMinima && monto < m.compraMinima) return { titulo: 'No aplica', detalle: `Compra mínima ${fmt(m.compraMinima)}` };
    return { titulo: `${m.cuotasSinInteres} × ${fmt(monto / m.cuotasSinInteres)}`, detalle: `Total ${fmt(monto)} sin interés` };
  }
  return null;
}

/** /financiacion: todos los medios de pago vigentes, con condiciones y un simulador de cuotas. */
export function FinanciacionView() {
  const medios = mediosVigentes();
  const { hash } = useLocation();
  const [monto, setMonto] = useState(500000);

  // Al entrar desde una tarjeta del carrusel (/financiacion#visa-mastercard) ir directo a ese medio.
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="bg-[#1B4F8C] text-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-14">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E8593C] mb-3">Medios de pago</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Financiación y promociones</h1>
          <p className="text-slate-200 max-w-xl">Todas las formas de pagar tus materiales en Samaco: descuentos por pago contado y cuotas sin interés con las principales tarjetas.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Listado */}
        <div className="lg:col-span-2 space-y-4">
          {medios.map(m => (
            <article key={m.id} id={m.id} className="scroll-mt-28 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 target:ring-2 target:ring-[#E8593C]">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 shrink-0 rounded-xl ${m.color} flex items-center justify-center text-white`}><CreditCard className="w-6 h-6" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500">{m.nombre}</p>
                  <h2 className={`text-2xl font-black ${m.textColor}`}>{m.beneficio}</h2>
                  <ul className="mt-4 space-y-1.5">
                    {m.condiciones.map(c => (
                      <li key={c} className="flex gap-2 text-sm text-slate-600"><Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />{c}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.tarjetas?.map(t => <span key={t} className="text-[11px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{t}</span>)}
                    {m.vigenteHasta && <span className="text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full">Vigente hasta el {fechaCorta.format(new Date(`${m.vigenteHasta}T12:00:00-03:00`))}</span>}
                  </div>
                </div>
              </div>
            </article>
          ))}
          <p className="flex gap-2 text-xs text-slate-400 pt-2">
            <Info className="w-4 h-4 shrink-0" />
            Promociones sujetas a cambios por parte de los bancos emisores. Consultá condiciones vigentes al momento de la compra.
          </p>
        </div>

        {/* Simulador */}
        <aside className="lg:sticky lg:top-28 h-fit bg-white rounded-2xl border border-slate-100 shadow-xl p-6">
          <h2 className="font-black text-slate-800 flex items-center gap-2 mb-1"><Calculator className="w-5 h-5 text-[#1B4F8C]" />Simulá tu compra</h2>
          <p className="text-xs text-slate-400 mb-4">Ingresá el total de tu compra a precio de lista.</p>
          <label className="block mb-5">
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Monto</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input type="number" inputMode="numeric" min={0} step={1000} value={monto || ''} onChange={e => setMonto(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#1B4F8C] focus:bg-white rounded-xl pl-8 pr-4 py-3 text-lg font-black text-slate-800 outline-none" />
            </div>
          </label>
          <ul className="divide-y divide-slate-100">
            {medios.map(m => {
              const r = monto > 0 ? cuotaPara(m, monto) : null;
              return (
                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500">{m.nombre}</span>
                  <span className="text-right">
                    <span className={`block text-sm font-black ${r?.titulo === 'No aplica' ? 'text-slate-400' : 'text-slate-800'}`}>{r?.titulo ?? '—'}</span>
                    {r && <span className="block text-[10px] text-slate-400">{r.detalle}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </motion.div>
  );
}
