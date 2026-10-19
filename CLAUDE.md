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

## Medios de pago (`src/financiacion/`)

- `data.ts`: promociones reales de Samaco (canal online / sucursal / ambos, planes de cuotas y descuentos, `vigenteHasta`) y la promo destacada de 9 cuotas. Una promo vencida se oculta sola del carrusel de la home y de `/financiacion`.
- `CarruselMediosPago.tsx` (home) y la barra superior del header: cinta en loop continuo (clases `marquee` en `index.css`), pausa con hover/foco y respeta `prefers-reduced-motion`.
- `FinanciacionView.tsx`: listado con condiciones + simulador de cuotas.

## Círculo de Profesionales (`src/profesionales/`)

Club para arquitectos, ingenieros, desarrolladores inmobiliarios, constructores y otros profesionales. Sedes: Samaco Mendoza y Samaco San Juan.

- **El alta replica el formulario oficial de Google Forms** (nombre y apellido, especialidad, WhatsApp, email, zona de trabajo, si compra en Samaco, cómo se enteró). **La matrícula es opcional** (sección "Datos profesionales"). No repetir "Sumate" en los textos.

- Vistas: `profesionales` (landing pública), `pro-ingresar` / `pro-registro` (alta con matrícula), `panel` (privado: credencial, eventos, descuentos, red, perfil).
- Estados de membresía: `pendiente` → Samaco revisa la solicitud → `aprobado`. Los descuentos y eventos exclusivos se habilitan solo aprobado.
- `service.ts` documenta el mapeo previsto a Shopify (customers con tag + metafields, descuentos por segmento, metaobjects para eventos/estudios). Hoy corre `mock.ts` en localStorage, con la cuenta demo `demo@samaco.test` / `demo1234` y un botón "Simular aprobación (demo)".
- Datos de ejemplo en `mock-data.ts` (eventos, estudios, descuentos, asesores en `ui.tsx`): reemplazar por los reales.
- El directorio de profesionales muestra solo a quienes aceptaron aparecer (opt-in).

## Reglas de trabajo

- Los componentes **nunca** importan datos directo (`mock-data.ts`) ni un provider: usan los hooks o `commerce`. Si falta una operación, se agrega al contrato y a ambos providers.
- Cada producto del front tiene que poder mapearse a una variante de Shopify (el checkout necesita el `variantId`).
- Precios en ARS. Mantener el modelo de precio lista / débito-transferencia / cuotas.

## Pendiente de definir

- **Árbol de categorías**: se va a rehacer más adelante con Samaco. Samaco **no vende Herramientas** (la categoría está en el mock y en el menú; sacarla al rehacer el árbol). Mantener: categoría Ofertas y las cucardas de producto (Nuevo / % OFF).
- **Promociones**: las de `src/financiacion/data.ts` vencen el 31/10/26. Pedir las nuevas a Samaco antes de esa fecha; vencidas se ocultan solas.

- Tienda Shopify (dominio `*.myshopify.com`) y token de Storefront API.
- Quién arma la sync Paljet → Shopify y con qué documentación de la API de Paljet.
- Cómo modelar en Shopify los precios débito/transferencia y cuotas, los kits y los datos de la calculadora (metafields).
