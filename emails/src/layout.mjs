// Diseño base de todos los mails: header azul con logo, cuerpo blanco y pie con contacto.
// Todo con estilos en línea y tablas, que es lo único que respetan Gmail, Outlook y los celulares.

export const SITIO = 'https://samaco-phi.vercel.app'; // Cambiar por el dominio definitivo.
export const LOGO = `${SITIO}/logo-samaco-blanco-mail.png`;
export const LOGO_CPS = `${SITIO}/cps/cps-horizontal-blanco-mail.png`;
export const WHATSAPP = '5492617231255'; // Bot de atención de Samaco (mismo que src/contacto.ts).
export const MAIL_VENTAS = 'ventas@samacoonline.com.ar';

export const color = {
  primario: '#1B4F8C',
  acento: '#E8593C',
  texto: '#1e293b',
  suave: '#64748b',
  borde: '#e2e8f0',
  fondo: '#f1f5f9',
  fondoCaja: '#f8fafc',
};

const fuente = "font-family:Arial,Helvetica,sans-serif;";

// Piezas reutilizables -----------------------------------------------------------

export const titulo = (texto) =>
  `<h1 style="${fuente}margin:0 0 12px;font-size:24px;line-height:1.25;color:${color.texto};font-weight:bold;">${texto}</h1>`;

export const parrafo = (texto) =>
  `<p style="${fuente}margin:0 0 16px;font-size:15px;line-height:1.6;color:${color.texto};">${texto}</p>`;

export const notaSuave = (texto) =>
  `<p style="${fuente}margin:16px 0 0;font-size:13px;line-height:1.5;color:${color.suave};">${texto}</p>`;

export const subtitulo = (texto) =>
  `<h2 style="${fuente}margin:28px 0 12px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${color.suave};font-weight:bold;">${texto}</h2>`;

/** Botón "a prueba de Outlook" (tabla con fondo). */
export const boton = (texto, href, fondo = color.acento) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 8px;">
  <tr><td bgcolor="${fondo}" style="border-radius:8px;">
    <a href="${href}" target="_blank" style="${fuente}display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${texto}</a>
  </td></tr>
</table>`;

/** Caja gris con contenido (datos de retiro, envío, etc.). */
export const caja = (contenido) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
  <tr><td style="${fuente}background:${color.fondoCaja};border:1px solid ${color.borde};border-radius:10px;padding:16px 18px;font-size:14px;line-height:1.6;color:${color.texto};">${contenido}</td></tr>
</table>`;

/** Fila de dos columnas (etiqueta / valor) para totales y datos. */
export const fila = (etiqueta, valor, { fuerte = false } = {}) => `
<tr>
  <td style="${fuente}padding:6px 0;font-size:${fuerte ? 17 : 14}px;color:${fuerte ? color.texto : color.suave};${fuerte ? 'font-weight:bold;' : ''}">${etiqueta}</td>
  <td align="right" style="${fuente}padding:6px 0;font-size:${fuerte ? 17 : 14}px;color:${color.texto};${fuerte ? 'font-weight:bold;' : ''}">${valor}</td>
</tr>`;

export const tablaFilas = (filas) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${filas}</table>`;

/** Pasos del pedido (Recibido → Preparando → Listo/En camino). `actual` es 1-based. */
export const pasos = (etiquetas, actual) => {
  const celdas = etiquetas.map((e, i) => {
    const hecho = i < actual;
    return `<td align="center" width="${Math.floor(100 / etiquetas.length)}%" style="${fuente}padding:0 4px;">
      <div style="height:6px;border-radius:3px;background:${hecho ? color.acento : color.borde};"></div>
      <div style="margin-top:8px;font-size:12px;color:${hecho ? color.texto : color.suave};${i === actual - 1 ? 'font-weight:bold;' : ''}">${e}</div>
    </td>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>${celdas}</tr></table>`;
};

// Layout ------------------------------------------------------------------------

/**
 * @param {object} o
 * @param {string} o.preheader  Texto que se ve en la bandeja al lado del asunto.
 * @param {string} o.cuerpo
 * @param {'tienda'|'cps'|'interno'} [o.marca]
 * @param {string} [o.sitio]    URL base de links (en Liquid se pasa '{{ sitio }}').
 */
export function layout({ preheader, cuerpo, marca = 'tienda', sitio = SITIO }) {
  const logo = marca === 'cps' ? LOGO_CPS : LOGO;
  const altoLogo = marca === 'cps' ? 44 : 36;
  const etiqueta = marca === 'interno'
    ? `<td align="right" style="${fuente}font-size:11px;letter-spacing:1px;color:#ffffff;opacity:.8;text-transform:uppercase;">Aviso interno</td>`
    : '';

  const pie = marca === 'interno'
    ? `<p style="${fuente}margin:0;font-size:12px;color:${color.suave};">Aviso automático del sitio de Samaco. No respondas este mail.</p>`
    : `
      <p style="${fuente}margin:0 0 10px;font-size:14px;color:${color.texto};font-weight:bold;">¿Dudas con tu ${marca === 'cps' ? 'membresía' : 'pedido'}?</p>
      <p style="${fuente}margin:0 0 16px;font-size:14px;line-height:1.7;color:${color.suave};">
        <a href="https://wa.me/${WHATSAPP}" style="color:${color.primario};font-weight:bold;text-decoration:none;">WhatsApp</a>
        &nbsp;·&nbsp; <a href="mailto:${MAIL_VENTAS}" style="color:${color.primario};text-decoration:none;">${MAIL_VENTAS}</a>
        &nbsp;·&nbsp; <a href="${sitio}/sucursales" style="color:${color.primario};text-decoration:none;">Sucursales</a>
      </p>
      <p style="${fuente}margin:0;font-size:12px;line-height:1.6;color:${color.suave};">
        Samaco · Materiales para la construcción · Mendoza y San Juan<br>
        <a href="${sitio}" style="color:${color.suave};">samaco-phi.vercel.app</a>
      </p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>Samaco</title>
</head>
<body style="margin:0;padding:0;background:${color.fondo};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${color.fondo}">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
      <tr><td bgcolor="${color.primario}" style="padding:22px 28px;border-radius:14px 14px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td><a href="${sitio}" target="_blank"><img src="${logo}" alt="Samaco" height="${altoLogo}" style="display:block;height:${altoLogo}px;width:auto;border:0;"></a></td>
          ${etiqueta}
        </tr></table>
      </td></tr>
      <tr><td bgcolor="#ffffff" style="padding:32px 28px 28px;">
${cuerpo}
      </td></tr>
      <tr><td bgcolor="#ffffff" style="padding:20px 28px 28px;border-top:1px solid ${color.borde};border-radius:0 0 14px 14px;">
${pie}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;
}
