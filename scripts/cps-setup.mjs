// Prepara la tienda para el Círculo de Profesionales (idempotente, se puede correr de nuevo):
//  - definiciones de metafields de cliente `cps.*` (se ven como campos en la ficha del cliente)
//  - segmentos de clientes "Círculo – pendientes" y "Círculo – miembros"
// Uso: node scripts/cps-setup.mjs
import { admin } from './shopify-admin.mjs';

const CAMPOS = [
  ['profesion', 'Especialidad', 'single_line_text_field'],
  ['matricula', 'Matrícula', 'single_line_text_field'],
  ['colegio', 'Colegio / consejo', 'single_line_text_field'],
  ['whatsapp', 'WhatsApp', 'single_line_text_field'],
  ['zona', 'Zona de trabajo', 'single_line_text_field'],
  ['sede', 'Sede', 'single_line_text_field'],
  ['estudio', 'Estudio / empresa', 'single_line_text_field'],
  ['compras_en_samaco', '¿Compra en Samaco?', 'single_line_text_field'],
  ['como_nos_conociste', 'Cómo nos conoció', 'single_line_text_field'],
  ['directorio', 'Aparece en el directorio', 'boolean'],
  ['numero_socio', 'N.º de socio', 'single_line_text_field'],
  ['eventos', 'Eventos inscriptos', 'json'],
  ['fecha_alta', 'Fecha de solicitud', 'date_time'],
];

const SEGMENTOS = [
  ['Círculo – pendientes', "customer_tags CONTAINS 'cps-pendiente'"],
  ['Círculo – miembros', "customer_tags CONTAINS 'cps-aprobado'"],
];

const existentes = await admin(`{ metafieldDefinitions(first: 50, ownerType: CUSTOMER, namespace: "cps") { nodes { key } } }`);
const yaEstan = new Set(existentes.metafieldDefinitions.nodes.map((n) => n.key));

for (const [key, name, type] of CAMPOS) {
  if (yaEstan.has(key)) { console.log(`= cps.${key}`); continue; }
  const r = await admin(
    `mutation($d: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $d) { createdDefinition { key } userErrors { field message } } }`,
    { d: { namespace: 'cps', key, name, type, ownerType: 'CUSTOMER', pin: true } },
  );
  const err = r.metafieldDefinitionCreate.userErrors;
  console.log(err.length ? `! cps.${key}: ${err.map((e) => e.message).join('; ')}` : `+ cps.${key}`);
}

const segs = await admin(`{ segments(first: 50) { nodes { name } } }`);
const segNombres = new Set(segs.segments.nodes.map((s) => s.name));
for (const [name, query] of SEGMENTOS) {
  if (segNombres.has(name)) { console.log(`= segmento ${name}`); continue; }
  const r = await admin(
    `mutation($n: String!, $q: String!) { segmentCreate(name: $n, query: $q) { segment { id } userErrors { field message } } }`,
    { n: name, q: query },
  );
  const err = r.segmentCreate.userErrors;
  console.log(err.length ? `! segmento ${name}: ${err.map((e) => e.message).join('; ')}` : `+ segmento ${name}`);
}
