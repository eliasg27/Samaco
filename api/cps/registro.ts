// POST /api/cps/registro — alta al Círculo de Profesionales.
// Crea (o completa, si ya compró antes) el cliente de Shopify con los tags `cps` + `cps-pendiente`
// y sus datos en metafields `cps.*`. Samaco lo aprueba desde el admin cambiando el tag.
import { admin, respuesta } from '../_lib/shopify.js';
import { CAMPOS_CLIENTE, TAG, TAG_BASE, metafieldsRegistro, validarRegistro, type ClienteAdmin } from '../_lib/cps.js';
import type { RegistroInput } from '../../src/profesionales/types.js';

export async function POST(request: Request) {
  let input: Partial<RegistroInput> & { sitio_web?: string };
  try { input = await request.json(); } catch { return respuesta(400, { ok: false, error: 'Datos inválidos.' }); }

  // Campo trampa: los humanos no lo ven; si viene lleno es un bot. Se responde ok para no darle pistas.
  if (input.sitio_web) return respuesta(200, { ok: true });

  const error = validarRegistro(input);
  if (error) return respuesta(400, { ok: false, error });
  const datos = input as RegistroInput;
  const email = datos.email.trim().toLowerCase();

  try {
    const { customers } = await admin<{ customers: { nodes: ClienteAdmin[] } }>(
      `query($q: String!) { customers(first: 1, query: $q) { nodes { ${CAMPOS_CLIENTE} } } }`,
      { q: `email:"${email.replace(/"/g, '')}"` },
    );
    const existente = customers.nodes[0];

    if (existente?.tags.includes(TAG.aprobado)) return respuesta(200, { ok: true, yaEsMiembro: true });

    if (existente) {
      // Ya era cliente (compró antes o se había registrado): se completan los datos y vuelve a quedar pendiente.
      const upd = await admin<{ customerUpdate: { userErrors: { message: string }[] } }>(
        `mutation($input: CustomerInput!) { customerUpdate(input: $input) { userErrors { message } } }`,
        { input: { id: existente.id, firstName: datos.nombre.trim(), lastName: datos.apellido.trim(), metafields: metafieldsRegistro(datos) } },
      );
      if (upd.customerUpdate.userErrors.length) throw new Error(upd.customerUpdate.userErrors.map((e) => e.message).join('; '));
      await admin(`mutation($id: ID!, $add: [String!]!, $rm: [String!]!) {
          tagsAdd(id: $id, tags: $add) { userErrors { message } }
          tagsRemove(id: $id, tags: $rm) { userErrors { message } } }`,
        { id: existente.id, add: [TAG_BASE, TAG.pendiente], rm: [TAG.rechazado] });
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
