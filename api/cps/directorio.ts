// GET /api/cps/directorio — miembros aprobados que aceptaron aparecer en la Red de Profesionales.
// Solo devuelve datos públicos (nombre, especialidad, estudio, sede). Lo ven únicamente miembros aprobados (tag cps-aprobado).
import { admin, clienteLogueado, respuesta } from '../_lib/shopify.js';
import { CAMPOS_CLIENTE, TAG, aProfesional, type ClienteAdmin } from '../_lib/cps.js';

export async function GET(request: Request) {
  const sesion = await clienteLogueado(request.headers.get('authorization'));
  if (!sesion) return respuesta(401, { error: 'sin-sesion' });
  try {
    // Solo miembros aprobados: un cliente logueado cualquiera (o una solicitud pendiente) no ve la red.
    const { customer } = await admin<{ customer: { tags: string[] } | null }>(
      `query($id: ID!) { customer(id: $id) { tags } }`, { id: sesion.id });
    if (!customer?.tags.includes(TAG.aprobado)) return respuesta(403, { error: 'solo-miembros' });

    const { customers } = await admin<{ customers: { nodes: ClienteAdmin[] } }>(
      `query($q: String!) { customers(first: 250, query: $q) { nodes { ${CAMPOS_CLIENTE} } } }`, { q: `tag:${TAG.aprobado}` });
    const lista = customers.nodes.map(aProfesional)
      .filter((p) => p.apareceEnDirectorio)
      .map(({ id, nombre, apellido, profesion, estudio, sede }) => ({ id, nombre, apellido, profesion, estudio, sede }));
    return respuesta(200, lista);
  } catch (e) {
    console.error('[cps/directorio]', e);
    return respuesta(500, { error: 'error' });
  }
}
