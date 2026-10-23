# Samaco — Front e-commerce

Front de la tienda online de Samaco (materiales de construcción, Mendoza). React 19 + Vite + Tailwind 4 + Motion.

## Arquitectura objetivo

**Shopify headless.** Decidido el 2026-10-14.

```
Paljet (ERP)  ──sync (API)──▶  Shopify (productos, precios, stock)
                                    │ Storefront API
                                    ▼
                         este front (React, Vercel)
                                    │ Cart API → cart.checkoutUrl
                                    ▼
                         Shopify Checkout (pasarela de pago)
```

- El front **lee solo de Shopify** (Storefront API). No habla con Paljet directo: una integración aparte sincroniza Paljet → Shopify.
- El carrito se arma con la Cart API de Shopify y "Ir a pagar" redirige a `cart.checkoutUrl`.

- **El checkout y la pasarela de pago son de Shopify y NO se modifican.** No construir checkout, cobros ni integraciones de pago propias. El carrito termina redirigiendo al checkout de Shopify.
- **Todo lo previo al checkout es nuestro:** home, catálogo, búsqueda, ficha de producto, carrito, calculadora de materiales, kits, comparador, sucursales, WhatsApp.
- **Los datos vienen de Paljet** (ERP de Samaco) a través de una API. Paljet es la fuente de verdad de productos, precios y stock.

## Capa de datos (`src/services/`)

| Archivo | Qué es |
|---|---|
| `commerce.ts` | Contrato `CommerceService` (categorías, productos, búsqueda, `createCheckout`). |
| `index.ts` | Exporta `commerce`: Shopify si hay `VITE_SHOPIFY_STORE_DOMAIN` + `VITE_SHOPIFY_STOREFRONT_TOKEN`, si no mock. |
| `mock.ts` + `mock-data.ts` | Datos locales de desarrollo. |
| `shopify.ts` | Storefront API. Las convenciones de datos (metafields `samaco.*`, tags, menú) están documentadas arriba del archivo. |

**Categorías en Shopify:** colecciones enlazadas en el menú **"Categorías sitio"** (handle `categorias-sitio`; si no existe se usa `main-menu`). Elementos anidados del menú = subcategorías (desplegable del header, `/categorias/:handle`). El tipo de producto de cada producto debe coincidir con su categoría (lo carga la sync de Paljet).
| `hooks.ts` | `useCategories`, `useProducts`, `useProductsByIds`, `useProductsBySkus`, `useProductSearch` (con cache en memoria). |

Variables en `.env.example`. `npm run lint` (tsc) tiene que pasar limpio.

## URLs (`src/routes.ts`)

React Router (`BrowserRouter`) + `vercel.json` con rewrite a `index.html`. Todas las URLs y el parseo están en `routes.ts`; para navegar usar `paths.*` o `navigateTo(view, …)`, nunca strings sueltos.

| Página | URL |
|---|---|
| Home | `/` |
| Catálogo / categoría | `/categorias` · `/categorias/:handle` (filtros en query: `?orden=menor-precio&marca=a,b&min=&max=`) |
| Producto | `/productos/:handle` |
| Búsqueda | `/buscar?q=` |
| Calculadora · Sucursales | `/calculadora` · `/sucursales` |
| Financiación | `/financiacion` (con `#id` del medio de pago, p. ej. `#visa-mastercard`) |
| Círculo de Profesionales | `/CPS` · `/CPS/ingresar` · `/CPS/registro` · `/CPS/panel[/eventos|descuentos|red|perfil]` · `/CPS/eventos/:id` |

- Los handles son los de Shopify (en el mock se derivan del nombre con `lib/slug.ts`).
- `/cps` en cualquier combinación de mayúsculas redirige a `/CPS`.
- Cada vista dentro de `<AnimatePresence>` tiene que tener como raíz un `motion.div`, incluso en estados de carga o vacíos; si no, la transición queda colgada.

## Contenido editable (`src/contenido/`, `api/contenido.ts`)

Promociones de pago, banners de la home, cinta superior, promo destacada y leyenda legal **se editan en Shopify → Contenido → Metaobjetos** (`samaco_promo`, `samaco_plan`, `samaco_banner`, `samaco_sitio`; estructura y carga inicial con `scripts/contenido-setup.mjs`, idempotente). `GET /api/contenido` los lee con la Admin API (cache CDN 5 min) y `ContenidoProvider`/`useContenido()` los reparte; si Shopify falla o una lista viene vacía, se usa el respaldo del código (`financiacion/data.ts`, `BANNERS`). Guía para el equipo: `docs/editar-contenido.md`.

- **Vigencia:** `'mensual'` (default) = se renueva sola, nunca se oculta y la leyenda muestra el fin del mes en curso; una fecha `YYYY-MM-DD` = promo especial que se oculta después de ese día. `{vigencia}` en los textos se reemplaza por la fecha.
- Opciones de los selectores (canal, tipo de plan, color, destino del botón) en `src/contenido/opciones.ts`: tienen que coincidir con las del script.

## Medios de pago (`src/financiacion/`)

- `data.ts`: tipos, helpers de vigencia y el **respaldo** de las promos (las reales viven en Shopify, ver arriba).
- `CarruselMediosPago.tsx` (home) y la barra superior del header: cinta en loop continuo (clases `marquee` en `index.css`), pausa con hover/foco y respeta `prefers-reduced-motion`.
- `FinanciacionView.tsx`: listado con condiciones + simulador de cuotas.

## Círculo de Profesionales (`src/profesionales/`)

