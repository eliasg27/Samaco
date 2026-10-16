import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { CPS_LOGO } from './ui';
import { View } from '../types';
import { useProfesional } from './context';
import { esModoDemo } from './mock';
import { DEMO_CUENTA } from './mock-data';
import {
  Colegio, COLEGIOS, COMO_NOS_CONOCISTE, ComoNosConociste, COMPRAS_EN_SAMACO, ComprasEnSamaco,
  Profesion, RegistroInput, Sede, SEDES, Zona, ZONAS,
} from './types';

const inputCls = 'w-full bg-slate-50 border-2 border-slate-100 focus:border-[#1B4F8C] focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all';
const labelCls = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5';

function Campo({ label, error, children, ayuda }: { label: string; error?: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {ayuda && !error && <span className="block text-[11px] text-slate-400 mt-1">{ayuda}</span>}
      {error && <span className="block text-[11px] font-semibold text-red-600 mt-1">{error}</span>}
    </label>
  );
}

// Campos y opciones del formulario oficial del Círculo (Google Forms). La matrícula es opcional.
interface FormState {
  nombreCompleto: string;
  profesion: Profesion | '';
  telefono: string;
  email: string;
  zona: Zona | '';
  sede: Sede;
  comprasEnSamaco: ComprasEnSamaco | '';
  comoNosConociste: ComoNosConociste | '';
  matricula: string;
  colegio: Colegio;
  estudio: string;
  password: string;
  confirmar: string;
  apareceEnDirectorio: boolean;
  terminos: boolean;
}

const VACIO: FormState = {
  nombreCompleto: '', profesion: '', telefono: '', email: '', zona: '', sede: 'mendoza',
  comprasEnSamaco: '', comoNosConociste: '', matricula: '', colegio: 'camza', estudio: '',
  password: '', confirmar: '', apareceEnDirectorio: true, terminos: false,
};

/** En el formulario original la especialidad "Otro" se muestra así (en el resto del sitio es "Profesional"). */
const ESPECIALIDADES: Record<Profesion, string> = {
  arquitecto: 'Arquitecto/a', ingeniero: 'Ingeniero/a civil', desarrollador: 'Desarrollador/a inmobiliario',
  constructor: 'Constructor/a independiente', otro: 'Otro',
};

function validar(f: FormState) {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (f.nombreCompleto.trim().split(/\s+/).length < 2) e.nombreCompleto = 'Ingresá tu nombre y apellido.';
  if (!f.profesion) e.profesion = 'Elegí tu especialidad.';
  if (f.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Ingresá un WhatsApp con código de área.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Email inválido.';
  if (!f.zona) e.zona = 'Elegí tu zona de trabajo.';
  if (!f.comprasEnSamaco) e.comprasEnSamaco = 'Elegí una opción.';
  if (f.matricula.trim() && !/^[A-Za-z0-9.\-\s/]{3,15}$/.test(f.matricula.trim())) e.matricula = 'Revisá el número de matrícula (3 a 15 caracteres).';
  if (f.password.length < 8) e.password = 'Mínimo 8 caracteres.';
  if (f.confirmar !== f.password) e.confirmar = 'Las contraseñas no coinciden.';
  if (!f.terminos) e.terminos = 'Tenés que aceptar las condiciones del Círculo.';
  return e;
}

/** Opciones tipo "chip": equivalen a los botones de radio del formulario original. */
function Opciones<T extends string>({ label, opciones, value, onChange, error, opcional }: {
  label: string; opciones: Record<T, string>; value: T | ''; onChange: (v: T) => void; error?: string; opcional?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelCls}>
        {label}{opcional ? <span className="normal-case tracking-normal font-semibold text-slate-400"> (opcional)</span> : ' *'}
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {(Object.entries(opciones) as [T, string][]).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-colors
              ${value === v ? 'bg-[#1B4F8C] border-[#1B4F8C] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#1B4F8C]'}`}>
            {l}
          </button>
        ))}
      </div>
      {error && <span className="block text-[11px] font-semibold text-red-600 mt-1">{error}</span>}
    </fieldset>
  );
}

export function AccesoView({ modo, ir }: { modo: 'ingresar' | 'registro'; ir: (v: View) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="container mx-auto px-4 md:px-8 max-w-5xl py-10 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Lateral */}
        <aside className="lg:col-span-2 bg-[#0d2a4d] text-white rounded-3xl p-8">
          <h1 className="mb-6">
            <img src={CPS_LOGO.verticalBlanco.src} width={CPS_LOGO.verticalBlanco.w} height={CPS_LOGO.verticalBlanco.h}
              alt="Círculo de Profesionales Samaco" className="h-36 w-auto" />
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">Completá tus datos para formar parte del club y activar tus beneficios exclusivos.</p>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {['Arquitectos, ingenieros, desarrolladores y constructores', 'Alta revisada por el equipo de Samaco', 'Credencial digital de socio', 'Eventos en Mendoza y San Juan'].map(t => (
              <li key={t} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#E8593C]" />{t}</li>
            ))}
          </ul>
          <button onClick={() => ir('profesionales')} className="mt-8 text-xs font-bold text-white/70 hover:text-white underline underline-offset-4">Conocer más sobre el Círculo</button>
        </aside>

        {/* Formulario */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8">
          <div role="tablist" className="flex bg-slate-100 rounded-xl p-1 mb-8">
            {([['pro-ingresar', 'Ingresar'], ['pro-registro', 'Crear cuenta']] as const).map(([v, label]) => {
              const activo = (modo === 'ingresar') === (v === 'pro-ingresar');
              return (
                <button key={v} role="tab" aria-selected={activo} onClick={() => ir(v)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${activo ? 'bg-white text-[#1B4F8C] shadow-sm' : 'text-slate-500'}`}>
                  {label}
                </button>
              );
            })}
          </div>
          {modo === 'ingresar' ? <FormIngreso ir={ir} /> : <FormRegistro ir={ir} />}
        </div>
      </div>
    </motion.div>
  );
}

