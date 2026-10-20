import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BadgeCheck, ChevronDown, ClipboardList, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { View } from '../types';
import { profesionales } from './index';
import { useProfesional } from './context';
import { Beneficio, Estudio, Evento, Sede, SEDES } from './types';
import { BeneficioCard, CPS_LOGO, EventoCard, SeccionTitulo, SedeFiltro, useDatos } from './ui';

const PREGUNTAS = [
  ['¿Quiénes pueden ser parte?', 'Arquitectos/as, ingenieros/as civiles, desarrolladores/as inmobiliarios, constructores/as independientes y otros profesionales de la construcción que trabajen en Mendoza o San Juan.'],
  ['¿Necesito matrícula?', 'No es obligatoria. Si la tenés, cargala en el formulario y nos ayuda a confirmar tu alta más rápido. El equipo de Samaco revisa cada solicitud y, una vez aprobada, se activan los precios profesionales y la inscripción a eventos exclusivos.'],
  ['¿Cómo se aplican los descuentos?', 'Comprando con tu cuenta del Círculo, los descuentos por categoría se aplican automáticamente. También podés pedir cotizaciones de obra a tu asesor comercial.'],
  ['¿Mi estudio aparece en el directorio?', 'Solo si lo autorizás al registrarte o desde tu perfil. Podés quitarlo cuando quieras.'],
] as const;

