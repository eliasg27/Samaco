// POST /api/cps/registro — alta al Círculo de Profesionales.
// Solo con el email confirmado: el navegador manda el token del login con código de Shopify (Authorization),
// así nadie puede anotar el email de otra persona ni crear clientes falsos en cantidad.
// Marca al cliente de Shopify con los tags `cps` + `cps-pendiente` y guarda sus datos en metafields `cps.*`.
// Samaco lo aprueba desde el admin cambiando el tag.
import { admin, clienteLogueado, respuesta } from '../_lib/shopify.js';
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

  const sesion = await clienteLogueado(request.headers.get('authorization'));
  if (!sesion?.email) return respuesta(401, { ok: false, error: 'Confirmá tu email con el código para enviar la solicitud.' });

  // El email es el que Shopify verificó con el código, no el que vino escrito en el formulario.
  const email = sesion.email.trim().toLowerCase();
  const error = validarRegistro({ ...input, email });
  if (error) return respuesta(400, { ok: false, error });
  const datos = { ...input, email } as RegistroInput;

  try {
    // Al entrar con el código, Shopify ya creó (o encontró) el cliente de ese email.
    const { customer: existente } = await admin<{ customer: ClienteAdmin | null }>(
      `query($id: ID!) { customer(id: $id) { ${CAMPOS_CLIENTE} } }`, { id: sesion.id });

    if (existente) {
      // Si ya pidió el alta (pendiente, aprobado o rechazado) no se toca: el estado lo maneja Samaco.
      if (existente.tags.includes(TAG_BASE)) return respuesta(200, { ok: true });

      // Es su propia cuenta (email confirmado): se guardan sus datos del Círculo y, si faltaba, el nombre.
      const metafields = metafieldsRegistro(datos).map((m) => ({ ...m, ownerId: existente.id }));
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
      const mf = await admin<{ metafieldsSet: { userErrors: { message: string }[] } }>(
        `mutation($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`, { m: metafields });
      if (mf.metafieldsSet.userErrors.length) throw new Error(mf.metafieldsSet.userErrors.map((e) => e.message).join('; '));
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
