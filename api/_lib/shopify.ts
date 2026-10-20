// Acceso a Shopify desde las funciones de Vercel (nunca desde el navegador).
//
// Variables (Vercel → Settings → Environment Variables; en local, .env.local):
//   SHOPIFY_STORE_DOMAIN            xxxx.myshopify.com (si falta, se usa VITE_SHOPIFY_STORE_DOMAIN)
//   SHOPIFY_CLIENT_ID / _SECRET     app "Sitio Samaco (Claude)" del Dev Dashboard (secreto: solo servidor)
//   VITE_SHOPIFY_SHOP_ID            id numérico de la tienda (Customer Account API)

const ADMIN_API = '2026-10';
const CUSTOMER_API = '2026-10';

function env(nombre: string, alternativa?: string): string {
  const v = process.env[nombre] ?? (alternativa ? process.env[alternativa] : undefined);
  if (!v) throw new Error(`Falta la variable ${nombre}`);
  return v;
}

const dominio = () => env('SHOPIFY_STORE_DOMAIN', 'VITE_SHOPIFY_STORE_DOMAIN');

// Token de la Admin API (client credentials grant). Se reutiliza mientras la función siga viva.
let token: { valor: string; vence: number } | null = null;

async function adminToken(): Promise<string> {
  if (token && token.vence > Date.now()) return token.valor;
  const res = await fetch(`https://${dominio()}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env('SHOPIFY_CLIENT_ID'),
      client_secret: env('SHOPIFY_CLIENT_SECRET'),
    }),
  });
  const body = await res.json().catch(() => ({})) as { access_token?: string; expires_in?: number };
  if (!res.ok || !body.access_token) throw new Error(`Token de Admin API rechazado (${res.status})`);
  // Se renueva 5 minutos antes de que venza.
  token = { valor: body.access_token, vence: Date.now() + ((body.expires_in ?? 3600) - 300) * 1000 };
  return token.valor;
}

export async function admin<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${dominio()}/admin/api/${ADMIN_API}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await adminToken() },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json() as { data?: T; errors?: unknown };
  if (!res.ok || json.errors) throw new Error(`Admin API: ${JSON.stringify(json.errors ?? res.status).slice(0, 300)}`);
  return json.data as T;
}

/**
 * Valida el token de Customer Account API que manda el navegador y devuelve el cliente logueado.
 * Shopify es quien emite el token, así que nadie puede hacerse pasar por otro cliente.
 */
export async function clienteLogueado(authorization: string | null): Promise<{ id: string; email: string } | null> {
  const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) return null;
  const res = await fetch(`https://shopify.com/${env('VITE_SHOPIFY_SHOP_ID')}/account/customer/api/${CUSTOMER_API}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: accessToken },
    body: JSON.stringify({ query: '{ customer { id emailAddress { emailAddress } } }' }),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null) as { data?: { customer?: { id: string; emailAddress?: { emailAddress?: string } } } } | null;
  const c = json?.data?.customer;
  return c ? { id: c.id, email: c.emailAddress?.emailAddress ?? '' } : null;
}

export const respuesta = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
