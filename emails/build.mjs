// Genera los mails a partir de emails/src. Uso: node emails/build.mjs
// Salida: emails/shopify/*.liquid (pegar en Shopify) y emails/cps/*.html (plantillas del Círculo).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plantillasShopify, plantillasPersonal, generarShopify } from './src/shopify.mjs';
import { plantillasCps, generarCps } from './src/cps.mjs';

const raiz = dirname(fileURLToPath(import.meta.url));
const escribir = (carpeta, archivo, contenido) => {
  mkdirSync(join(raiz, carpeta), { recursive: true });
  writeFileSync(join(raiz, carpeta, archivo), contenido);
};

for (const p of [...plantillasShopify, ...plantillasPersonal]) escribir('shopify', p.archivo, generarShopify(p));
for (const p of plantillasCps) escribir('cps', p.archivo, generarCps(p));

// Índice con asunto de cada uno (el asunto en Shopify va en un campo aparte).
const indice = {
  shopify: [...plantillasShopify, ...plantillasPersonal].map(({ archivo, shopify, asunto }) => ({ archivo, plantillaEnShopify: shopify, asunto })),
  cps: plantillasCps.map(({ archivo, para, asunto, variables }) => ({ archivo, para, asunto, variables })),
};
escribir('.', 'asuntos.json', JSON.stringify(indice, null, 2) + '\n');
console.log(`OK: ${indice.shopify.length} plantillas de Shopify, ${indice.cps.length} del Círculo.`);
