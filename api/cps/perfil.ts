// /api/cps/perfil — datos del profesional logueado.
//  GET   → Profesional (404 { error: 'no-registrado' } si el cliente no pidió el alta al Círculo)
//  PATCH → actualiza teléfono, estudio, sede, directorio o eventos inscriptos
// El navegador manda el token de Customer Account API (login con código de Shopify) en Authorization.
import { admin, clienteLogueado, respuesta } from '../_lib/shopify';
import { CAMPOS_CLIENTE, TAG_BASE, aProfesional, type ClienteAdmin } from '../_lib/cps';
import { SEDES, type Profesional } from '../../src/profesionales/types';

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

  const owner = sesion.id;
  const mf: { ownerId: string; namespace: string; key: string; type: string; value: string }[] = [];
  const txt = (key: string, v: string) => mf.push({ ownerId: owner, namespace: 'cps', key, type: 'single_line_text_field', value: v.trim().slice(0, 200) });
  if (typeof cambios.telefono === 'string' && cambios.telefono.trim()) txt('whatsapp', cambios.telefono);
  if (typeof cambios.estudio === 'string' && cambios.estudio.trim()) txt('estudio', cambios.estudio);
  if (cambios.sede && cambios.sede in SEDES) txt('sede', SEDES[cambios.sede]);
  if (typeof cambios.apareceEnDirectorio === 'boolean') {
    mf.push({ ownerId: owner, namespace: 'cps', key: 'directorio', type: 'boolean', value: String(cambios.apareceEnDirectorio) });
  }
  if (Array.isArray(cambios.eventosInscriptos)) {
    const ids = cambios.eventosInscriptos.filter((x) => typeof x === 'string').slice(0, 100);
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
