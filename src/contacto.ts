// Datos de contacto de Samaco usados en todo el sitio.

/** WhatsApp único de atención (bot de Samaco) para ventas, sucursales, consultas y el Círculo. */
export const WHATSAPP = '5492617231255';
export const WHATSAPP_VISIBLE = '+54 9 261 723-1255';

/** Link a WhatsApp, con mensaje opcional precargado. */
export const waLink = (texto?: string) =>
  `https://wa.me/${WHATSAPP}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
