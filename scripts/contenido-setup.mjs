// Crea en Shopify los metaobjetos de contenido editable y les carga el contenido actual del sitio.
// Idempotente: si la definición o la entrada ya existen, no las toca (no pisa lo que editó el equipo).
// Uso: node scripts/contenido-setup.mjs
//
// Tipos (Shopify → Contenido → Metaobjetos):
//   samaco_plan    "Plan de cuotas"       (se usa dentro de cada promoción)
//   samaco_promo   "Promoción de pago"    (carrusel de la home y /financiacion)
//   samaco_banner  "Banner de la home"    (slider principal)
//   samaco_sitio   "Textos del sitio"     (una sola entrada: promo destacada, cinta superior, leyenda legal)
// Los textos de las opciones tienen que coincidir con src/contenido/opciones.ts.
import { admin } from './shopify-admin.mjs';

const choices = (lista) => [{ name: 'choices', value: JSON.stringify(lista) }];
const VIGENCIA = ['Se renueva cada mes', 'Termina en una fecha'];
const AYUDA_VIGENCIA = '"Se renueva cada mes": nunca se oculta y muestra el último día del mes en curso. "Termina en una fecha": se oculta sola después de la fecha de fin.';
const AYUDA_TEXTO = 'Podés escribir {vigencia} y el sitio pone la fecha de vigencia (por ejemplo "30 de noviembre de 2026").';
const TARJETAS = 'Una por línea. Con logo: BNA+, Banco Nación, Visa, Mastercard, Naranja X, Naranja X Visa, Cabal, Cencosud, Montemar, American Express, Transferencia bancaria, Tarjeta de débito, Tarjeta de crédito.';

async function definicion(type, name, displayNameKey, fieldDefinitions) {
  const r = await admin(`query($t: String!) { metaobjectDefinitionByType(type: $t) { id } }`, { t: type });
  if (r.metaobjectDefinitionByType) { console.log(`= ${type}`); return r.metaobjectDefinitionByType.id; }
  const c = await admin(
    `mutation($d: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $d) { metaobjectDefinition { id } userErrors { field message } } }`,
    { d: { type, name, displayNameKey, fieldDefinitions } },
  );
  const { metaobjectDefinition, userErrors } = c.metaobjectDefinitionCreate;
  if (userErrors.length) throw new Error(`${type}: ${userErrors.map((e) => `${e.field} ${e.message}`).join('; ')}`);
  console.log(`+ ${type}`);
  return metaobjectDefinition.id;
}

/** Agrega campos nuevos a una definición que ya existía (no toca los existentes). */
async function asegurarCampos(type, campos) {
  const r = await admin(`query($t: String!) { metaobjectDefinitionByType(type: $t) { id fieldDefinitions { key } } }`, { t: type });
  const def = r.metaobjectDefinitionByType;
  const faltan = campos.filter((c) => !def.fieldDefinitions.some((f) => f.key === c.key));
  if (!faltan.length) return;
  const u = await admin(
    `mutation($id: ID!, $d: MetaobjectDefinitionUpdateInput!) { metaobjectDefinitionUpdate(id: $id, definition: $d) { userErrors { field message } } }`,
    { id: def.id, d: { fieldDefinitions: faltan.map((c) => ({ create: c })) } },
  );
  const err = u.metaobjectDefinitionUpdate.userErrors;
  if (err.length) throw new Error(`${type}: ${err.map((e) => e.message).join('; ')}`);
  console.log(`+ ${type}: ${faltan.map((c) => c.key).join(', ')}`);
}

async function entrada(type, handle, campos) {
  const r = await admin(`query($h: MetaobjectHandleInput!) { metaobjectByHandle(handle: $h) { id } }`, { h: { type, handle } });
  if (r.metaobjectByHandle) { console.log(`  = ${type}/${handle}`); return r.metaobjectByHandle.id; }
  const fields = Object.entries(campos)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([key, v]) => ({ key, value: typeof v === 'string' ? v : JSON.stringify(v) }));
  const c = await admin(
    `mutation($m: MetaobjectCreateInput!) { metaobjectCreate(metaobject: $m) { metaobject { id } userErrors { field message } } }`,
    { m: { type, handle, fields } },
  );
  const { metaobject, userErrors } = c.metaobjectCreate;
  if (userErrors.length) throw new Error(`${type}/${handle}: ${userErrors.map((e) => `${e.field} ${e.message}`).join('; ')}`);
  console.log(`  + ${type}/${handle}`);
  return metaobject.id;
}

