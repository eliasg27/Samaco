// Cliente mínimo de la Admin API de Shopify para tareas de configuración de la tienda
// (colecciones, menús, metafields, metaobjetos). Solo se usa desde la compu, nunca en el sitio.
//
// Credenciales en .env.local (no se sube a git):
//   VITE_SHOPIFY_STORE_DOMAIN=xxxx.myshopify.com
//   SHOPIFY_CLIENT_ID=...        (app "Sitio Samaco (Claude)" del Dev Dashboard)
//   SHOPIFY_CLIENT_SECRET=...
//
// El token se obtiene con el "client credentials grant" (dura ~24 h) y nunca se imprime.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API_VERSION = '2026-10';

function leerEnv() {
  const ruta = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local');
  const env = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  for (const k of ['VITE_SHOPIFY_STORE_DOMAIN', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET']) {
    if (!env[k]) throw new Error(`Falta ${k} en .env.local`);
  }
  return env;
}

let token = null;

export async function adminToken() {
  if (token) return token;
  const env = leerEnv();
  const res = await fetch(`https://${env.VITE_SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`No se pudo obtener el token (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  token = body.access_token;
  return token;
}

export async function admin(query, variables = {}) {
  const env = leerEnv();
  const res = await fetch(`https://${env.VITE_SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await adminToken() },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors).slice(0, 500));
  return json.data;
}

// Uso directo: `node scripts/shopify-admin.mjs` → prueba de solo lectura.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const data = await admin(`{
    shop { name myshopifyDomain currencyCode }
    currentAppInstallation { app { title } accessScopes { handle } }
    collections(first: 20) { nodes { handle title } }
    menus(first: 10) { nodes { handle title } }
  }`);
  console.log(JSON.stringify(data, null, 2));
}
