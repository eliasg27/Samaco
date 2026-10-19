// Notificaciones de Shopify (Configuración → Notificaciones). Se generan como Liquid listo para pegar
// en "Editar código" de cada plantilla. Variables: https://help.shopify.com/es/manual/fulfillment/setup/notifications/email-variables
//
// Los links van a nuestro sitio (no a la tienda Shopify, que en headless no es pública): por eso cada
// plantilla arranca con {% assign sitio = '…' %}. order_status_url y el link del carrito abandonado sí son
// de Shopify y está bien: son la página de estado del pedido y el checkout.

import {
  SITIO, color, titulo, parrafo, notaSuave, subtitulo, boton, caja, fila, tablaFilas, pasos, layout,
} from './layout.mjs';

const f = 'font-family:Arial,Helvetica,sans-serif;';
const encabezado = `{%- assign sitio = '${SITIO}' -%}\n`;

// Bloques Liquid compartidos ---------------------------------------------------------

/** Lista de productos. `lista` es la colección Liquid; `item` cómo llegar al line item. */
const productos = (lista = 'line_items', item = 'line') => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
{%- for line in ${lista} %}
  <tr>
    <td width="64" style="padding:10px 12px 10px 0;border-bottom:1px solid ${color.borde};vertical-align:top;">
      <img src="{{ ${item} | img_url: 'compact_cropped' }}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:8px;border:1px solid ${color.borde};object-fit:cover;">
    </td>
    <td style="${f}padding:10px 0;border-bottom:1px solid ${color.borde};font-size:14px;line-height:1.4;color:${color.texto};vertical-align:top;">
      <strong>{{ ${item}.product.title | default: ${item}.title }}</strong>
      {%- if ${item}.variant.title != blank and ${item}.variant.title != 'Default Title' %}<br><span style="color:${color.suave};">{{ ${item}.variant.title }}</span>{% endif %}
      {%- if ${item}.sku != blank %}<br><span style="font-size:12px;color:${color.suave};">Cód. {{ ${item}.sku }}</span>{% endif %}
      <br><span style="color:${color.suave};">Cantidad: {{ line.quantity }}</span>
    </td>
    <td align="right" style="${f}padding:10px 0 10px 12px;border-bottom:1px solid ${color.borde};font-size:14px;color:${color.texto};vertical-align:top;white-space:nowrap;">
      {%- if line.final_line_price -%}{{ line.final_line_price | money }}{%- endif -%}
    </td>
  </tr>
{%- endfor %}
</table>`;

const totales = `
${tablaFilas(`
  ${fila('Subtotal', '{{ subtotal_price | money }}')}
  {%- if total_discounts > 0 %}${fila('Descuentos', '−{{ total_discounts | money }}')}{% endif %}
  {%- if requires_shipping and delivery_method != 'pick-up' %}${fila('Envío', "{% if shipping_price > 0 %}{{ shipping_price | money }}{% else %}Sin cargo{% endif %}")}{% endif %}
  ${fila('Total', '{{ total_price | money }}', { fuerte: true })}
`)}`;

/** Medio de pago (Mobbex u otro) según las transacciones del pedido. */
const medioDePago = `
{%- assign pagos_ok = transactions | where: 'status', 'success' -%}
{%- if pagos_ok.size == 0 %}{% assign pagos_ok = transactions %}{% endif -%}
{%- for t in pagos_ok limit: 1 %}
<p style="${f}margin:12px 0 0;font-size:13px;color:${color.suave};">{%- assign medio = t.gateway_display_name | default: t.gateway -%}
Pagado con {{ medio }}{% if t.payment_details.credit_card_company and t.payment_details.credit_card_company != medio %} · {{ t.payment_details.credit_card_company }}{% endif %}{% if t.payment_details.credit_card_last_four_digits %} terminada en {{ t.payment_details.credit_card_last_four_digits }}{% endif %}</p>
{%- endfor %}`;

const entrega = `
{%- if delivery_method == 'pick-up' %}
${subtitulo('Retiro en sucursal')}
${caja(`<strong>{{ shipping_method.title }}</strong><br>Te avisamos por mail cuando esté listo para retirar. Traé el número de pedido <strong>{{ order_name }}</strong> y tu DNI.`)}
{%- elsif requires_shipping and shipping_address %}
${subtitulo('Envío a domicilio')}
${caja(`<strong>{{ shipping_method.title }}</strong><br>{{ shipping_address | format_address }}`)}
{%- endif %}`;

// Plantillas ------------------------------------------------------------------------

export const plantillasShopify = [
  {
    archivo: 'confirmacion-de-pedido.liquid',
    shopify: 'Confirmación del pedido',
    asunto: 'Recibimos tu pedido {{ name }}',
    preheader: 'Gracias por tu compra en Samaco. Acá tenés el detalle.',
    cuerpo: `