// ── Definiciones ───────────────────────────────────────────────────────────────
const planId = await definicion('samaco_plan', 'Plan de cuotas', 'etiqueta', [
  { key: 'etiqueta', name: 'Texto', type: 'single_line_text_field', required: true, description: 'Ej: "3 cuotas sin interés", "Transferencia bancaria".' },
  { key: 'tipo', name: 'Tipo', type: 'single_line_text_field', required: true, validations: choices(['Contado (1 pago)', 'Cuotas sin interés', 'Cuotas fijas']) },
  { key: 'cuotas', name: 'Cantidad de cuotas', type: 'number_integer', required: true },
  { key: 'descuento', name: '% de descuento', type: 'number_integer', description: 'Opcional. Sobre el precio de lista.' },
]);

await definicion('samaco_promo', 'Promoción de pago', 'beneficio', [
  { key: 'beneficio', name: 'Titular', type: 'single_line_text_field', required: true, description: 'Lo grande de la tarjeta. Ej: "Hasta 12 cuotas sin interés".' },
  { key: 'nombre', name: 'Medios incluidos', type: 'single_line_text_field', required: true, description: 'Ej: "Visa, Mastercard y Naranja Visa".' },
  { key: 'canal', name: 'Dónde aplica', type: 'single_line_text_field', required: true, validations: choices(['Online y en sucursales', 'Solo online', 'Solo en sucursales']) },
  { key: 'tarjetas', name: 'Tarjetas / bancos (logos)', type: 'list.single_line_text_field', description: TARJETAS },
  { key: 'planes', name: 'Planes', type: 'list.metaobject_reference', validations: [{ name: 'metaobject_definition_id', value: planId }], description: 'Las opciones de pago con sus cuotas y descuentos (se usan en el simulador).' },
  { key: 'notas', name: 'Aclaraciones', type: 'multi_line_text_field', description: 'Letra chica de esta promo.' },
  { key: 'vigencia', name: 'Vigencia', type: 'single_line_text_field', required: true, validations: choices(VIGENCIA), description: AYUDA_VIGENCIA },
  { key: 'inicio', name: 'Mostrar desde', type: 'date', description: 'Opcional. Para dejar cargada la promo del mes que viene: no se ve hasta ese día.' },
  { key: 'fin', name: 'Fecha de fin', type: 'date', description: 'Solo si la vigencia es "Termina en una fecha".' },
  { key: 'color', name: 'Color', type: 'single_line_text_field', validations: choices(['Azul', 'Verde', 'Violeta', 'Naranja', 'Rojo']) },
  { key: 'orden', name: 'Orden', type: 'number_integer', description: 'Menor número = aparece primero.' },
  { key: 'activa', name: 'Mostrar en el sitio', type: 'boolean', description: 'Destildá para ocultarla sin borrarla.' },
]);