function FormIngreso({ ir }: { ir: (v: View) => void }) {
  const { ingresar } = useProfesional();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError(null);
    const r = await ingresar(email, password);
    setEnviando(false);
    if ('error' in r) setError(r.error); else ir('panel');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Campo label="Email"><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></Campo>
      <Campo label="Contraseña">
        <div className="relative">
          <input type={verPass ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-11`} />
          <button type="button" onClick={() => setVerPass(v => !v)} aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Campo>
      {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
      <button type="submit" disabled={enviando}
        className="w-full py-3.5 bg-[#1B4F8C] hover:bg-[#163f70] disabled:bg-slate-300 text-white font-black rounded-xl text-sm transition-colors">
        {enviando ? 'Ingresando…' : 'Ingresar al panel'}
      </button>
      {esModoDemo && (
        <p className="flex gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
          <Info className="w-4 h-4 shrink-0 text-[#1B4F8C]" />
          <span>Modo demo: podés probar con <strong>{DEMO_CUENTA.email}</strong> / <strong>{DEMO_CUENTA.password}</strong> (cuenta aprobada).</span>
        </p>
      )}
    </form>
  );
}

function FormRegistro({ ir }: { ir: (v: View) => void }) {
  const { registrar } = useProfesional();
  const [f, setF] = useState<FormState>(VACIO);
  const [errores, setErrores] = useState<ReturnType<typeof validar>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(prev => ({ ...prev, [k]: v }));
  // Marca el bloque con error para poder llevar el scroll al primero.
  const marca = (k: keyof FormState) => (errores[k] ? { 'data-error': true } : {});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validar(f);
    setErrores(errs);
    if (Object.keys(errs).length) {
      setTimeout(() => document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return;
    }
    setEnviando(true); setErrorGeneral(null);
    const [nombre, ...resto] = f.nombreCompleto.trim().split(/\s+/);
    const matricula = f.matricula.trim();
    const input: RegistroInput = {
      nombre, apellido: resto.join(' '), email: f.email, telefono: f.telefono, password: f.password,
      profesion: f.profesion as Profesion, zona: f.zona as Zona,
      // Las zonas del formulario son de Mendoza; con "Otros" la persona elige su sede.
      sede: f.zona === 'otros' ? f.sede : 'mendoza',
      comprasEnSamaco: f.comprasEnSamaco as ComprasEnSamaco,
      comoNosConociste: f.comoNosConociste || undefined,
      matricula: matricula || undefined, colegio: matricula ? f.colegio : undefined,
      estudio: f.estudio, apareceEnDirectorio: f.apareceEnDirectorio,
    };
    const r = await registrar(input);
    setEnviando(false);
    if ('error' in r) setErrorGeneral(r.error); else ir('panel');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <p className="text-xs text-slate-400"><span className="text-red-500">*</span> Indica que la pregunta es obligatoria.</p>

      <div {...marca('nombreCompleto')}>
        <Campo label="Nombre y apellido *" error={errores.nombreCompleto}>
          <input autoComplete="name" value={f.nombreCompleto} onChange={e => set('nombreCompleto', e.target.value)} className={inputCls} />
        </Campo>
      </div>

      <div {...marca('profesion')}>
        <Opciones label="Especialidad" opciones={ESPECIALIDADES} value={f.profesion} onChange={v => set('profesion', v)} error={errores.profesion} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div {...marca('telefono')}>
          <Campo label="Teléfono WhatsApp *" error={errores.telefono}>
            <input type="tel" autoComplete="tel" placeholder="261 555 0000" value={f.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} />
          </Campo>
        </div>
        <div {...marca('email')}>
          <Campo label="Email *" error={errores.email}>
            <input type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} className={inputCls} />
          </Campo>
        </div>
      </div>

      <div {...marca('zona')}>
        <Opciones label="Zona de trabajo habitual" opciones={ZONAS} value={f.zona} onChange={v => set('zona', v)} error={errores.zona} />
        {f.zona === 'otros' && (
          <div className="mt-3 max-w-xs">
            <Campo label="Sede de referencia">
              <select value={f.sede} onChange={e => set('sede', e.target.value as Sede)} className={inputCls}>
                {Object.entries(SEDES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Campo>
          </div>
        )}
      </div>

      <div {...marca('comprasEnSamaco')}>
        <Opciones label="¿Actualmente comprás en Samaco?" opciones={COMPRAS_EN_SAMACO} value={f.comprasEnSamaco}
          onChange={v => set('comprasEnSamaco', v)} error={errores.comprasEnSamaco} />
      </div>

      <Opciones label="¿Cómo te enteraste del club?" opcional opciones={COMO_NOS_CONOCISTE} value={f.comoNosConociste}
        onChange={v => set('comoNosConociste', v)} />

      <details className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-4" open={!!errores.matricula} {...marca('matricula')}>
        <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-black text-slate-700">
          Datos profesionales <span className="text-xs font-semibold text-slate-400">opcional · matrícula, estudio</span>
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Campo label="N° de matrícula" error={errores.matricula} ayuda="Si tenés, nos ayuda a validar tu alta más rápido.">
            <input value={f.matricula} onChange={e => set('matricula', e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Colegio / consejo">
            <select value={f.colegio} onChange={e => set('colegio', e.target.value as Colegio)} disabled={!f.matricula.trim()} className={`${inputCls} disabled:opacity-50`}>
              {Object.entries(COLEGIOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <div className="sm:col-span-2">
            <Campo label="Estudio o empresa"><input value={f.estudio} onChange={e => set('estudio', e.target.value)} className={inputCls} /></Campo>
          </div>
        </div>
      </details>

      <fieldset className="space-y-4">
        <legend className="text-sm font-black text-slate-800 mb-3">Acceso a tu panel</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div {...marca('password')}>
            <Campo label="Contraseña *" error={errores.password}>
              <input type="password" autoComplete="new-password" value={f.password} onChange={e => set('password', e.target.value)} className={inputCls} />
            </Campo>
          </div>
          <Campo label="Repetir contraseña *" error={errores.confirmar}>
            <input type="password" autoComplete="new-password" value={f.confirmar} onChange={e => set('confirmar', e.target.value)} className={inputCls} />
          </Campo>
        </div>
      </fieldset>

      <div className="space-y-3" {...marca('terminos')}>
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={f.apareceEnDirectorio} onChange={e => set('apareceEnDirectorio', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1B4F8C]" />
          Quiero que mi nombre y estudio aparezcan en el directorio de la Red de Profesionales.
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={f.terminos} onChange={e => set('terminos', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1B4F8C]" />
          Acepto las condiciones del Círculo y que Samaco me contacte por WhatsApp o email para confirmar mi alta.
        </label>
        {errores.terminos && <p className="text-[11px] font-semibold text-red-600">{errores.terminos}</p>}
      </div>

      {errorGeneral && <p role="alert" className="text-sm font-semibold text-red-600">{errorGeneral}</p>}
      <button type="submit" disabled={enviando}
        className="w-full py-3.5 bg-[#E8593C] hover:bg-[#d14a2f] disabled:bg-slate-300 text-white font-black rounded-xl text-sm transition-colors">
        {enviando ? 'Enviando…' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
