# Mails y notificaciones de Samaco

Todos los mails comparten un mismo diseño: franja azul con el logo, cuerpo blanco y un pie con WhatsApp, ventas y sucursales.

- **Fuente:** `emails/src/`. El diseño base está en `layout.mjs`, los mails de Shopify en `shopify.mjs` y los del Círculo en `cps.mjs`.
- **Generar:** `node emails/build.mjs` escribe `emails/shopify/*.liquid`, `emails/cps/*.html` y `emails/asuntos.json` (el asunto de cada uno).
- **No editar a mano** los archivos generados: cambiá la fuente y volvé a generar.

Datos que hay que cambiar en `src/layout.mjs` cuando estén los reales:
- `SITIO`: dominio definitivo.
- `WHATSAPP`: número real.
- `MAIL_VENTAS`.

Los logos de los mails son PNG (`public/logo-samaco-blanco-mail.png` y `public/cps/cps-horizontal-blanco-mail.png`), porque Outlook no muestra webp. Se sirven desde el sitio, así que tienen que estar publicados.

## 1. Mails de compra (Shopify)

**Estado (19/10/2026): cargados en la tienda** (mu01is-1m), con asunto, y revisados con la vista previa de Shopify. Si cambiás una plantilla, regenerá y volvé a pegarla en **Configuración → Notificaciones → Notificaciones para clientes → (plantilla) → Editar código**. Para volver a la de Shopify: **Vista previa → Revertir a**.

| Archivo | Plantilla en Shopify (id en la URL `email_templates/<id>`) |
|---|---|
| `confirmacion-de-pedido.liquid` | Confirmación de pedido (`order_confirmation`) |
| `confirmacion-de-envio.liquid` | Confirmación de envío (`shipping_confirmation`) |
| `listo-para-retirar.liquid` | Listo para retiro en tienda (`ready_for_pickup`) |
| `pedido-en-reparto.liquid` | En reparto (`shipment_out_for_delivery`) **y** Pedido en reparto local (`local_out_for_delivery`) |
| `pedido-entregado.liquid` | Entregado (`shipment_delivered`) **y** Pedido entregado localmente (`local_delivered`) |
| `pedido-cancelado.liquid` | Pedido cancelado (`order_cancelled`) |
| `reembolso.liquid` | Reembolso del pedido (`refund_notification`) |
| `checkout-abandonado.liquid` | **No cargado** (ver abajo) |

Lo que cubren:
- **Retiro o envío:** la confirmación cambia según el método. Con retiro muestra la sucursal y pide el número de pedido y el DNI; con envío muestra la dirección. Para retiro hay que tener activado *Retiro local* en cada sucursal (Configuración → Envío y entrega).
- **Pago pendiente:** si el pago queda pendiente (por ejemplo, una transferencia por Mobbex), la confirmación avisa que el pedido se despacha cuando se acredite.
- **Medio de pago:** muestra el de Mobbex, con la tarjeta y los últimos 4 dígitos si los hay.
- **CUIT/DNI:** sale del atributo `cuit` del carrito, cuando lo implementemos.
- **Links:** van a nuestro sitio, no a la tienda de Shopify, que en headless no es pública. Lo único que queda en Shopify es "Ver estado del pedido" y "Terminar mi compra", que es lo correcto.

**Carrito abandonado:** Shopify ya no usa la plantilla "Pago abandonado" de Notificaciones: ahora es una **automatización de marketing** (Marketing → Automatizaciones, con el editor de Shopify Email, que no acepta HTML propio). `checkout-abandonado.liquid` queda como referencia de textos. Para activarlo: armar la automatización "Pago abandonado" con el logo, el color y estos textos, enviarla **10 h** después del abandono (y opcionalmente un segundo mail a las 48 h). Revisar en la automatización a quién se envía (solo suscriptores o todos los que dejaron su mail).

**Mails que no tocamos:** cuentas de cliente, tarjetas de regalo y POS siguen con la plantilla de Shopify. Antes de lanzar hay que cargar el logo y el color `#1B4F8C` en **Personalizar plantillas de email**.

## 2. Avisos internos de pedidos

Entrá a **Configuración → Notificaciones → Notificaciones para el personal**:
1. **Nuevo pedido** (`new_order_notification`): `personal-nuevo-pedido.liquid` **ya cargado**. El asunto muestra número, total y si es retiro (con la sucursal) o envío.
2. Destinatarios: hoy solo `ecommercesamaco@gmail.com` (todos los pedidos). Falta agregar ventas y cada sucursal cuando Samaco pase las casillas.

Shopify no filtra este aviso por sucursal, así que les llega a todos. Por eso el asunto dice la sucursal: así cada una filtra en su casilla. Si hace falta que solo le llegue a la sucursal del retiro, se arma con **Shopify Flow** (incluido en Grow): "Pedido creado" → condición por método de entrega → "Enviar email interno".

El aviso marca en rojo cuando falta el CUIT/DNI.

## 3. Remitente (pendiente)

Mientras no esté confirmada la casilla, Shopify manda desde su dirección genérica. Cuando Samaco la confirme (por ejemplo `ventas@samacoonline.com.ar`):

1. Cargala en **Configuración → Notificaciones → Email del remitente**.
2. Shopify muestra los registros DNS (CNAME de DKIM) para **verificar el dominio**. Cargalos en el DNS de `samacoonline.com.ar`. Sin eso los mails salen "en nombre de" Shopify y es más fácil que caigan en spam.

## 4. Círculo de Profesionales

Plantillas en `emails/cps/`. Los datos van como `{{variable}}` (la lista de cada una está en `asuntos.json`).

| Archivo | Cuándo | Para quién |
|---|---|---|
| `cps-solicitud-recibida.html` | Al enviar el formulario de alta | Profesional |
| `interno-cps-nueva-solicitud.html` | Al enviar el formulario de alta | Asesor/a de la sede elegida |
| `cps-membresia-aprobada.html` | Samaco aprueba la solicitud | Profesional |
| `cps-solicitud-no-aprobada.html` | Samaco rechaza la solicitud | Profesional |
| `cps-inscripcion-evento.html` | Se inscribe a un evento | Profesional |

**Todavía no se envían.** El Círculo corre en modo demo (`src/profesionales/mock.ts`, guarda en el navegador). Para mandarlos hace falta que las altas se guarden en serio y un servicio de envío. Opciones:

- **Shopify + Flow:** el alta crea un cliente con tag `cps-pendiente`. Flow avisa al asesor (email interno).
  - Contra: Flow no manda mails a clientes sin consentimiento de marketing, así que los mails al profesional quedan limitados.
- **Función en Vercel + Resend (recomendado):** un endpoint `/api/cps/...` recibe el alta y manda los mails con estas plantillas.
  - Cada mail sale en el momento, con el remitente de Samaco.
  - Resend es gratis hasta 3.000 mails por mes.
  - Necesita verificar el dominio, igual que en Shopify.
