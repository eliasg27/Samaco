// Limpieza del HTML de descripciones que viene de Shopify antes de renderizarlo.
// El contenido lo carga el equipo desde el admin (fuente confiable), pero igual se quitan
// scripts, iframes, estilos y atributos de eventos para que nada pegado de otro sitio ejecute código.

const TAGS_PERMITIDOS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4',
  'A', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN', 'DIV', 'IMG', 'BLOCKQUOTE',
]);
const ATRIBUTOS_PERMITIDOS: Record<string, string[]> = { A: ['href', 'title'], IMG: ['src', 'alt'] };

export function limpiarHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const raiz = doc.body.firstElementChild as HTMLElement;

  const limpiar = (el: Element) => {
    for (const hijo of [...el.children]) {
      if (!TAGS_PERMITIDOS.has(hijo.tagName)) {
        // Etiquetas peligrosas se eliminan con su contenido; el resto se "desenvuelve" conservando el texto.
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON'].includes(hijo.tagName)) hijo.remove();
        else { limpiar(hijo); hijo.replaceWith(...hijo.childNodes); }
        continue;
      }
      const permitidos = ATRIBUTOS_PERMITIDOS[hijo.tagName] ?? [];
      for (const attr of [...hijo.attributes]) {
        const valor = attr.value.trim().toLowerCase();
        if (!permitidos.includes(attr.name) || valor.startsWith('javascript:') || valor.startsWith('data:')) {
          hijo.removeAttribute(attr.name);
        }
      }
      if (hijo.tagName === 'A') { hijo.setAttribute('target', '_blank'); hijo.setAttribute('rel', 'noopener noreferrer'); }
      if (hijo.tagName === 'IMG') hijo.setAttribute('loading', 'lazy');
      limpiar(hijo);
    }
  };
  limpiar(raiz);
  return raiz.innerHTML;
}
