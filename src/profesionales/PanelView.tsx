import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  BadgeCheck, CalendarDays, Clock, Hourglass, LayoutDashboard, Lock, LogOut, Mail, Percent,
  Phone, Search, User, Users,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { View } from '../types';
import { PanelTab, paths } from '../routes';
import { useProfesional } from './context';
import { esModoDemo, mockProfesionales, profesionales } from './mock';
import {
  COLEGIOS, Descuento, Estudio, Evento, Profesional, PROFESIONES, Sede, SEDES, ZONAS,
} from './types';
import { ASESORES, CPS_LOGO, EventoCard, formatoFecha, formatoHora, SedeFiltro, useDatos } from './ui';

type Tab = PanelTab;

const TABS: [Tab, string, typeof LayoutDashboard][] = [
  ['resumen',    'Resumen',               LayoutDashboard],
  ['eventos',    'Eventos',               CalendarDays],
  ['descuentos', 'Descuentos',            Percent],
  ['red',        'Red de profesionales',  Users],
  ['perfil',     'Mi perfil',             User],
];

export function PanelView({ tab, ir }: { tab: Tab; ir: (v: View) => void }) {
  const { profesional, cargando, salir } = useProfesional();
  const navigate = useNavigate();
  // Cada pestaña tiene su URL (/CPS/panel/eventos…): se puede compartir y el botón atrás funciona.
  const setTab = (t: Tab) => navigate(paths.panel(t));
  const saliendo = useRef(false);

  // Sin sesión → al login. Salvo que el usuario esté cerrando sesión (ahí lo mandamos a la landing).
  useEffect(() => { if (!cargando && !profesional && !saliendo.current) ir('pro-ingresar'); }, [cargando, profesional, ir]);

  const cerrarSesion = async () => {
    saliendo.current = true;
    ir('profesionales');
    await salir();
  };
  // Tiene que seguir siendo un motion.div: si el panel está saliendo (logout), AnimatePresence espera su exit.
  if (!profesional) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[50vh]" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Encabezado */}
      <section className="bg-[#0d2a4d] text-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-10 pb-6">
          <img src={CPS_LOGO.horizontalBlanco.src} width={CPS_LOGO.horizontalBlanco.w} height={CPS_LOGO.horizontalBlanco.h}
            alt="Círculo de Profesionales Samaco" className="h-10 w-auto mb-6" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Hola, {profesional.nombre}</h1>
              <p className="text-sm text-slate-300 mt-1">{PROFESIONES[profesional.profesion]}{profesional.matricula ? ` · Mat. ${profesional.matricula}` : ''} · {SEDES[profesional.sede]}</p>
            </div>
            <button onClick={cerrarSesion}
              className="self-start md:self-auto inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white">
              <LogOut className="w-4 h-4" />Cerrar sesión
            </button>
          </div>
          <nav aria-label="Secciones del panel" className="mt-8 flex gap-1 overflow-x-auto no-scrollbar -mb-6">
            {TABS.map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold transition-colors
                  ${tab === id ? 'bg-[#f8fafc] text-[#1B4F8C]' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-10">
        {profesional.estado !== 'aprobado' && <BannerPendiente profesional={profesional} />}
        {tab === 'resumen'    && <Resumen profesional={profesional} irTab={setTab} />}
        {tab === 'eventos'    && <Eventos profesional={profesional} />}
        {tab === 'descuentos' && <Descuentos profesional={profesional} ir={ir} />}
        {tab === 'red'        && <Red />}
        {tab === 'perfil'     && <Perfil profesional={profesional} />}
      </div>
    </motion.div>
  );
}

// ── Estado pendiente ────────────────────────────────────────────────

function BannerPendiente({ profesional }: { profesional: Profesional }) {
  const { actualizar } = useProfesional();
  const rechazado = profesional.estado === 'rechazado';
  return (
    <div role="status" className={`flex flex-col sm:flex-row gap-4 sm:items-center justify-between rounded-2xl border p-5 mb-8
      ${rechazado ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex gap-3">
        <Hourglass className={`w-5 h-5 shrink-0 mt-0.5 ${rechazado ? 'text-red-600' : 'text-amber-600'}`} />
        <div>
          <p className="font-black text-slate-800 text-sm">{rechazado ? 'No pudimos confirmar tu alta' : 'Tu solicitud está en revisión'}</p>
          <p className="text-xs text-slate-600 mt-0.5">
            {rechazado
              ? 'Escribile a tu asesor para revisar los datos cargados.'
              : 'El equipo de Samaco está revisando tus datos y te va a contactar por WhatsApp. Cuando se apruebe tu alta se activan tus descuentos y los eventos exclusivos.'}
          </p>
        </div>
      </div>
      {esModoDemo && !rechazado && (
        <button onClick={async () => actualizar(await mockProfesionales.simularAprobacion(profesional.id))}
          className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl border-2 border-amber-300 text-amber-800 hover:bg-amber-100">
          Simular aprobación (demo)
        </button>
      )}
    </div>
  );
}

// ── Resumen ─────────────────────────────────────────────────────────

function Credencial({ profesional }: { profesional: Profesional }) {
  const aprobado = profesional.estado === 'aprobado';
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4F8C] via-[#163f70] to-[#0d2a4d] text-white p-6 shadow-xl aspect-[1.6/1] max-w-md flex flex-col justify-between">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
      <img src={CPS_LOGO.isotipoBlanco.src} alt="" aria-hidden className="absolute -right-10 -bottom-12 w-48 h-48 opacity-10" />
      <div className="relative flex items-start justify-between gap-3">
        <img src={CPS_LOGO.horizontalBlanco.src} width={CPS_LOGO.horizontalBlanco.w} height={CPS_LOGO.horizontalBlanco.h}
          alt="Círculo de Profesionales Samaco" className="h-9 w-auto" />
        {aprobado
          ? <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-400/20 text-emerald-200 px-2 py-1 rounded-full"><BadgeCheck className="w-3 h-3" />Activo</span>
          : <span className="text-[10px] font-black uppercase bg-amber-400/20 text-amber-200 px-2 py-1 rounded-full">En revisión</span>}
      </div>
      <div className="relative">
        <p className="text-xl font-black leading-tight">{profesional.nombre} {profesional.apellido}</p>
        <p className="text-xs text-white/70">{PROFESIONES[profesional.profesion]}{profesional.estudio ? ` · ${profesional.estudio}` : ''}</p>
      </div>
      <div className="relative grid grid-cols-3 gap-2 text-[10px]">
        <div><p className="text-white/50 uppercase font-bold">Socio</p><p className="font-black text-sm">{profesional.numeroSocio ?? '—'}</p></div>
        <div><p className="text-white/50 uppercase font-bold">{profesional.matricula ? 'Matrícula' : 'Zona'}</p><p className="font-black text-sm truncate">{profesional.matricula ?? ZONAS[profesional.zona] ?? '—'}</p></div>
        <div><p className="text-white/50 uppercase font-bold">Sede</p><p className="font-black text-sm">{profesional.sede === 'mendoza' ? 'Mendoza' : 'San Juan'}</p></div>
      </div>
    </div>
  );
}

function Resumen({ profesional, irTab }: { profesional: Profesional; irTab: (t: Tab) => void }) {
  const { data: eventos } = useDatos<Evento[]>(() => profesionales.getEventos(), []);
  const misEventos = eventos.filter(e => profesional.eventosInscriptos.includes(e.id));
  const proximosSede = eventos.filter(e => e.sede === profesional.sede && !profesional.eventosInscriptos.includes(e.id)).slice(0, 2);
  const asesor = ASESORES[profesional.sede];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Credencial profesional={profesional} />

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-800">Mis próximos eventos</h2>
            <button onClick={() => irTab('eventos')} className="text-xs font-bold text-[#1B4F8C] hover:underline">Ver agenda</button>
          </div>
          {misEventos.length === 0
            ? <p className="text-sm text-slate-400">Todavía no te inscribiste a ningún evento.</p>
            : (
              <ul className="divide-y divide-slate-100">
                {misEventos.map(e => (
                  <li key={e.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{e.titulo}</p>
                      <p className="text-xs text-slate-500 capitalize">{formatoFecha(e.fecha)} · {formatoHora(e.fecha)} h · {SEDES[e.sede]}</p>
                    </div>
                    <CalendarDays className="w-4 h-4 text-[#E8593C] shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          {proximosSede.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Próximamente en tu sede</p>
              {proximosSede.map(e => (
                <p key={e.id} className="text-xs text-slate-600 py-1"><span className="font-bold capitalize">{formatoFecha(e.fecha)}</span> — {e.titulo}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tu asesor comercial</p>
          <p className="font-black text-slate-800">{asesor.nombre}</p>
          <p className="text-xs text-slate-500 mb-4">{SEDES[profesional.sede]}</p>
          <div className="space-y-2">
            <a href={`https://wa.me/${asesor.whatsapp}?text=${encodeURIComponent(`Hola! Soy ${profesional.nombre} ${profesional.apellido} (Círculo de Profesionales${profesional.numeroSocio ? `, socio ${profesional.numeroSocio}` : ''}). Quiero cotizar una obra.`)}`}
              target="_blank" rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe58] text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              <Phone className="w-4 h-4" />Cotizar una obra
            </a>
            <a href={`mailto:${asesor.email}`} className="w-full inline-flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-[#1B4F8C] text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors">
              <Mail className="w-4 h-4" />{asesor.email}
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Accesos rápidos</p>
          {([['descuentos', 'Ver mis descuentos', Percent], ['red', 'Red de profesionales', Users], ['perfil', 'Editar mi perfil', User]] as const).map(([t, label, Icon]) => (
            <button key={t} onClick={() => irTab(t)} className="w-full flex items-center gap-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-[#1B4F8C] text-left">
              <Icon className="w-4 h-4 text-slate-400" />{label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ── Eventos ─────────────────────────────────────────────────────────

function Eventos({ profesional }: { profesional: Profesional }) {
  const { actualizar } = useProfesional();
  const [sede, setSede] = useState<Sede | 'todas'>('todas');
  const [procesando, setProcesando] = useState<string | null>(null);
  const { data: eventos, cargando } = useDatos<Evento[]>(() => profesionales.getEventos(), [], [profesional.eventosInscriptos.join()]);
  const aprobado = profesional.estado === 'aprobado';
  const lista = eventos.filter(e => sede === 'todas' || e.sede === sede);

  const toggle = async (ev: Evento, inscripto: boolean) => {
    setProcesando(ev.id);
    const p = inscripto
      ? await profesionales.cancelarInscripcion(profesional.id, ev.id)
      : await profesionales.inscribirEvento(profesional.id, ev.id);
    actualizar(p);
    setProcesando(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black text-slate-800">Agenda del Círculo</h2>
        <SedeFiltro value={sede} onChange={setSede} />
      </div>
      {!cargando && lista.length === 0 && <p className="text-sm text-slate-400 py-10 text-center bg-white rounded-2xl border border-slate-100">No hay eventos programados para esta sede.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map(ev => {
          const inscripto = profesional.eventosInscriptos.includes(ev.id);
          const lleno = ev.inscriptos >= ev.cupo;
          const bloqueado = ev.exclusivo && !aprobado;
          let accion: React.ReactNode;
          if (inscripto) {
            accion = <button disabled={procesando === ev.id} onClick={() => toggle(ev, true)} className="w-full py-2.5 border-2 border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-600 text-xs font-bold rounded-xl transition-colors">Cancelar inscripción</button>;
          } else if (bloqueado) {
            accion = <p className="w-full py-2.5 text-center bg-slate-50 text-slate-500 text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5"><Lock className="w-3 h-3" />Disponible al aprobarse tu alta</p>;
          } else if (lleno) {
            accion = <p className="w-full py-2.5 text-center bg-slate-100 text-slate-500 text-xs font-bold rounded-xl">Cupo completo</p>;
          } else {
            accion = <button disabled={procesando === ev.id} onClick={() => toggle(ev, false)} className="w-full py-2.5 bg-[#1B4F8C] hover:bg-[#163f70] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors">Inscribirme</button>;
          }
          return <EventoCard key={ev.id} evento={ev} inscripto={inscripto} accion={accion} />;
        })}
      </div>
    </div>
  );
}

// ── Descuentos ──────────────────────────────────────────────────────

function Descuentos({ profesional, ir }: { profesional: Profesional; ir: (v: View) => void }) {
  const { data: descuentos } = useDatos<Descuento[]>(() => profesionales.getDescuentos(), []);
  const aprobado = profesional.estado === 'aprobado';
  const vigencia = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  const aplicables = descuentos.filter(d => d.sede === 'todas' || d.sede === profesional.sede);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">Precios profesionales</h2>
          <p className="text-sm text-slate-500">Vigentes en {SEDES[profesional.sede]}. Se aplican automáticamente al comprar con tu cuenta.</p>
        </div>
        <button onClick={() => ir('category')} className="text-sm font-bold text-[#1B4F8C] hover:underline">Ir al catálogo →</button>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${aprobado ? '' : 'opacity-60'}`}>
        {aplicables.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex gap-4">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#E8593C]/10 flex items-center justify-center">
              {aprobado ? <span className="text-xl font-black text-[#E8593C]">{d.porcentaje}%</span> : <Lock className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-800">{d.alcance}</p>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{d.detalle}</p>
              {d.vigenciaHasta && <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />Hasta el {vigencia.format(new Date(d.vigenciaHasta))}</p>}
            </div>
          </div>
        ))}
      </div>
      {!aprobado && <p className="text-xs text-slate-500 mt-4">Los porcentajes se muestran cuando se aprueba tu alta.</p>}
    </div>
  );
}

// ── Red de profesionales ────────────────────────────────────────────

function Red() {
  const [q, setQ] = useState('');
  const [sede, setSede] = useState<Sede | 'todas'>('todas');
  const { data: estudios }   = useDatos<Estudio[]>(() => profesionales.getEstudios(), []);
  const { data: directorio } = useDatos(() => profesionales.getDirectorio(), [] as Awaited<ReturnType<typeof profesionales.getDirectorio>>);
  const t = q.trim().toLowerCase();
  const coincide = (...campos: (string | undefined)[]) => !t || campos.some(c => c?.toLowerCase().includes(t));

  const estudiosF = estudios.filter(e => (sede === 'todas' || e.sede === sede) && coincide(e.nombre, ...e.especialidades));
  const prosF = directorio.filter(p => (sede === 'todas' || p.sede === sede) && coincide(p.nombre, p.apellido, p.estudio));

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar estudio, profesional o especialidad"
            className="w-full bg-white border-2 border-slate-100 focus:border-[#1B4F8C] pl-11 pr-4 py-3 rounded-xl text-sm outline-none" />
        </div>
        <SedeFiltro value={sede} onChange={setSede} />
      </div>

      <section>
        <h2 className="text-lg font-black text-slate-800 mb-4">Estudios ({estudiosF.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {estudiosF.map(e => (
            <article key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex">
              <img src={e.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-24 object-cover shrink-0" />
              <div className="p-4 min-w-0">
                <p className="font-black text-slate-800 text-sm truncate">{e.nombre}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">{SEDES[e.sede]}</p>
                <p className="text-xs text-slate-500 truncate">{e.especialidades.join(' · ')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-black text-slate-800 mb-1">Profesionales ({prosF.length})</h2>
        <p className="text-xs text-slate-400 mb-4">Solo se muestran miembros que aceptaron aparecer en el directorio.</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
          {prosF.length === 0 && <p className="p-6 text-sm text-slate-400">Sin resultados.</p>}
          {prosF.map(p => (
            <div key={p.id} className="px-5 py-3.5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[#1B4F8C]/10 text-[#1B4F8C] font-black text-xs flex items-center justify-center shrink-0">
                {p.nombre[0]}{p.apellido[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{p.nombre} {p.apellido}</p>
                <p className="text-xs text-slate-500">{PROFESIONES[p.profesion]}{p.estudio ? ` · ${p.estudio}` : ''}</p>
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">{p.sede === 'mendoza' ? 'Mendoza' : 'San Juan'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Perfil ──────────────────────────────────────────────────────────

function Perfil({ profesional }: { profesional: Profesional }) {
  const { actualizar } = useProfesional();
  const [telefono, setTelefono] = useState(profesional.telefono);
  const [estudio, setEstudio] = useState(profesional.estudio ?? '');
  const [sede, setSede] = useState<Sede>(profesional.sede);
  const [directorio, setDirectorio] = useState(profesional.apareceEnDirectorio);
  const [guardado, setGuardado] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    actualizar(await profesionales.actualizarPerfil(profesional.id, { telefono, estudio: estudio.trim() || undefined, sede, apareceEnDirectorio: directorio }));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const inputCls = 'w-full bg-slate-50 border-2 border-slate-100 focus:border-[#1B4F8C] focus:bg-white rounded-xl px-4 py-3 text-sm outline-none';
  const dato = (label: string, valor: string) => (
    <div className="flex justify-between gap-4 py-3 border-b border-slate-100 last:border-none text-sm">
      <span className="text-slate-400 font-semibold">{label}</span><span className="font-bold text-slate-700 text-right">{valor}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-black text-slate-800 mb-1">Datos de la membresía</h2>
        <p className="text-xs text-slate-400 mb-4">Para cambiar estos datos escribile a tu asesor: requieren una nueva validación.</p>
        {dato('Nombre', `${profesional.nombre} ${profesional.apellido}`)}
        {dato('Email', profesional.email)}
        {dato('Profesión', PROFESIONES[profesional.profesion])}
        {dato('Zona de trabajo', ZONAS[profesional.zona] ?? '—')}
        {profesional.matricula && dato('Matrícula', profesional.matricula)}
        {profesional.colegio && dato('Colegio', COLEGIOS[profesional.colegio])}
        {dato('N° de socio', profesional.numeroSocio ?? 'Se asigna al aprobarse')}
        {dato('Miembro desde', new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(profesional.fechaAlta)))}
      </div>

      <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h2 className="font-black text-slate-800">Datos de contacto</h2>
        <label className="block"><span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Teléfono / WhatsApp</span>
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className={inputCls} /></label>
        <label className="block"><span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Estudio</span>
          <input value={estudio} onChange={e => setEstudio(e.target.value)} className={inputCls} /></label>
        <label className="block"><span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Sede de referencia</span>
          <select value={sede} onChange={e => setSede(e.target.value as Sede)} className={inputCls}>
            {Object.entries(SEDES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></label>
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={directorio} onChange={e => setDirectorio(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1B4F8C]" />
          Aparecer en el directorio de la Red de Profesionales
        </label>
        <button type="submit" className="w-full py-3 bg-[#1B4F8C] hover:bg-[#163f70] text-white font-black rounded-xl text-sm transition-colors">
          {guardado ? '✓ Cambios guardados' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