await definicion('samaco_banner', 'Banner de la home', 'titulo', [
  { key: 'etiqueta', name: 'Etiqueta', type: 'single_line_text_field', description: 'El cartelito de arriba. Ej: "Todos los días", "15% OFF".' },
  { key: 'titulo', name: 'Título', type: 'multi_line_text_field', required: true, description: 'Usá Enter para cortar la línea.' },
  { key: 'bajada', name: 'Texto', type: 'multi_line_text_field', description: AYUDA_TEXTO },
  { key: 'boton', name: 'Texto del botón', type: 'single_line_text_field' },
  { key: 'destino', name: 'El botón lleva a', type: 'single_line_text_field', validations: choices(['Financiación', 'Sucursales', 'Calculadora', 'Círculo de Profesionales', 'Catálogo', 'Inicio']) },
  { key: 'imagen', name: 'Imagen de fondo', type: 'file_reference', validations: [{ name: 'file_type_options', value: '["Image"]' }], description: 'Horizontal, mínimo 1600 px de ancho. Si no cargás, se usa una de las imágenes por defecto.' },
  { key: 'color_etiqueta', name: 'Color de la etiqueta', type: 'single_line_text_field', validations: choices(['Azul', 'Naranja']) },
  { key: 'vigencia', name: 'Vigencia', type: 'single_line_text_field', required: true, validations: choices(VIGENCIA), description: AYUDA_VIGENCIA },
  { key: 'inicio', name: 'Mostrar desde', type: 'date', description: 'Opcional. Para dejar cargada la promo del mes que viene: no se ve hasta ese día.' },
  { key: 'fin', name: 'Fecha de fin', type: 'date', description: 'Solo si la vigencia es "Termina en una fecha".' },
  { key: 'orden', name: 'Orden', type: 'number_integer' },
  { key: 'activo', name: 'Mostrar en el sitio', type: 'boolean' },
]);

await definicion('samaco_sitio', 'Textos del sitio', 'nombre', [
  { key: 'nombre', name: 'Nombre', type: 'single_line_text_field', required: true },
  { key: 'promo_titulo', name: 'Promo destacada: titular', type: 'single_line_text_field', description: 'Tarjeta oscura del carrusel y cabecera de /financiacion. Ej: "9 cuotas sin interés".' },
  { key: 'promo_bajada', name: 'Promo destacada: texto', type: 'single_line_text_field' },
  { key: 'promo_tarjetas', name: 'Promo destacada: tarjetas (logos)', type: 'list.single_line_text_field', description: TARJETAS },
  { key: 'promo_canal', name: 'Promo destacada: dónde aplica', type: 'single_line_text_field', validations: choices(['Online y en sucursales', 'Solo online', 'Solo en sucursales']) },
  { key: 'promo_vigencia', name: 'Promo destacada: vigencia', type: 'single_line_text_field', validations: choices(VIGENCIA), description: AYUDA_VIGENCIA },
  { key: 'promo_fin', name: 'Promo destacada: fecha de fin', type: 'date' },
  { key: 'promo_activa', name: 'Promo destacada: mostrar', type: 'boolean' },
  { key: 'cinta', name: 'Cinta superior: mensajes', type: 'list.single_line_text_field', description: 'Mensajes que corren arriba de todo (además de las promos, WhatsApp, sucursales y el Círculo). ' + AYUDA_TEXTO },
  { key: 'legal', name: 'Leyenda legal de promociones', type: 'multi_line_text_field', description: AYUDA_TEXTO },
]);

const CAMPO_INICIO = { key: 'inicio', name: 'Mostrar desde', type: 'date', description: 'Opcional. Para dejar cargada la promo del mes que viene: no se ve hasta ese día.' };
await asegurarCampos('samaco_promo', [CAMPO_INICIO]);
await asegurarCampos('samaco_banner', [CAMPO_INICIO]);

// ── Contenido inicial (el mismo que tiene hoy el sitio) ───────────────────────
console.log('Entradas:');
const plan = (handle, etiqueta, tipo, cuotas, descuento) =>
  entrada('samaco_plan', handle, { etiqueta, tipo, cuotas: String(cuotas), descuento: descuento ? String(descuento) : undefined });

const planesTarjeta = async (pref, ultimo) => [
  await plan(`${pref}-3`, '3 cuotas sin interés', 'Cuotas sin interés', 3, 5),
  await plan(`${pref}-6`, '6 cuotas sin interés', 'Cuotas sin interés', 6, 3),
  await plan(`${pref}-9`, '9 cuotas sin interés', 'Cuotas sin interés', 9),
  await plan(`${pref}-12`, ...ultimo),
];

