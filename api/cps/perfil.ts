// /api/cps/perfil — datos del profesional logueado.
//  GET   → Profesional (404 { error: 'no-registrado' } si el cliente no pidió el alta al Círculo)
//  PATCH → actualiza teléfono, estudio, sede, directorio o eventos inscriptos
// El navegador manda el token de Customer Account API (login con código de Shopify) en Authorization.
import { admin, clienteLogueado, respuesta } from '../_lib/shopify.js';
import { CAMPOS_CLIENTE, TAG_BASE, aProfesional, type ClienteAdmin } from '../_lib/cps.js';
import { SEDES, type Profesional } from '../../src/profesionales/types.js';
import { EVENTOS } from '../../src/profesionales/mock-data.js';

/** WhatsApp: solo dígitos, espacios, +, guiones y paréntesis, con 8 a 15 dígitos. */
const whatsappValido = (v: string) => /^[\d\s+()-]{8,30}$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 8 && (v.match(/\d/g)?.length ?? 0) <= 15;
const ID_EVENTOS = new Set(EVENTOS.map((e) => e.id));

async function leer(id: string) {
  const { customer } = await admin<{ customer: ClienteAdmin | null }>(
    `query($id: ID!) { customer(id: $id) { ${CAMPOS_CLIENTE} } }`, { id });
  return customer;
}

export async function GET(request: Request) {
  const sesion = await clienteLogueado(request.headers.get('authorization'));
  if (!sesion) return respuesta(401, { error: 'sin-sesion' });
  try {
    const c = await leer(sesion.id);
    if (!c || !c.tags.includes(TAG_BASE)) return respuesta(404, { error: 'no-registrado', email: sesion.email });
    return respuesta(200, aProfesional(c));
  } catch (e) {
    console.error('[cps/perfil GET]', e);
    return respuesta(500, { error: 'error' });
  }
}

type Cambios = Partial<Pick<Profesional, 'telefono' | 'estudio' | 'apareceEnDirectorio' | 'sede' | 'eventosInscriptos'>>;

export async function PATCH(request: Request) {
  const sesion = await clienteLogueado(request.headers.get('authorization'));
  if (!sesion) return respuesta(401, { error: 'sin-sesion' });
  let cambios: Cambios;
  try { cambios = await request.json(); } catch { return respuesta(400, { error: 'datos-invalidos' }); }

  if (!cambios || typeof cambios !== 'object') return respuesta(400, { error: 'datos-invalidos' });
  if (typeof cambios.telefono === 'string' && cambios.telefono.trim() && !whatsappValido(cambios.telefono.trim())) {
    return respuesta(400, { error: 'whatsapp-invalido' });
  }

  const owner = sesion.id;
  const mf: { ownerId: string; namespace: string; key: string; type: string; value: string }[] = [];
  const txt = (key: string, v: string, max: number) => mf.push({ ownerId: owner, namespace: 'cps', key, type: 'single_line_text_field', value: v.trim().slice(0, max) });
  if (typeof cambios.telefono === 'string' && cambios.telefono.trim()) txt('whatsapp', cambios.telefono, 30);
  if (typeof cambios.estudio === 'string' && cambios.estudio.trim()) txt('estudio', cambios.estudio, 120);
  if (cambios.sede && cambios.sede in SEDES) txt('sede', SEDES[cambios.sede], 60);
  if (typeof cambios.apareceEnDirectorio === 'boolean') {
    mf.push({ ownerId: owner, namespace: 'cps', key: 'directorio', type: 'boolean', value: String(cambios.apareceEnDirectorio) });
  }
  if (Array.isArray(cambios.eventosInscriptos)) {
    // Solo eventos que existen, sin repetidos.
    const ids = [...new Set(cambios.eventosInscriptos.filter((x): x is string => typeof x === 'string' && ID_EVENTOS.has(x)))];
    mf.push({ ownerId: owner, namespace: 'cps', key: 'eventos', type: 'json', value: JSON.stringify(ids) });
  }

  try {
    const c = await leer(owner);
    if (!c || !c.tags.includes(TAG_BASE)) return respuesta(404, { error: 'no-registrado' });
    if (mf.length) {
      const r = await admin<{ metafieldsSet: { userErrors: { message: string }[] } }>(
        `mutation($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`, { m: mf });
      if (r.metafieldsSet.userErrors.length) throw new Error(r.metafieldsSet.userErrors.map((e) => e.message).join('; '));
    }
    return respuesta(200, aProfesional((await leer(owner))!));
  } catch (e) {
    console.error('[cps/perfil PATCH]', e);
    return respuesta(500, { error: 'error' });
  }
}
