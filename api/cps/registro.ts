// POST /api/cps/registro — alta al Círculo de Profesionales.
// Crea (o completa, si ya compró antes) el cliente de Shopify con los tags `cps` + `cps-pendiente`
// y sus datos en metafields `cps.*`. Samaco lo aprueba desde el admin cambiando el tag.
import { admin, respuesta } from '../_lib/shopify.js';
import { excedido, ipDe } from '../_lib/limite.js';
import { CAMPOS_CLIENTE, TAG, TAG_BASE, metafieldsRegistro, validarRegistro, type ClienteAdmin } from '../_lib/cps.js';
import type { RegistroInput } from '../../src/profesionales/types.js';

export async function POST(request: Request) {
  // Máximo 5 solicitudes cada 15 minutos por IP (una persona real manda una).
  if (excedido(`registro:${ipDe(request)}`, 5, 15 * 60_000)) {
    return respuesta(429, { ok: false, error: 'Recibimos muchas solicitudes seguidas desde tu conexión. Probá de nuevo en unos minutos.' });
  }

  let input: Partial<RegistroInput> & { sitio_web?: string };
  try { input = await request.json(); } catch { return respuesta(400, { ok: false, error: 'Datos inválidos.' }); }

  // Campo trampa: los humanos no lo ven; si viene lleno es un bot. Se responde ok para no darle pistas.
  if (input.sitio_web) return respuesta(200, { ok: true });

  const error = validarRegistro(input);
  if (error) return respuesta(400, { ok: false, error });
  const datos = input as RegistroInput;
  const email = datos.email.trim().toLowerCase();

  try {
    // Búsqueda exacta por email (no depende del índice de búsqueda, que tarda en actualizarse
    // y puede devolver parecidos). Igual se confirma que el email coincida antes de tocar nada.
    const { customerByIdentifier } = await admin<{ customerByIdentifier: ClienteAdmin | null }>(
      `query($email: String!) { customerByIdentifier(identifier: { emailAddress: $email }) { ${CAMPOS_CLIENTE} } }`,
      { email },
    );
    const existente = customerByIdentifier?.email?.trim().toLowerCase() === email ? customerByIdentifier : null;

    if (existente) {
      // El formulario es público (sin login), así que a un cliente existente nunca se le pisa nada:
      //  - si ya pidió el alta (pendiente, aprobado o rechazado) no se toca: el estado lo maneja Samaco;
      //  - si era cliente común (compró antes o entró con su cuenta), se le agregan los tags de solicitud
      //    y solo los datos que le faltan (nombre vacío, metafields cps.* inexistentes).
      // La respuesta es siempre la misma para no revelar si un email es cliente o miembro.
      if (existente.tags.includes(TAG_BASE)) return respuesta(200, { ok: true });

      const yaTiene = new Set(existente.metafields.nodes.map((m) => m.key));
      const faltantes = metafieldsRegistro(datos)
        .filter((m) => !yaTiene.has(m.key))
        .map((m) => ({ ...m, ownerId: existente.id }));
      const nombre = {
        ...(!existente.firstName?.trim() ? { firstName: datos.nombre.trim() } : {}),
        ...(!existente.lastName?.trim() ? { lastName: datos.apellido.trim() } : {}),
      };

      if (Object.keys(nombre).length) {
        const upd = await admin<{ customerUpdate: { userErrors: { message: string }[] } }>(
          `mutation($input: CustomerInput!) { customerUpdate(input: $input) { userErrors { message } } }`,
          { input: { id: existente.id, ...nombre } },
        );
        if (upd.customerUpdate.userErrors.length) throw new Error(upd.customerUpdate.userErrors.map((e) => e.message).join('; '));
      }
      if (faltantes.length) {
        const mf = await admin<{ metafieldsSet: { userErrors: { message: string }[] } }>(
          `mutation($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`, { m: faltantes });
        if (mf.metafieldsSet.userErrors.length) throw new Error(mf.metafieldsSet.userErrors.map((e) => e.message).join('; '));
      }
      const tags = await admin<{ tagsAdd: { userErrors: { message: string }[] } }>(
        `mutation($id: ID!, $add: [String!]!) { tagsAdd(id: $id, tags: $add) { userErrors { message } } }`,
        { id: existente.id, add: [TAG_BASE, TAG.pendiente] });
      if (tags.tagsAdd.userErrors.length) throw new Error(tags.tagsAdd.userErrors.map((e) => e.message).join('; '));
      return respuesta(200, { ok: true });
    }

    const r = await admin<{ customerCreate: { userErrors: { message: string }[] } }>(
      `mutation($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { message } } }`,
      {
        input: {
          firstName: datos.nombre.trim(), lastName: datos.apellido.trim(), email,
          tags: [TAG_BASE, TAG.pendiente],
          note: 'Solicitud al Círculo de Profesionales desde el sitio.',
          metafields: metafieldsRegistro(datos),
        },
      },
    );
    if (r.customerCreate.userErrors.length) throw new Error(r.customerCreate.userErrors.map((e) => e.message).join('; '));
    return respuesta(200, { ok: true });
  } catch (e) {
    console.error('[cps/registro]', e);
    return respuesta(500, { ok: false, error: 'No pudimos guardar tu solicitud. Probá de nuevo en unos minutos o escribinos por WhatsApp.' });
  }
}
