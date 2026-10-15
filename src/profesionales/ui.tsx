import { useEffect, useState } from 'react';
import { Award, BookOpen, CalendarDays, Clock, Lock, MapPin, Percent, Truck, UserCheck, Users } from 'lucide-react';
import { Beneficio, Evento, Sede, SEDES, TIPOS_EVENTO } from './types';

/** Carga asíncrona simple para los datos del Círculo. */
export function useDatos<T>(fetcher: () => Promise<T>, inicial: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    fetcher().then(d => { if (!cancelado) setData(d); }).finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, cargando };
}

const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const hora       = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' });
const dia        = new Intl.DateTimeFormat('es-AR', { day: '2-digit' });
const mes        = new Intl.DateTimeFormat('es-AR', { month: 'short' });

export const formatoFecha = (iso: string) => fechaLarga.format(new Date(iso));
export const formatoHora  = (iso: string) => hora.format(new Date(iso));

/** Asesores comerciales por sede. TODO: reemplazar por los contactos reales de Samaco. */
export const ASESORES: Record<Sede, { nombre: string; whatsapp: string; email: string }> = {
  'mendoza':  { nombre: 'Asesor/a de profesionales Mendoza',  whatsapp: '5492615555555', email: 'profesionales@samacoonline.com.ar' },
  'san-juan': { nombre: 'Asesor/a de profesionales San Juan', whatsapp: '5492645555555', email: 'profesionales.sj@samacoonline.com.ar' },
};

export function SedeFiltro({ value, onChange }: { value: Sede | 'todas'; onChange: (s: Sede | 'todas') => void }) {
  const opciones: [Sede | 'todas', string][] = [['todas', 'Todas las sedes'], ['mendoza', 'Mendoza'], ['san-juan', 'San Juan']];
  return (
    <div role="tablist" aria-label="Filtrar por sede" className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
      {opciones.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${value === v ? 'bg-white text-[#1B4F8C] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

const ICONOS_BENEFICIO = { percent: Percent, calendar: CalendarDays, user: UserCheck, truck: Truck, book: BookOpen, award: Award };

export function BeneficioCard({ beneficio }: { beneficio: Beneficio }) {
  const Icon = ICONOS_BENEFICIO[beneficio.icono];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-[#1B4F8C]/10 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#1B4F8C]" />
      </div>
      <h3 className="font-black text-slate-800 mb-1.5">{beneficio.titulo}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{beneficio.descripcion}</p>
    </div>
  );
}

interface EventoCardProps {
  evento: Evento;
  /** Botón o estado a mostrar abajo de la tarjeta. */
  accion?: React.ReactNode;
  inscripto?: boolean;
}

export function EventoCard({ evento, accion, inscripto }: EventoCardProps) {
  const lleno = evento.inscriptos >= evento.cupo;
  const pct = Math.min(100, Math.round((evento.inscriptos / evento.cupo) * 100));
  const d = new Date(evento.fecha);
  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="relative h-36 bg-slate-200">
        <img src={evento.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3 bg-white rounded-xl px-2.5 py-1.5 text-center shadow leading-none">
          <p className="text-lg font-black text-slate-800">{dia.format(d)}</p>
          <p className="text-[10px] font-bold uppercase text-[#E8593C]">{mes.format(d).replace('.', '')}</p>
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className="bg-[#1B4F8C] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{SEDES[evento.sede]}</span>
          {evento.exclusivo && (
            <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />Miembros
            </span>
          )}
        </div>
        <p className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-widest text-white/90">
          {TIPOS_EVENTO[evento.tipo]}{evento.marca ? ` · ${evento.marca}` : ''}
        </p>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-black text-slate-800 leading-snug mb-2">{evento.titulo}</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{evento.descripcion}</p>
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /><span className="capitalize">{formatoFecha(evento.fecha)}</span> · {formatoHora(evento.fecha)} h</p>
          <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" />{evento.lugar}</p>
          <p className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" />{lleno ? 'Cupo completo' : `${evento.cupo - evento.inscriptos} lugares disponibles`}</p>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4" aria-hidden>
          <div className={`h-full rounded-full ${lleno ? 'bg-slate-400' : 'bg-[#E8593C]'}`} style={{ width: `${pct}%` }} />
        </div>
        {inscripto && <p className="text-xs font-bold text-emerald-700 mb-2">✓ Estás inscripto/a</p>}
        {accion}
      </div>
    </article>
  );
}

export const SeccionTitulo = ({ kicker, titulo, children }: { kicker?: string; titulo: string; children?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
    <div>
      {kicker && <p className="text-[10px] font-black text-[#E8593C] uppercase tracking-widest mb-1">{kicker}</p>}
      <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{titulo}</h2>
    </div>
    {children}
  </div>
);