const promos = [
  ['contado-online', {
    beneficio: 'Hasta 15% OFF', nombre: 'Transferencia, débito y crédito en 1 pago', canal: 'Solo online',
    tarjetas: ['Transferencia bancaria', 'Tarjeta de débito', 'Tarjeta de crédito'],
    planes: [
      await plan('contado-transferencia', 'Transferencia bancaria', 'Contado (1 pago)', 1, 15),
      await plan('contado-debito', 'Tarjeta de débito', 'Contado (1 pago)', 1, 10),
      await plan('contado-credito', 'Crédito en 1 cuota', 'Contado (1 pago)', 1, 10),
    ],
    notas: 'Promoción vía página web.', color: 'Verde', orden: 1,
  }],
  ['bna', {
    beneficio: 'Hasta 12 cuotas sin interés', nombre: 'BNA+', canal: 'Online y en sucursales', tarjetas: ['BNA+'],
    planes: await planesTarjeta('bna', ['12 cuotas sin interés', 'Cuotas sin interés', 12]),
    notas: 'Promoción vía sucursales y tienda web, todos los días.', color: 'Azul', orden: 2,
  }],
  ['visa-mastercard', {
    beneficio: 'Hasta 9 cuotas sin interés', nombre: 'Visa, Mastercard y Naranja Visa', canal: 'Online y en sucursales',
    tarjetas: ['Visa', 'Mastercard', 'Naranja X Visa'],
    planes: await planesTarjeta('visa-mastercard', ['12 cuotas fijas', 'Cuotas fijas', 12]),
    notas: 'Incluye Naranja Visa.\nAMEX bancaria: solo 1 cuota.', color: 'Violeta', orden: 3,
  }],
  ['tarjetas-sucursal', {
    beneficio: 'Hasta 9 cuotas sin interés', nombre: 'Naranja X, Cabal, Cencosud, Montemar y American Express', canal: 'Solo en sucursales',
    tarjetas: ['Naranja X', 'Cabal', 'Cencosud', 'Montemar', 'American Express no bancaria'],
    planes: await planesTarjeta('tarjetas-sucursal', ['12 cuotas fijas', 'Cuotas fijas', 12]),
    notas: 'Naranja X: hasta 6 cuotas.', color: 'Naranja', orden: 4,
  }],
];
for (const [handle, p] of promos) {
  await entrada('samaco_promo', handle, { ...p, orden: String(p.orden), vigencia: 'Se renueva cada mes', activa: 'true' });
}

const banners = [
  ['cuotas', { etiqueta: 'Todos los días', titulo: '9 Cuotas\nSin Interés', bajada: 'Con BNA+, Visa, Mastercard y Naranja X Visa, en todas las líneas de productos. Vigente hasta el {vigencia} o hasta agotar stock.', boton: 'Ver financiación', destino: 'Financiación', color_etiqueta: 'Azul', orden: '1' }],
  ['transferencia', { etiqueta: '15% OFF', titulo: 'Pagá con\nTransferencia', bajada: 'Comprando en la web: 15% OFF con transferencia bancaria y 10% OFF con débito o crédito en 1 pago. Vigente hasta el {vigencia}.', boton: 'Ver medios de pago', destino: 'Financiación', color_etiqueta: 'Naranja', orden: '2' }],
  ['stock', { etiqueta: 'Samaco', titulo: 'Stock\nGarantizado', bajada: 'Acopio de materiales sin cargo, congelá el precio hoy y retirá cuando necesitás. Entrega en obra con flota propia.', boton: 'Conocer más', destino: 'Sucursales', color_etiqueta: 'Azul', orden: '3' }],
];
for (const [handle, b] of banners) {
  await entrada('samaco_banner', handle, { ...b, vigencia: 'Se renueva cada mes', activo: 'true' });
}

await entrada('samaco_sitio', 'principal', {
  nombre: 'Textos del sitio',
  promo_titulo: '9 cuotas sin interés',
  promo_bajada: 'Todos los días, en todas las líneas de productos',
  promo_tarjetas: ['BNA+', 'Visa', 'Mastercard', 'Naranja X Visa'],
  promo_canal: 'Online y en sucursales',
  promo_vigencia: 'Se renueva cada mes',
  promo_activa: 'true',
  cinta: ['Envío gratis en compras +$900.000'],
  legal: 'Aplica para todas las líneas de productos y categorías. Sujeto a modificaciones. Válido hasta el {vigencia} o hasta agotar stock.',
});