${titulo('¡Gracias por tu compra{% if customer.first_name %}, {{ customer.first_name }}{% endif %}!')}
${parrafo('Recibimos tu pedido <strong>{{ order_name }}</strong> y ya lo estamos preparando.{% if financial_status == "pending" %} Lo despachamos apenas se acredite el pago.{% endif %}')}
${pasos(['Recibido', 'Preparando', '{% if delivery_method == "pick-up" %}Listo para retirar{% else %}En camino{% endif %}'], 1)}
${boton('Ver estado del pedido', '{{ order_status_url }}')}
${entrega}
${subtitulo('Tu pedido')}
${productos()}
${totales}
${medioDePago}
{%- if attributes.cuit %}<p style="${f}margin:8px 0 0;font-size:13px;color:${color.suave};">CUIT/DNI para la factura: {{ attributes.cuit }}</p>{% endif %}
${notaSuave('La factura te llega por separado. Si necesitás cambiar algo del pedido, escribinos cuanto antes por WhatsApp.')}`,
  },
  {
    archivo: 'listo-para-retirar.liquid',
    shopify: 'Listo para retiro en tienda (ready_for_pickup)',
    asunto: 'Tu pedido {{ name }} está listo para retirar',
    preheader: 'Ya podés pasar a buscarlo por la sucursal.',
    cuerpo: `
${titulo('¡Tu pedido está listo!')}
${parrafo('{% if customer.first_name %}{{ customer.first_name }}, ya{% else %}Ya{% endif %} podés pasar a retirar el pedido <strong>{{ order_name }}</strong>.')}
${pasos(['Recibido', 'Preparado', 'Listo para retirar'], 3)}
${subtitulo('Dónde retirarlo')}
${caja(`<strong>{% if location.name %}{{ location.name }}{% else %}{{ shipping_method.title }}{% endif %}</strong>
{%- if location.address1 %}<br>{{ location.address1 }}{% if location.city %}, {{ location.city }}{% endif %}{% endif %}
{%- if pickup_instructions != blank %}<br><br>{{ pickup_instructions }}{% endif %}
<br><br>Presentá el número de pedido <strong>{{ order_name }}</strong> y el DNI de quien hizo la compra. Si retira otra persona, avisanos por WhatsApp.`)}
${boton('Ver horarios y cómo llegar', '{{ sitio }}/sucursales', color.primario)}
${subtitulo('Qué vas a retirar')}
${productos()}
${notaSuave('Si el pedido es voluminoso, vení con un vehículo adecuado. Tenemos personal para ayudarte a cargar.')}`,
  },
  {
    archivo: 'confirmacion-de-envio.liquid',
    shopify: 'Confirmación de envío',
    asunto: 'Tu pedido {{ name }} está en camino',
    preheader: 'Despachamos tu pedido. Seguí el envío desde acá.',
    cuerpo: `