export function CirculoView({ ir }: { ir: (v: View) => void }) {
  const { profesional } = useProfesional();
  const [sedeEventos, setSedeEventos] = useState<Sede | 'todas'>('todas');
  const [sedeEstudios, setSedeEstudios] = useState<Sede | 'todas'>('todas');
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);

  const { data: eventos }    = useDatos<Evento[]>(() => profesionales.getEventos(), []);
  const { data: beneficios } = useDatos<Beneficio[]>(() => profesionales.getBeneficios(), []);
  const { data: estudios }   = useDatos<Estudio[]>(() => profesionales.getEstudios(), []);

  const eventosFiltrados  = eventos.filter(e => sedeEventos === 'todas' || e.sede === sedeEventos).slice(0, 6);
  const estudiosFiltrados = estudios.filter(e => sedeEstudios === 'todas' || e.sede === sedeEstudios);

  const ctaPrincipal = profesional
    ? <button onClick={() => ir('panel')} className="bg-[#E8593C] hover:bg-[#d14a2f] text-white font-black py-4 px-8 rounded-2xl text-sm transition-colors inline-flex items-center gap-2">Ir a mi panel <ArrowRight className="w-4 h-4" /></button>
    : <button onClick={() => ir('pro-registro')} className="bg-[#E8593C] hover:bg-[#d14a2f] text-white font-black py-4 px-8 rounded-2xl text-sm transition-colors inline-flex items-center gap-2">Quiero ser parte <ArrowRight className="w-4 h-4" /></button>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0d2a4d] text-white">
        <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1600" alt=""
          referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a4d] via-[#0d2a4d]/85 to-transparent" />
        <div className="relative container mx-auto px-6 md:px-8 max-w-7xl py-20 md:py-28">
          {/* El logo es el título de la página; el alt mantiene el texto para buscadores y lectores de pantalla. */}
          <h1 className="mb-6">
            <img src={CPS_LOGO.horizontalBlanco.src} width={CPS_LOGO.horizontalBlanco.w} height={CPS_LOGO.horizontalBlanco.h}
              alt="Círculo de Profesionales Samaco" className="h-20 md:h-28 w-auto" />
          </h1>
          <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#E8593C] mb-4">
            <BadgeCheck className="w-4 h-4" />Mendoza · San Juan
          </p>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl mb-8">
            El club para arquitectos, ingenieros, desarrolladores y constructores que eligen Samaco para sus obras.
            Precios profesionales, eventos con las marcas y un asesor dedicado para tus obras.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {ctaPrincipal}
            {!profesional && (
              <button onClick={() => ir('pro-ingresar')} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 px-8 rounded-2xl text-sm transition-colors">
                Ya soy miembro · Ingresar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CIFRAS ── */}
      <section className="bg-[#1B4F8C] text-white">
        <div className="container mx-auto px-6 md:px-8 max-w-7xl py-6 grid grid-cols-3 gap-4 text-center">
          {[[String(estudios.length), 'estudios en la red'], [String(eventos.length), 'eventos próximos'], ['2', 'sedes']].map(([n, label]) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-black">{n}</p>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── EVENTOS ── */}
      <section className="container mx-auto px-4 md:px-8 max-w-7xl py-16">
        <SeccionTitulo kicker="Agenda" titulo="Próximos eventos">
          <SedeFiltro value={sedeEventos} onChange={setSedeEventos} />
        </SeccionTitulo>
        {eventosFiltrados.length === 0
          ? <p className="text-slate-400 text-sm py-10 text-center bg-white rounded-2xl border border-slate-100">No hay eventos programados para esta sede.</p>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventosFiltrados.map(ev => (
                <EventoCard key={ev.id} evento={ev} accion={
                  <button onClick={() => ir(profesional ? 'panel' : 'pro-registro')}
                    className="w-full py-2.5 border-2 border-[#1B4F8C] text-[#1B4F8C] hover:bg-[#1B4F8C] hover:text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5">
                    {ev.exclusivo && !profesional && <Lock className="w-3 h-3" />}
                    {profesional ? 'Inscribirme desde mi panel' : ev.exclusivo ? 'Exclusivo para miembros' : 'Registrarme para inscribirme'}
                  </button>
                } />
              ))}
            </div>
          )}
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <SeccionTitulo kicker="Por qué ser parte" titulo="Beneficios para miembros" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beneficios.map(b => <BeneficioCard key={b.id} beneficio={b} />)}
          </div>
        </div>
      </section>

      {/* ── CÓMO FORMAR PARTE ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <SeccionTitulo kicker="Alta en 3 pasos" titulo="Cómo formar parte" />
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              [ClipboardList, 'Completá el formulario',     'Tus datos, tu especialidad y tu zona de trabajo. Lleva un par de minutos.'],
              [ShieldCheck,   'Revisamos tu solicitud',     'El equipo de Samaco confirma tu alta y te contacta. Mientras tanto ya podés ver tu panel.'],
              [BadgeCheck,    'Activamos tus beneficios',    'Se habilitan los precios profesionales, los eventos exclusivos y tu credencial digital.'],
            ] as const).map(([Icon, titulo, texto], i) => (
              <li key={titulo} className="relative bg-white rounded-2xl p-6 border border-slate-100">
                <span className="absolute top-5 right-5 text-4xl font-black text-slate-200">{i + 1}</span>
                <Icon className="w-7 h-7 text-[#E8593C] mb-4" />
                <h3 className="font-black text-slate-800 mb-1.5">{titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ESTUDIOS ── */}
      <section className="bg-white border-y border-slate-100 py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <SeccionTitulo kicker="Red de profesionales" titulo="Estudios del Círculo">
            <SedeFiltro value={sedeEstudios} onChange={setSedeEstudios} />
          </SeccionTitulo>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {estudiosFiltrados.map(es => (
              <article key={es.id} className="group rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                <div className="h-40 overflow-hidden bg-slate-200">
                  <img src={es.imagen} alt={`Obra de ${es.nombre}`} loading="lazy" referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{SEDES[es.sede]}</p>
                  <h3 className="font-black text-slate-800 mb-2">{es.nombre}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {es.especialidades.map(s => <span key={s} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="container mx-auto px-4 md:px-8 max-w-3xl py-16">
        <SeccionTitulo kicker="Preguntas frecuentes" titulo="Preguntas frecuentes" />
        <div className="space-y-3">
          {PREGUNTAS.map(([p, r], i) => (
            <div key={p} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button onClick={() => setFaqAbierta(faqAbierta === i ? null : i)} aria-expanded={faqAbierta === i}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-bold text-slate-800 text-sm">
                {p}<ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${faqAbierta === i ? 'rotate-180' : ''}`} />
              </button>
              {faqAbierta === i && <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{r}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1B4F8C] py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Tu próxima obra, con respaldo Samaco</h2>
          <p className="text-slate-300 mb-8">Accedé a precios, eventos y asesoramiento pensados para profesionales de la construcción.</p>
          {ctaPrincipal}
        </div>
      </section>
    </motion.div>
  );
}
