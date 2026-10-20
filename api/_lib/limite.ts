// Límite simple de pedidos por IP para endpoints públicos (alta del Círculo).
// Vive en la memoria de la función: Vercel reutiliza la instancia entre pedidos, así que frena ráfagas
// de un mismo origen, pero no es global. Para un tope duro, sumar una regla de rate limit en el
// Firewall de Vercel sobre /api/cps/registro.

const ventanas = new Map<string, number[]>();

export function ipDe(request: Request): string {
  return request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? 'desconocida';
}

/** true si la IP superó `max` pedidos en los últimos `ventanaMs`. Registra el pedido actual. */
export function excedido(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const recientes = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  recientes.push(ahora);
  ventanas.set(clave, recientes);
  // Limpieza para que el mapa no crezca sin fin.
  if (ventanas.size > 5000) {
    for (const [k, ts] of ventanas) if (!ts.some((t) => ahora - t < ventanaMs)) ventanas.delete(k);
  }
  return recientes.length > max;
}
