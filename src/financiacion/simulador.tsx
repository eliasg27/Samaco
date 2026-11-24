import { useState } from 'react';
import { Calculator, MapPin, Monitor } from 'lucide-react';
import { CANALES, Canal, Plan } from './data';
import { useContenido } from '../contenido';
import { LogosPago } from './logos';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

/** IVA de materiales de construcción. El "precio sin impuestos nacionales" (Ley 27.743) es el precio sin este IVA. */
export const IVA = 0.21;
export const sinImpuestosNacionales = (precio: number) => Math.round(precio / (1 + IVA));

export const CanalBadge = ({ canal }: { canal: Canal }) => {
  const Icon = canal === 'sucursal' ? MapPin : Monitor;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full
      ${canal === 'sucursal' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      <Icon className="w-3 h-3" />{CANALES[canal]}
    </span>
  );
};

/** Resultado del simulador para un plan. Las cuotas fijas dependen de la tasa del emisor: no se calculan. */
export function simular(plan: Plan, monto: number) {
  const conDescuento = monto * (1 - (plan.descuento ?? 0) / 100);
  if (plan.tipo === 'contado') return { valor: fmt(conDescuento), detalle: plan.descuento ? `Ahorrás ${fmt(monto - conDescuento)}` : 'En un pago' };
  if (plan.tipo === 'sin-interes') return {
    valor: `${plan.cuotas} × ${fmt(conDescuento / plan.cuotas)}`,
    detalle: plan.descuento ? `Total ${fmt(conDescuento)} (${plan.descuento}% OFF)` : `Total ${fmt(conDescuento)} sin interés`,
  };
  return { valor: `${plan.cuotas} cuotas fijas`, detalle: 'Valor de cuota según tu tarjeta' };
}

/**
 * Calculadora de la ficha de producto: elegís el medio de pago y ves cuánto queda cada plan para este monto.
 * Usa las mismas promos que /financiacion (Shopify → metaobjetos), así se actualiza sola con la grilla del mes.
 */
export function CalculadoraCuotas({ monto }: { monto: number }) {
  const { medios } = useContenido();
  const [medioId, setMedioId] = useState('');
  const medio = medios.find(m => m.id === medioId) ?? medios[0];
  if (!medio) return null;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 p-5 mb-6" aria-label="Calculadora de cuotas">
      <h2 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-[#1B4F8C]" />Calculá tus cuotas
      </h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3" role="tablist" aria-label="Medio de pago">
        {medios.map(m => (
          <button key={m.id} role="tab" aria-selected={m.id === medio.id} onClick={() => setMedioId(m.id)}
            className={`shrink-0 px-3 py-2 rounded-xl border-2 text-[11px] font-bold transition-colors
              ${m.id === medio.id ? 'border-[#1B4F8C] bg-[#1B4F8C] text-white' : 'border-slate-200 text-slate-600 hover:border-[#1B4F8C] hover:text-[#1B4F8C]'}`}>
            {m.nombre}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <LogosPago tarjetas={medio.tarjetas} max={4} />
        <CanalBadge canal={medio.canal} />
      </div>
      <ul className="divide-y divide-slate-100">
        {medio.planes.map(p => {
          const r = simular(p, monto);
          return (
            <li key={p.etiqueta} className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">{p.etiqueta}</span>
              <span className="text-right">
                <span className={`block text-sm font-black ${p.tipo === 'fijas' ? 'text-slate-500' : 'text-slate-800'}`}>{r.valor}</span>
                <span className="block text-[10px] text-slate-400">{r.detalle}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
