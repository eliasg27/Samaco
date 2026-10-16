import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { CPS_LOGO } from './ui';
import { View } from '../types';
import { useProfesional } from './context';
import { esModoDemo } from './mock';
import { DEMO_CUENTA } from './mock-data';
import { Colegio, COLEGIOS, Profesion, PROFESIONES, RegistroInput, Sede, SEDES } from './types';

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

const VACIO: RegistroInput = {
  nombre: '', apellido: '', email: '', telefono: '', password: '',
  profesion: 'arquitecto', matricula: '', colegio: 'camza', sede: 'mendoza', estudio: '', apareceEnDirectorio: true,
};

function validar(f: RegistroInput & { confirmar: string; terminos: boolean }) {
  const e: Partial<Record<keyof typeof f, string>> = {};
  if (!f.nombre.trim())   e.nombre = 'Ingresá tu nombre.';
  if (!f.apellido.trim()) e.apellido = 'Ingresá tu apellido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Email inválido.';
  if (f.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Ingresá un teléfono con código de área.';
  if (!/^[A-Za-z0-9.\-\s/]{3,15}$/.test(f.matricula.trim())) e.matricula = 'Revisá el número de matrícula (3 a 15 caracteres).';
  if (f.password.length < 8) e.password = 'Mínimo 8 caracteres.';
  if (f.confirmar !== f.password) e.confirmar = 'Las contraseñas no coinciden.';
  if (!f.terminos) e.terminos = 'Tenés que aceptar las condiciones del Círculo.';
  return e;
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
          <p className="text-sm text-slate-300 leading-relaxed mb-6">Precios profesionales, eventos en Mendoza y San Juan, y un asesor dedicado para tus obras.</p>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {['Alta con matrícula profesional', 'Validación por el equipo de Samaco', 'Credencial digital de socio', 'Eventos en Mendoza y San Juan'].map(t => (
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
  const [f, setF] = useState({ ...VACIO, confirmar: '', terminos: false });
  const [errores, setErrores] = useState<ReturnType<typeof validar>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(prev => ({ ...prev, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validar(f);
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true); setErrorGeneral(null);
    const { confirmar: _c, terminos: _t, ...input } = f;
    const r = await registrar(input);
    setEnviando(false);
    if ('error' in r) setErrorGeneral(r.error); else ir('panel');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <fieldset className="space-y-4">
        <legend className="text-sm font-black text-slate-800 mb-3">Datos personales</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nombre" error={errores.nombre}><input autoComplete="given-name" value={f.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} /></Campo>
          <Campo label="Apellido" error={errores.apellido}><input autoComplete="family-name" value={f.apellido} onChange={e => set('apellido', e.target.value)} className={inputCls} /></Campo>
          <Campo label="Email" error={errores.email}><input type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} className={inputCls} /></Campo>
          <Campo label="Teléfono / WhatsApp" error={errores.telefono}><input type="tel" autoComplete="tel" placeholder="261 555 0000" value={f.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} /></Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-black text-slate-800 mb-3">Datos profesionales</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Profesión">
            <select value={f.profesion} onChange={e => set('profesion', e.target.value as Profesion)} className={inputCls}>
              {Object.entries(PROFESIONES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <Campo label="Sede de referencia">
            <select value={f.sede} onChange={e => set('sede', e.target.value as Sede)} className={inputCls}>
              {Object.entries(SEDES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <Campo label="N° de matrícula" error={errores.matricula} ayuda="Tal como figura en tu credencial del colegio.">
            <input value={f.matricula} onChange={e => set('matricula', e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Colegio / consejo">
            <select value={f.colegio} onChange={e => set('colegio', e.target.value as Colegio)} className={inputCls}>
              {Object.entries(COLEGIOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <div className="sm:col-span-2">
            <Campo label="Estudio (opcional)"><input value={f.estudio} onChange={e => set('estudio', e.target.value)} className={inputCls} /></Campo>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-black text-slate-800 mb-3">Acceso</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Contraseña" error={errores.password}><input type="password" autoComplete="new-password" value={f.password} onChange={e => set('password', e.target.value)} className={inputCls} /></Campo>
          <Campo label="Repetir contraseña" error={errores.confirmar}><input type="password" autoComplete="new-password" value={f.confirmar} onChange={e => set('confirmar', e.target.value)} className={inputCls} /></Campo>
        </div>
      </fieldset>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={f.apareceEnDirectorio} onChange={e => set('apareceEnDirectorio', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1B4F8C]" />
          Quiero que mi nombre y estudio aparezcan en el directorio de la Red de Profesionales.
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={f.terminos} onChange={e => set('terminos', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1B4F8C]" />
          Acepto las condiciones del Círculo y autorizo a Samaco a verificar mi matrícula ante el colegio correspondiente.
        </label>
        {errores.terminos && <p className="text-[11px] font-semibold text-red-600">{errores.terminos}</p>}
      </div>

      {errorGeneral && <p role="alert" className="text-sm font-semibold text-red-600">{errorGeneral}</p>}
      <button type="submit" disabled={enviando}
        className="w-full py-3.5 bg-[#E8593C] hover:bg-[#d14a2f] disabled:bg-slate-300 text-white font-black rounded-xl text-sm transition-colors">
        {enviando ? 'Creando cuenta…' : 'Solicitar alta al Círculo'}
      </button>
    </form>
  );
}
