import { ProfesionalesService } from './service';
import { Profesional, RegistroInput, ResultadoIngreso, ResultadoRegistro } from './types';
import { BENEFICIOS, DEMO_CUENTA, DESCUENTOS, ESTUDIOS, EVENTOS } from './mock-data';

// Provider de desarrollo: todo vive en localStorage del navegador. No hay backend ni seguridad real.
// Igual que el ingreso real (código por email de Shopify), no hay contraseñas: se entra con el email.

interface CuentaGuardada { profesional: Profesional }

const KEY_CUENTAS = 'samaco_pro_cuentas';
const KEY_SESION  = 'samaco_pro_sesion';

const leer = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
};
const escribir = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage bloqueado */ }
};

const normalizarMatricula = (m: string) => m.trim().toUpperCase().replace(/\s+/g, '');
const nuevoNumeroSocio = () => `CP-${String(Math.floor(1000 + Math.random() * 9000))}`;

async function cuentas(): Promise<CuentaGuardada[]> {
  const lista = leer<CuentaGuardada[]>(KEY_CUENTAS, []);
  if (!lista.some(c => c.profesional.email === DEMO_CUENTA.email)) {
    lista.push({
      profesional: {
        id: 'pro-demo', numeroSocio: 'CP-0001',
        nombre: 'Cuenta', apellido: 'Demo', email: DEMO_CUENTA.email, telefono: '2610000000',
        profesion: 'arquitecto', matricula: 'DEMO-001', colegio: 'camza', zona: 'godoy-cruz', sede: 'mendoza',
        comprasEnSamaco: 'regular', estudio: 'Estudio Demo', apareceEnDirectorio: true, estado: 'aprobado',
        fechaAlta: '2026-01-15T00:00:00-03:00', eventosInscriptos: ['lanzamiento-griferia-fv'],
      },
    });
    escribir(KEY_CUENTAS, lista);
  }
  return lista;
}

async function guardar(profesional: Profesional) {
  const lista = await cuentas();
  escribir(KEY_CUENTAS, lista.map(c => c.profesional.id === profesional.id ? { ...c, profesional } : c));
  return profesional;
}

async function buscar(id: string) {
  const c = (await cuentas()).find(c => c.profesional.id === id);
  if (!c) throw new Error('Cuenta inexistente');
  return c.profesional;
}

export const mockProfesionales: ProfesionalesService & { simularAprobacion(id: string): Promise<Profesional> } = {
  async registrar(input: RegistroInput): Promise<ResultadoRegistro> {
    const lista = await cuentas();
    const email = input.email.trim().toLowerCase();
    // La matrícula es opcional; si la cargan, no puede repetirse en el mismo colegio.
    const matricula = input.matricula?.trim() ? normalizarMatricula(input.matricula) : undefined;
    if (lista.some(c => c.profesional.email === email)) {
      return { ok: false, error: 'Ya existe una cuenta con ese email.' };
    }
    if (matricula && lista.some(c => c.profesional.matricula === matricula && c.profesional.colegio === input.colegio)) {
      return { ok: false, error: 'Esa matrícula ya está registrada en el Círculo. Si es tuya, escribinos.' };
    }
    const profesional: Profesional = {
      id: `pro-${Date.now()}`,
      nombre: input.nombre.trim(), apellido: input.apellido.trim(), email,
      telefono: input.telefono.trim(), profesion: input.profesion,
      matricula, colegio: matricula ? input.colegio : undefined,
      zona: input.zona, sede: input.sede, comprasEnSamaco: input.comprasEnSamaco,
      comoNosConociste: input.comoNosConociste, estudio: input.estudio?.trim() || undefined,
      apareceEnDirectorio: input.apareceEnDirectorio, estado: 'pendiente',
      fechaAlta: new Date().toISOString(), eventosInscriptos: [],
    };
    escribir(KEY_CUENTAS, [...lista, { profesional }]);
    escribir(KEY_SESION, profesional.id);
    return { ok: true, profesional };
  },

  async ingresar(email): Promise<ResultadoIngreso> {
    const c = (await cuentas()).find(c => c.profesional.email === email.trim().toLowerCase());
    if (!c) return { ok: false, error: 'No encontramos una solicitud con ese email.', codigo: 'no-registrado', email };
    escribir(KEY_SESION, c.profesional.id);
    return { ok: true, profesional: c.profesional };
  },

  async salir() {
    try { localStorage.removeItem(KEY_SESION); } catch { /* noop */ }
  },

  async sesionActual() {
    const id = leer<string | null>(KEY_SESION, null);
    if (!id) return null;
    return (await cuentas()).find(c => c.profesional.id === id)?.profesional ?? null;
  },

  async actualizarPerfil(id, cambios) {
    return guardar({ ...(await buscar(id)), ...cambios });
  },

  async getEventos(sede) {
    const ahora = Date.now();
    const lista = await cuentas();
    // Suma al cupo las inscripciones hechas desde este navegador (las de la cuenta demo ya están en los datos).
    const extra = (id: string) => lista.filter(c => c.profesional.id !== 'pro-demo' && c.profesional.eventosInscriptos.includes(id)).length;
    return EVENTOS
      .map(e => ({ ...e, inscriptos: Math.min(e.cupo, e.inscriptos + extra(e.id)) }))
      .filter(e => new Date(e.fecha).getTime() >= ahora && (!sede || e.sede === sede))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  },

  async getEvento(id) {
    // Sin filtro de fecha: un link compartido a un evento pasado tiene que seguir abriendo.
    const lista = await cuentas();
    const e = EVENTOS.find(ev => ev.id === id);
    if (!e) return null;
    const extra = lista.filter(c => c.profesional.id !== 'pro-demo' && c.profesional.eventosInscriptos.includes(id)).length;
    return { ...e, inscriptos: Math.min(e.cupo, e.inscriptos + extra) };
  },

  async inscribirEvento(profesionalId, eventoId) {
    const p = await buscar(profesionalId);
    if (p.eventosInscriptos.includes(eventoId)) return p;
    return guardar({ ...p, eventosInscriptos: [...p.eventosInscriptos, eventoId] });
  },

  async cancelarInscripcion(profesionalId, eventoId) {
    const p = await buscar(profesionalId);
    return guardar({ ...p, eventosInscriptos: p.eventosInscriptos.filter(id => id !== eventoId) });
  },

  async getDescuentos() { return DESCUENTOS; },
  async getBeneficios() { return BENEFICIOS; },
  async getEstudios()   { return ESTUDIOS; },

  async getDirectorio() {
    return (await cuentas())
      .map(c => c.profesional)
      .filter(p => p.estado === 'aprobado' && p.apareceEnDirectorio)
      .map(({ id, nombre, apellido, profesion, estudio, sede }) => ({ id, nombre, apellido, profesion, estudio, sede }));
  },

  /** Solo demo: en producción la aprobación la hace Samaco al validar la matrícula. */
  async simularAprobacion(id) {
    const p = await buscar(id);
    return guardar({ ...p, estado: 'aprobado', numeroSocio: p.numeroSocio ?? nuevoNumeroSocio() });
  },
};

