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

En el admin de Shopify, entrá a **Configuración → Notificaciones → Notificaciones para clientes**. Por cada plantilla:

1. Abrila y tocá **Editar código**.
2. Reemplazá todo el cuerpo con el contenido del `.liquid` correspondiente.
3. Pegá el asunto que figura en `asuntos.json`.
4. Revisala con **Vista previa** y mandate un **Enviar correo de prueba**.

| Archivo | Plantilla en Shopify |
|---|---|
| `confirmacion-de-pedido.liquid` | Confirmación del pedido |
| `listo-para-retirar.liquid` | Listo para retiro en tienda (retiro local) |
| `confirmacion-de-envio.liquid` | Confirmación de envío |
| `pedido-en-reparto.liquid` | Pedido en reparto |
| `pedido-entregado.liquid` | Pedido entregado |
| `pedido-cancelado.liquid` | Pedido cancelado |
| `reembolso.liquid` | Reembolso |
| `checkout-abandonado.liquid` | Pago abandonado |

Lo que cubren:
- **Retiro o envío:** la confirmación cambia según el método. Con retiro muestra la sucursal y pide el número de pedido y el DNI; con envío muestra la dirección. Para retiro hay que tener activado *Retiro local* en cada sucursal (Configuración → Envío y entrega).
- **Pago pendiente:** si el pago queda pendiente (por ejemplo, una transferencia por Mobbex), la confirmación avisa que el pedido se despacha cuando se acredite.
- **Medio de pago:** muestra el de Mobbex, con la tarjeta y los últimos 4 dígitos si los hay.
- **CUIT/DNI:** sale del atributo `cuit` del carrito, cuando lo implementemos.
- **Links:** van a nuestro sitio, no a la tienda de Shopify, que en headless no es pública. Lo único que queda en Shopify es "Ver estado del pedido" y "Terminar mi compra", que es lo correcto.

**Carrito abandonado:** se activa en **Configuración → Pago (Checkout) → Pagos abandonados**. Recomendado:
- enviar a quienes no se suscribieron también;
- mandar el mail **10 horas** después.

Si preferís una secuencia de dos mails (por ejemplo a las 10 h y a las 48 h), se arma en **Marketing → Automatizaciones** con Shopify Email.

**Mails que no tocamos:** cuentas de cliente, tarjetas de regalo y POS siguen con la plantilla de Shopify. Antes de lanzar hay que cargar el logo y el color `#1B4F8C` en **Personalizar plantillas de email**.

## 2. Avisos internos de pedidos

Entrá a **Configuración → Notificaciones → Notificaciones para el personal**:
1. En **Nuevo pedido**, pegá `personal-nuevo-pedido.liquid` y su asunto. El asunto muestra número, total y si es retiro (con la sucursal) o envío.
2. Agregá los destinatarios: ventas y cada sucursal.

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
