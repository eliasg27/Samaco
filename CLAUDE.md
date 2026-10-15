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
| `hooks.ts` | `useCategories`, `useProducts`, `useProductsByIds`, `useProductsBySkus`, `useProductSearch` (con cache en memoria). |

Variables en `.env.example`. `npm run lint` (tsc) tiene que pasar limpio.

## Reglas de trabajo

- Los componentes **nunca** importan datos directo (`mock-data.ts`) ni un provider: usan los hooks o `commerce`. Si falta una operación, se agrega al contrato y a ambos providers.
- Cada producto del front tiene que poder mapearse a una variante de Shopify (el checkout necesita el `variantId`).
- Precios en ARS. Mantener el modelo de precio lista / débito-transferencia / cuotas.

## Pendiente de definir

- Tienda Shopify (dominio `*.myshopify.com`) y token de Storefront API.
- Quién arma la sync Paljet → Shopify y con qué documentación de la API de Paljet.
- Cómo modelar en Shopify los precios débito/transferencia y cuotas, los kits y los datos de la calculadora (metafields).
