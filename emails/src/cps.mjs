// Mails del Círculo de Profesionales. Hoy el Círculo corre en modo demo (src/profesionales/mock.ts) y no
// envía nada: estas plantillas quedan listas para cuando se conecte el envío (ver emails/README.md).
// Los datos van como {{variable}} y los reemplaza quien envía el mail.

import { titulo, parrafo, notaSuave, subtitulo, boton, caja, fila, tablaFilas, color, layout } from './layout.mjs';

export const plantillasCps = [
  {
    archivo: 'cps-solicitud-recibida.html',
    para: 'Profesional, al enviar el formulario de alta',
    asunto: 'Recibimos tu solicitud al Círculo de Profesionales',
    preheader: 'Samaco va a revisar tus datos y te avisamos por mail.',
    variables: ['nombre', 'sede', 'sitio'],
    cuerpo: `
${titulo('¡Hola {{nombre}}! Recibimos tu solicitud')}
${parrafo('Gracias por querer formar parte del <strong>Círculo de Profesionales Samaco</strong>. El equipo de {{sede}} va a revisar tus datos y te avisamos por este medio cuando tu membresía esté aprobada.')}
${caja('Mientras tanto ya podés entrar a tu panel con tu email y contraseña. Los descuentos y los eventos exclusivos se habilitan cuando se aprueba la membresía.')}
${boton('Entrar a mi panel', '{{sitio}}/CPS/panel')}
${notaSuave('Si no fuiste vos quien completó el formulario, ignorá este mail.')}`,
  },
  {
    archivo: 'cps-membresia-aprobada.html',
    para: 'Profesional, cuando Samaco aprueba la solicitud',
    asunto: '¡Bienvenido/a al Círculo de Profesionales Samaco!',
    preheader: 'Tu membresía está activa: ya tenés tus descuentos y eventos.',
    variables: ['nombre', 'numeroSocio', 'sede', 'asesorNombre', 'asesorWhatsapp', 'sitio'],
    cuerpo: `
${titulo('¡Tu membresía está activa, {{nombre}}!')}
${parrafo('Ya sos parte del <strong>Círculo de Profesionales Samaco</strong>. Desde tu panel tenés tu credencial, los descuentos para tus obras y los eventos exclusivos.')}
${caja(tablaFilas(`${fila('N.º de socio', '<strong>{{numeroSocio}}</strong>')}${fila('Sede', '{{sede}}')}`))}
${boton('Ver mis beneficios', '{{sitio}}/CPS/panel')}
${subtitulo('Tu asesor')}
${parrafo('{{asesorNombre}} te acompaña con cotizaciones de obra, pedidos grandes y entregas. <a href="https://wa.me/{{asesorWhatsapp}}" style="color:' + color.primario + ';font-weight:bold;">Escribile por WhatsApp</a>.')}
${notaSuave('Para usar el descuento en sucursal, mostrá la credencial digital de tu panel o decí tu número de socio.')}`,
  },
  {
    archivo: 'cps-solicitud-no-aprobada.html',
    para: 'Profesional, si Samaco rechaza la solicitud',
    asunto: 'Sobre tu solicitud al Círculo de Profesionales',
    preheader: 'Necesitamos hablar con vos sobre tu solicitud.',
    variables: ['nombre', 'asesorWhatsapp'],
    cuerpo: `
${titulo('Hola {{nombre}}')}
${parrafo('Revisamos tu solicitud al Círculo de Profesionales y por ahora no pudimos aprobarla. Puede ser porque nos faltan datos de tu actividad profesional.')}
${parrafo('Si querés, escribinos y lo vemos juntos: muchas veces se resuelve con un dato más.')}
${boton('Hablar con un asesor', 'https://wa.me/{{asesorWhatsapp}}', color.primario)}`,
  },
  {
    archivo: 'cps-inscripcion-evento.html',
    para: 'Profesional, al inscribirse a un evento',
    asunto: 'Te inscribiste: {{eventoTitulo}}',
    preheader: '{{eventoFecha}} · {{eventoLugar}}',
    variables: ['nombre', 'eventoTitulo', 'eventoFecha', 'eventoLugar', 'sede', 'eventoUrl'],
    cuerpo: `
${titulo('¡Te esperamos, {{nombre}}!')}
${parrafo('Tu lugar en <strong>{{eventoTitulo}}</strong> está confirmado.')}
${caja(tablaFilas(`${fila('Cuándo', '<strong>{{eventoFecha}}</strong>')}${fila('Dónde', '{{eventoLugar}}')}${fila('Sede', '{{sede}}')}`))}
${boton('Ver el evento', '{{eventoUrl}}')}
${notaSuave('¿No vas a poder ir? Cancelá la inscripción desde tu panel así otro colega aprovecha el lugar.')}`,
  },
  {
    archivo: 'interno-cps-nueva-solicitud.html',
    para: 'Asesor/a de la sede elegida (aviso interno)',
    asunto: '[Círculo] Nueva solicitud: {{nombre}} {{apellido}} · {{profesion}}',
    preheader: 'Hay una solicitud nueva para revisar.',
    marca: 'interno',
    variables: ['nombre', 'apellido', 'profesion', 'email', 'telefono', 'matricula', 'estudio', 'zona', 'sede', 'comprasEnSamaco', 'comoNosConociste', 'fecha', 'urlAdmin'],
    cuerpo: `
${titulo('Nueva solicitud al Círculo')}
${parrafo('{{fecha}} · Sede elegida: <strong>{{sede}}</strong>')}
${caja(tablaFilas(`
  ${fila('Nombre', '<strong>{{nombre}} {{apellido}}</strong>')}
  ${fila('Especialidad', '{{profesion}}')}
  ${fila('Matrícula', '{{matricula}}')}
  ${fila('Estudio / empresa', '{{estudio}}')}
  ${fila('Zona de trabajo', '{{zona}}')}
  ${fila('¿Compra en Samaco?', '{{comprasEnSamaco}}')}
  ${fila('Cómo nos conoció', '{{comoNosConociste}}')}
  ${fila('Email', '<a href="mailto:{{email}}" style="color:' + color.primario + ';">{{email}}</a>')}
  ${fila('WhatsApp', '<a href="https://wa.me/{{telefono}}" style="color:' + color.primario + ';">{{telefono}}</a>')}
`))}
${boton('Revisar y aprobar', '{{urlAdmin}}', color.primario)}`,
  },
];

export const generarCps = (p) => layout({
  preheader: p.preheader,
  cuerpo: p.cuerpo,
  marca: p.marca ?? 'cps',
  sitio: '{{sitio}}',
});
