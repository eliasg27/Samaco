/** "Cemento Portland Loma Negra CPN40 x50kg" → "cemento-portland-loma-negra-cpn40-x50kg" (mismo criterio que los handles de Shopify). */
export const slugify = (texto: string) =>
  texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[²³]/g, m => (m === '²' ? '2' : '3'))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