Club para arquitectos, ingenieros, desarrolladores inmobiliarios, constructores y otros profesionales. Sedes: Samaco Mendoza y Samaco San Juan.

- **El alta replica el formulario oficial de Google Forms** (nombre y apellido, especialidad, WhatsApp, email, zona de trabajo, si compra en Samaco, cómo se enteró). **La matrícula es opcional** (sección "Datos profesionales"). No repetir "Sumate" en los textos.

- Vistas: `profesionales` (landing pública), `pro-ingresar` / `pro-registro` (alta con matrícula), `panel` (privado: credencial, eventos, descuentos, red, perfil).
- Estados de membresía: `pendiente` → Samaco revisa la solicitud → `aprobado`. Los descuentos y eventos exclusivos se habilitan solo aprobado.
- **Registro e ingreso reales con Shopify** (`shopify.ts`, elegido en `index.ts` si están `VITE_SHOPIFY_SHOP_ID` y `VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID`; si no, demo `mock.ts` con la cuenta `demo@samaco.test`):
  - Alta → `POST /api/cps/registro` (función de Vercel, Admin API) crea el **cliente de Shopify** con tags `cps` + `cps-pendiente` y metafields `cps.*` (textos legibles; mapeo en `api/_lib/cps.ts`).
  - Samaco revisa en el admin → Clientes → segmentos **"Círculo – pendientes" / "Círculo – miembros"** y aprueba cambiando el tag a `cps-aprobado` (o `cps-rechazado`).
  - Ingreso **sin contraseña**: login de Shopify con código por email (Customer Account API, OAuth PKCE). Callback `/CPS/acceso` (registrado en Headless → Customer Account API). `GET/PATCH /api/cps/perfil` valida el token contra Shopify.
  - **Descuentos para miembros:** en Shopify, descuento automático con elegibilidad = segmento **"Círculo – miembros"** (tag `cps-aprobado`). Cualquier otro tag no matchea a nadie.
  - El directorio (`/api/cps/directorio`) solo responde a miembros con `cps-aprobado`. El alta tiene campo trampa anti-bots y límite de pedidos por IP.
  - Eventos, descuentos, beneficios y estudios siguen siendo datos de ejemplo.
  - `scripts/cps-setup.mjs` crea las definiciones de metafields y los segmentos (idempotente). En local, `npm run dev` sirve `api/` con un plugin de Vite.
- Datos de ejemplo en `mock-data.ts` (eventos, estudios, descuentos, asesores en `ui.tsx`): reemplazar por los reales.
- El directorio de profesionales muestra solo a quienes aceptaron aparecer (opt-in).

## Mails y notificaciones (`emails/`)

Plantillas de Shopify (compra, retiro, envío, cancelación, reembolso, carrito abandonado, aviso interno de pedido) y del Círculo de Profesionales, con un diseño común. Fuente en `emails/src/`, se generan con `node emails/build.mjs`; cómo cargarlas en Shopify en `emails/README.md`. Los del Círculo todavía no se envían (las altas ya llegan a Shopify; falta el remitente con dominio de Samaco para mandarlos).

## Reglas de trabajo

- Los componentes **nunca** importan datos directo (`mock-data.ts`) ni un provider: usan los hooks o `commerce`. Si falta una operación, se agrega al contrato y a ambos providers.
- Cada producto del front tiene que poder mapearse a una variante de Shopify (el checkout necesita el `variantId`).
- Precios en ARS. Mantener el modelo de precio lista / débito-transferencia / cuotas.

## Definiciones de negocio (20/10/2026)

- **Productos: vienen de PalJet** vía el Samaco Connector (otro equipo; doc en Drive "9. Ecommerce", documentos 01-04). El connector crea el producto (título base, SKU = código de artículo, precio, stock, marca = vendor, rubro = tipo de producto) y después solo actualiza precio y stock. Tiene que publicarlo en el canal **Headless**, si no la Storefront API no lo ve.
- **Fotos y descripciones: las carga Pinta en Shopify.** El connector nunca las pisa. Carga masiva posible por Admin API con `scripts/shopify-admin.mjs` (app "Sitio Samaco (Claude)", credenciales en `.env.local`).
- **Categorías:** colecciones automáticas por tipo de producto (rubro de PalJet), enlazadas en el menú "Categorías sitio".
- **Pagos: todo por Mobbex** (app de Shopify; recomendada "Mobbex Transparent"). Cuotas, promos y descuentos se configuran en la consola de Mobbex: lo que muestra `src/financiacion/data.ts` tiene que coincidir.
- **CUIT/DNI:** el connector lo lee del pedido como note attribute `cuit` → en headless se manda como atributo del carrito (`cartCreate` attributes). Pendiente de confirmar en la reunión con Samaco antes de implementarlo.

## Pendiente de definir

- **Árbol de categorías**: se va a rehacer más adelante con Samaco. Samaco **no vende Herramientas** (la categoría está en el mock y en el menú; sacarla al rehacer el árbol). Mantener: categoría Ofertas y las cucardas de producto (Nuevo / % OFF).
- **Promociones**: se renuevan cada mes; cuando Samaco cambie condiciones, editarlas en Shopify (metaobjeto "Promoción de pago").

- Tienda Shopify (dominio `*.myshopify.com`) y token de Storefront API.
- Quién arma la sync Paljet → Shopify y con qué documentación de la API de Paljet.
- Cómo modelar en Shopify los precios débito/transferencia y cuotas, los kits y los datos de la calculadora (metafields).