${titulo('Tu pedido está en camino')}
${parrafo('{% if customer.first_name %}{{ customer.first_name }}, despachamos{% else %}Despachamos{% endif %} {% if fulfillment.item_count < item_count %}parte de {% endif %}tu pedido <strong>{{ order_name }}</strong>.')}
${pasos(['Recibido', 'Preparado', 'En camino'], 3)}
{%- if fulfillment.tracking_numbers.size > 0 %}
${caja(`Transporte: <strong>{{ fulfillment.tracking_company | default: 'Samaco' }}</strong><br>Seguimiento: <strong>{{ fulfillment.tracking_numbers | join: ', ' }}</strong>`)}
{%- if fulfillment.tracking_urls.size > 0 %}${boton('Seguir mi envío', '{{ fulfillment.tracking_urls.first }}')}{% endif %}
{%- else %}
${boton('Ver estado del pedido', '{{ order_status_url }}')}
{%- endif %}
${subtitulo('Enviamos a')}
${caja('{{ shipping_address | format_address }}')}
${subtitulo('En este envío')}
${productos('fulfillment.fulfillment_line_items', 'line.line_item')}
${notaSuave('Para materiales pesados, alguien tiene que estar en el domicilio para recibir y la descarga se hace a pie de camión.')}`,
  },
  {
    archivo: 'pedido-en-reparto.liquid',
    shopify: 'En reparto + Pedido en reparto local (shipment_out_for_delivery, local_out_for_delivery)',
    asunto: 'Hoy llega tu pedido {{ name }}',
    preheader: 'Tu pedido salió a reparto.',
    cuerpo: `
${titulo('Hoy llega tu pedido')}
${parrafo('El pedido <strong>{{ order_name }}</strong> salió a reparto. Asegurate de que haya alguien en el domicilio para recibirlo.')}
${caja('{{ shipping_address | format_address }}')}
{%- if fulfillment.tracking_urls.size > 0 %}${boton('Seguir mi envío', '{{ fulfillment.tracking_urls.first }}')}{% else %}${boton('Ver estado del pedido', '{{ order_status_url }}')}{% endif %}`,
  },
  {
    archivo: 'pedido-entregado.liquid',
    shopify: 'Entregado + Pedido entregado localmente (shipment_delivered, local_delivered)',
    asunto: 'Entregamos tu pedido {{ name }}',
    preheader: 'Tu pedido fue entregado. ¡Gracias por elegir Samaco!',
    cuerpo: `
${titulo('¡Pedido entregado!')}
${parrafo('El pedido <strong>{{ order_name }}</strong> fue entregado. Gracias por elegir Samaco para tu obra.')}
${parrafo('Si falta algo o algún material llegó dañado, escribinos dentro de las 48 h con fotos y el número de pedido.')}
${boton('Seguir comprando', '{{ sitio }}', color.primario)}`,
  },
  {
    archivo: 'pedido-cancelado.liquid',
    shopify: 'Pedido cancelado',
    asunto: 'Cancelamos tu pedido {{ name }}',
    preheader: 'Tu pedido fue cancelado.',
    cuerpo: `
${titulo('Tu pedido fue cancelado')}
${parrafo(`{%- case cancel_reason -%}
{%- when 'customer' -%}Cancelamos el pedido <strong>{{ order_name }}</strong> como nos pediste.
{%- when 'inventory' -%}Tuvimos que cancelar el pedido <strong>{{ order_name }}</strong> porque nos quedamos sin stock de uno o más productos. Te pedimos disculpas.
{%- when 'declined' -%}Cancelamos el pedido <strong>{{ order_name }}</strong> porque el pago fue rechazado.
{%- else -%}Cancelamos el pedido <strong>{{ order_name }}</strong>.
{%- endcase -%}`)}
{%- if financial_status == 'refunded' or financial_status == 'partially_refunded' or financial_status == 'voided' %}
${caja('Si ya habías pagado, el reintegro se acredita en el mismo medio de pago. Según el banco o la tarjeta puede tardar entre 5 y 10 días hábiles en verse.')}
{%- endif %}
${subtitulo('Pedido cancelado')}
${productos()}
${boton('Volver a la tienda', '{{ sitio }}', color.primario)}`,
  },
  {
    archivo: 'reembolso.liquid',
    shopify: 'Reembolso del pedido (refund_notification)',
    asunto: 'Te reintegramos dinero del pedido {{ name }}',
    preheader: 'Procesamos un reintegro de tu pedido.',
    cuerpo: `
