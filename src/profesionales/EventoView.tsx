import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CalendarDays, Clock, Lock, MapPin, Share2, Tag, Users } from 'lucide-react';
import { View } from '../types';
import { useProfesional } from './context';
import { profesionales } from './mock';
import { Evento, SEDES, TIPOS_EVENTO } from './types';
import { formatoFecha, formatoHora, useDatos } from './ui';

/** Página pública de un evento (/CPS/eventos/:id): se puede compartir y pautar. */
export function EventoView({ id, ir }: { id: string; ir: (v: View) => void }) {
  const { profesional, actualizar } = useProfesional();
  const [procesando, setProcesando] = useState(false);
  const { data: evento, cargando } = useDatos<Evento | null>(
    () => profesionales.getEvento(id), null, [id, profesional?.eventosInscriptos.join()],
  );

  useEffect(() => { if (evento) document.title = `${evento.titulo} | Círculo de Profesionales Samaco`; }, [evento]);

  if (cargando && !evento) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[60vh]" />;

  if (!evento) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="container mx-auto px-4 max-w-xl py-24 text-center">
        <h1 className="text-2xl font-black text-slate-800 mb-2">No encontramos este evento</h1>
        <p className="text-slate-500 mb-8">Puede que se haya reprogramado. Mirá la agenda actualizada del Círculo.</p>
        <button onClick={() => ir('profesionales')} className="bg-[#1B4F8C] text-white font-bold px-6 py-3 rounded-xl text-sm">Ver próximos eventos</button>
      </motion.div>
    );
  }

  const pasado    = new Date(evento.fecha).getTime() < Date.now();
  const lleno     = evento.inscriptos >= evento.cupo;
  const inscripto = !!profesional?.eventosInscriptos.includes(evento.id);
  const aprobado  = profesional?.estado === 'aprobado';
  const compartir = `https://wa.me/?text=${encodeURIComponent(`${evento.titulo} — ${formatoFecha(evento.fecha)} en ${SEDES[evento.sede]}. ${window.location.href}`)}`;

  const toggle = async () => {
    if (!profesional) return;
    setProcesando(true);
    actualizar(inscripto
      ? await profesionales.cancelarInscripcion(profesional.id, evento.id)
      : await profesionales.inscribirEvento(profesional.id, evento.id));
    setProcesando(false);
  };

  let accion: React.ReactNode;
  if (pasado) {
    accion = <p className="text-sm font-bold text-slate-500">Este evento ya se realizó.</p>;
  } else if (!profesional) {
    accion = (
      <div className="space-y-2">
        <button onClick={() => ir('pro-registro')} className="w-full py-3.5 bg-[#E8593C] hover:bg-[#d14a2f] text-white font-black rounded-xl text-sm">
          {evento.exclusivo ? 'Sumate al Círculo para inscribirte' : 'Registrate para inscribirte'}
        </button>
        <button onClick={() => ir('pro-ingresar')} className="w-full py-3 border-2 border-slate-200 hover:border-[#1B4F8C] text-slate-700 font-bold rounded-xl text-sm">Ya soy miembro · Ingresar</button>
      </div>
    );
  } else if (inscripto) {
    accion = (
      <div className="space-y-2">
        <p className="text-sm font-bold text-emerald-700">✓ Estás inscripto/a. Te esperamos.</p>
        <button disabled={procesando} onClick={toggle} className="w-full py-3 border-2 border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-600 font-bold rounded-xl text-sm">Cancelar inscripción</button>
      </div>
    );
  } else if (evento.exclusivo && !aprobado) {
    accion = <p className="flex items-center gap-2 text-sm font-bold text-slate-500"><Lock className="w-4 h-4" />Disponible cuando se apruebe tu matrícula.</p>;
  } else if (lleno) {
    accion = <p className="text-sm font-bold text-slate-500">Cupo completo.</p>;
  } else {
    accion = <button disabled={procesando} onClick={toggle} className="w-full py-3.5 bg-[#1B4F8C] hover:bg-[#163f70] disabled:bg-slate-300 text-white font-black rounded-xl text-sm">Inscribirme</button>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="relative h-64 md:h-80 bg-slate-900 overflow-hidden">
        <img src={evento.imagen} alt="" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d2a4d] via-[#0d2a4d]/60 to-transparent" />
        <div className="relative h-full container mx-auto px-4 md:px-8 max-w-5xl flex flex-col justify-end pb-8 text-white">
          <button onClick={() => ir(profesional ? 'panel' : 'profesionales')} className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />{profesional ? 'Volver a mi panel' : 'Círculo de Profesionales'}
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E8593C] mb-2">
            {TIPOS_EVENTO[evento.tipo]} · {SEDES[evento.sede]}{evento.exclusivo ? ' · Exclusivo miembros' : ''}
          </p>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight max-w-3xl">{evento.titulo}</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-5xl py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-black text-slate-800 mb-3">Sobre el evento</h2>
          <p className="text-slate-600 leading-relaxed">{evento.descripcion}</p>
        </div>
        <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 h-fit">
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3"><CalendarDays className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" /><span className="capitalize">{formatoFecha(evento.fecha)}</span></li>
            <li className="flex gap-3"><Clock className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" />{formatoHora(evento.fecha)} h</li>
            <li className="flex gap-3"><MapPin className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" />{evento.lugar}</li>
            {evento.marca && <li className="flex gap-3"><Tag className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" />Con {evento.marca}</li>}
            <li className="flex gap-3"><Users className="w-4 h-4 mt-0.5 text-[#E8593C] shrink-0" />{lleno ? 'Cupo completo' : `${evento.cupo - evento.inscriptos} lugares disponibles de ${evento.cupo}`}</li>
          </ul>
          <div className="pt-2">{accion}</div>
          <a href={compartir} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B4F8C] pt-2">
            <Share2 className="w-3.5 h-3.5" />Compartir por WhatsApp
          </a>
        </aside>
      </div>
    </motion.div>
  );
}
