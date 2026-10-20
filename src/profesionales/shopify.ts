import { ProfesionalesService } from './service';
import { mockProfesionales } from './mock';
import { Profesional, RegistroInput, ResultadoAuth, ResultadoIngreso, ResultadoRegistro } from './types';

/**
 * Provider real del Círculo:
 *  - Alta y perfil → funciones de Vercel en api/cps/ (crean y leen el cliente de Shopify con la Admin API).
 *  - Ingreso → login sin contraseña de Shopify (Customer Account API, OAuth con PKCE): Shopify le manda
 *    un código por email y vuelve a /CPS/acceso. El token queda en este navegador y viaja a api/cps/perfil,
 *    que lo valida contra Shopify.
 *  - Eventos, descuentos, beneficios y estudios siguen saliendo de mock-data.ts hasta cargarlos en Shopify.
 */

const SHOP_ID = import.meta.env.VITE_SHOPIFY_SHOP_ID as string;
const CLIENT_ID = import.meta.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID as string;
const AUTH = `https://shopify.com/authentication/${SHOP_ID}`;
const redirectUri = () => `${location.origin}/CPS/acceso`;

const KEY_TOKENS = 'samaco_cps_tokens';
const KEY_PKCE = 'samaco_cps_pkce';

interface Tokens { access: string; refresh?: string; idToken?: string; vence: number }

const leerTokens = (): Tokens | null => {
  try { return JSON.parse(localStorage.getItem(KEY_TOKENS) ?? 'null'); } catch { return null; }
};
const guardarTokens = (t: Tokens | null) => {
  try { t ? localStorage.setItem(KEY_TOKENS, JSON.stringify(t)) : localStorage.removeItem(KEY_TOKENS); } catch { /* storage bloqueado */ }
};

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const aleatorio = (n = 32) => base64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (s: string) => base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));

async function pedirToken(params: Record<string, string>): Promise<Tokens | null> {
  const res = await fetch(`${AUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
  });
  if (!res.ok) return null;
  const j = await res.json() as { access_token: string; refresh_token?: string; id_token?: string; expires_in: number };
  const anterior = leerTokens();
  return {
    access: j.access_token,
    refresh: j.refresh_token ?? anterior?.refresh,
    idToken: j.id_token ?? anterior?.idToken,
    vence: Date.now() + (j.expires_in - 60) * 1000,
  };
}

/** Token vigente (lo renueva si venció). null si no hay sesión. */
async function token(): Promise<string | null> {
  const t = leerTokens();
  if (!t) return null;
  if (t.vence > Date.now()) return t.access;
  const nuevo = t.refresh ? await pedirToken({ grant_type: 'refresh_token', refresh_token: t.refresh }) : null;
  guardarTokens(nuevo);
  return nuevo?.access ?? null;
}

async function api<T>(ruta: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const t = await token();
  const res = await fetch(ruta, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...init.headers },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) as T };
}

async function perfil(): Promise<ResultadoAuth> {
  const r = await api<Profesional & { error?: string; email?: string }>('/api/cps/perfil');
  if (r.status === 200) return { ok: true, profesional: r.body };
  if (r.status === 404 && r.body.error === 'no-registrado') {
    return { ok: false, codigo: 'no-registrado', email: r.body.email, error: 'Todavía no tenemos una solicitud al Círculo con ese email.' };
  }
  if (r.status === 401) guardarTokens(null);
  return { ok: false, error: 'No pudimos cargar tu perfil. Probá de nuevo.' };
}

async function guardarCambios(cambios: Partial<Profesional>): Promise<Profesional> {
  const r = await api<Profesional>('/api/cps/perfil', { method: 'PATCH', body: JSON.stringify(cambios) });
  if (r.status !== 200) throw new Error('No se pudieron guardar los cambios');
  return r.body;
}

export const shopifyProfesionales: ProfesionalesService = {
  async registrar(input: RegistroInput): Promise<ResultadoRegistro> {
    try {
      const res = await fetch('/api/cps/registro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      const j = await res.json().catch(() => ({})) as { ok?: boolean; error?: string; yaEsMiembro?: boolean };
      return j.ok ? { ok: true, yaEsMiembro: j.yaEsMiembro } : { ok: false, error: j.error ?? 'No pudimos enviar tu solicitud.' };
    } catch {
      return { ok: false, error: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' };
    }
  },

  async ingresar(email): Promise<ResultadoIngreso> {
    const verifier = aleatorio(48);
    const state = aleatorio(16);
    sessionStorage.setItem(KEY_PKCE, JSON.stringify({ verifier, state }));
    const url = new URL(`${AUTH}/oauth/authorize`);
    url.search = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri(),
      scope: 'openid email customer-account-api:full',
      state,
      nonce: aleatorio(16),
      code_challenge: await sha256(verifier),
      code_challenge_method: 'S256',
      ...(email.trim() ? { login_hint: email.trim() } : {}),
      locale: 'es',
    }).toString();
    location.assign(url.toString());
    return { ok: true, redirigiendo: true };
  },

  async completarIngreso(params) {
    let pkce: { verifier: string; state: string } | null = null;
    try { pkce = JSON.parse(sessionStorage.getItem(KEY_PKCE) ?? 'null'); } catch { /* noop */ }
    sessionStorage.removeItem(KEY_PKCE);
    const code = params.get('code');
    if (!code || !pkce || params.get('state') !== pkce.state) {
      return { ok: false, error: 'El ingreso se interrumpió o venció. Probá de nuevo.' };
    }
    const t = await pedirToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: pkce.verifier });
    if (!t) return { ok: false, error: 'Shopify no confirmó el ingreso. Probá de nuevo.' };
    guardarTokens(t);
    return perfil();
  },

  async salir() {
    const t = leerTokens();
    guardarTokens(null);
    // Cierra también la sesión en Shopify (si no, el próximo ingreso entra sin pedir código).
    if (t?.idToken) {
      const url = new URL(`${AUTH}/logout`);
      url.search = new URLSearchParams({ id_token_hint: t.idToken, post_logout_redirect_uri: `${location.origin}/CPS` }).toString();
      location.assign(url.toString());
    }
  },

  async sesionActual() {
    if (!leerTokens()) return null;
    const r = await perfil();
    return r.ok ? r.profesional : null;
  },

  actualizarPerfil: (_id, cambios) => guardarCambios(cambios),

  async inscribirEvento(_id, eventoId) {
    const actual = await perfil();
    if (!actual.ok) throw new Error('Sin sesión');
    if (actual.profesional.eventosInscriptos.includes(eventoId)) return actual.profesional;
    return guardarCambios({ eventosInscriptos: [...actual.profesional.eventosInscriptos, eventoId] });
  },

  async cancelarInscripcion(_id, eventoId) {
    const actual = await perfil();
    if (!actual.ok) throw new Error('Sin sesión');
    return guardarCambios({ eventosInscriptos: actual.profesional.eventosInscriptos.filter(e => e !== eventoId) });
  },

  async getDirectorio() {
    const r = await api<Awaited<ReturnType<ProfesionalesService['getDirectorio']>>>('/api/cps/directorio');
    return r.status === 200 && Array.isArray(r.body) ? r.body : [];
  },

  // Contenido editorial: todavía de ejemplo (mock-data.ts).
  getEventos: (sede) => mockProfesionales.getEventos(sede),
  getEvento: (id) => mockProfesionales.getEvento(id),
  getDescuentos: () => mockProfesionales.getDescuentos(),
  getBeneficios: () => mockProfesionales.getBeneficios(),
  getEstudios: () => mockProfesionales.getEstudios(),
};