${titulo('Procesamos tu reintegro')}
${parrafo('Te devolvimos <strong>{{ amount | money }}</strong> del pedido <strong>{{ order_name }}</strong>.')}
${caja('El dinero vuelve al mismo medio de pago que usaste. Según el banco o la tarjeta puede tardar entre 5 y 10 días hábiles en verse en tu resumen o cuenta.')}
${boton('Ver estado del pedido', '{{ order_status_url }}', color.primario)}`,
  },
  {
    archivo: 'checkout-abandonado.liquid',
    shopify: 'Pago abandonado (checkout abandonado)',
    asunto: '¿Te quedó algo pendiente? Tu carrito te espera',
    preheader: 'Guardamos los productos de tu carrito.',
    cuerpo: `
${titulo('Dejaste materiales en el carrito')}
${parrafo('{% if billing_address.first_name %}{{ billing_address.first_name }}, guardamos{% else %}Guardamos{% endif %} tu carrito para que termines la compra cuando quieras. Los precios y el stock pueden cambiar, así que te recomendamos no dejarlo para muy tarde.')}
${boton('Terminar mi compra', '{{ url }}')}
${subtitulo('Tu carrito')}
${productos()}
${tablaFilas(fila('Subtotal', '{{ subtotal_price | money }}', { fuerte: true }))}
${caja('<strong>¿Te quedó alguna duda?</strong> Cantidades, medidas, envío o cuotas: escribinos por WhatsApp y un asesor te ayuda a cerrar el pedido.')}`,
  },
];

// Aviso interno (Notificaciones para el personal → Nuevo pedido) ---------------------

export const plantillasPersonal = [
  {
    archivo: 'personal-nuevo-pedido.liquid',
    shopify: 'Nuevo pedido (notificaciones para el personal)',
    asunto: "[Pedido web] {{ name }} · {{ total_price | money }} · {% if delivery_method == 'pick-up' %}Retiro {{ shipping_method.title }}{% else %}Envío{% endif %}",
    preheader: 'Entró un pedido nuevo en el sitio.',
    marca: 'interno',
    cuerpo: `
${titulo('Nuevo pedido {{ order_name }}')}
${parrafo('{{ created_at | date: "%d/%m/%Y %H:%M" }} · Pago: <strong>{% case financial_status %}{% when "paid" %}acreditado{% when "pending" %}pendiente{% when "authorized" %}autorizado{% when "partially_paid" %}pago parcial{% when "refunded" %}reembolsado{% when "voided" %}anulado{% else %}{{ financial_status }}{% endcase %}</strong>')}
${subtitulo('Cliente')}
${caja(`<strong>{{ billing_address.name | default: customer.name }}</strong><br>
{{ email }}{% if billing_address.phone or shipping_address.phone %} · {{ billing_address.phone | default: shipping_address.phone }}{% endif %}
{%- if attributes.cuit %}<br>CUIT/DNI: <strong>{{ attributes.cuit }}</strong>{% else %}<br><span style="color:${color.acento};">Sin CUIT/DNI cargado</span>{% endif %}`)}
${subtitulo('Entrega')}
${caja(`{% if delivery_method == 'pick-up' %}<strong>Retiro en sucursal:</strong> {{ shipping_method.title }}{% elsif requires_shipping %}<strong>{{ shipping_method.title }}</strong><br>{{ shipping_address | format_address }}{% else %}Sin envío{% endif %}
{%- if note != blank %}<br><br><strong>Nota del cliente:</strong> {{ note }}{% endif %}`)}
${subtitulo('Productos')}
${productos()}
${totales}
${medioDePago}
${boton('Abrir en Shopify', 'https://{{ shop.permanent_domain }}/admin/orders/{{ id }}', color.primario)}`,
  },
];

export const generarShopify = (p) => encabezado + layout({
  preheader: p.preheader,
  cuerpo: p.cuerpo,
  marca: p.marca ?? 'tienda',
  sitio: '{{ sitio }}',
});
