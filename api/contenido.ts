// GET /api/contenido — contenido editable del sitio, cargado en Shopify como metaobjetos
// (Contenido → Metaobjetos: "Promoción de pago", "Banner de la home", "Textos del sitio").
// Se cachea 5 minutos en el CDN de Vercel: un cambio en Shopify se ve en el sitio en ese tiempo.
// Si falla, responde 503 y el sitio sigue con el contenido del código (src/financiacion/data.ts).
import { admin, respuesta } from './_lib/shopify.js';
import {
  CANAL_OPCION, COLOR_ETIQUETA, COLOR_PROMO, DESTINO_OPCION, TIPO_PLAN_OPCION, VIGENCIA_OPCION, imagenBannerPorDefecto,
} from '../src/contenido/opciones.js';
import type { MedioPago, Plan, PromoDestacada, Vigencia } from '../src/financiacion/data.js';
import type { Banner, Contenido } from '../src/contenido/index.js';

interface Campo {
  key: string;
  value: string | null;
  reference?: { image?: { url: string } } | null;
  references?: { nodes: { fields: Campo[] }[] } | null;
}
interface Entrada { handle: string; fields: Campo[] }

const CAMPOS = `handle fields {
  key value
  reference { ... on MediaImage { image { url } } }
  references(first: 20) { nodes { ... on Metaobject { fields { key value } } } }
}`;

const lista = async (type: string) => {
  const r = await admin<{ metaobjects: { nodes: Entrada[] } }>(
    `query($t: String!) { metaobjects(type: $t, first: 50) { nodes { ${CAMPOS} } } }`, { t: type });
  return r.metaobjects.nodes;
};

const mapa = (fields: Campo[]) => Object.fromEntries(fields.map((f) => [f.key, f]));
const texto = (c?: Campo) => c?.value?.trim() ?? '';
const listaTexto = (c?: Campo): string[] => { try { return JSON.parse(c?.value ?? '[]'); } catch { return []; } };
const numero = (c?: Campo) => (c?.value ? Number(c.value) : undefined);
const visible = (c?: Campo) => c?.value !== 'false';
const vigencia = (modo?: Campo, fin?: Campo): Vigencia =>
  texto(modo) === VIGENCIA_OPCION.fecha && texto(fin) ? texto(fin) : 'mensual';
const porOrden = <T extends { orden: number }>(a: T, b: T) => a.orden - b.orden;

function aPlan(fields: Campo[]): Plan | null {
  const f = mapa(fields);
  const etiqueta = texto(f.etiqueta);
  if (!etiqueta) return null;
  return {
    etiqueta,
    tipo: TIPO_PLAN_OPCION[texto(f.tipo)] ?? 'sin-interes',
    cuotas: numero(f.cuotas) ?? 1,
    ...(numero(f.descuento) ? { descuento: numero(f.descuento) } : {}),
  };
}

function aMedio(e: Entrada): (MedioPago & { orden: number }) | null {
  const f = mapa(e.fields);
  if (!visible(f.activa) || !texto(f.beneficio)) return null;
  const colores = COLOR_PROMO[texto(f.color)] ?? COLOR_PROMO.Azul;
  return {
    id: e.handle,
    nombre: texto(f.nombre),
    beneficio: texto(f.beneficio),
    canal: CANAL_OPCION[texto(f.canal)] ?? 'ambos',
    tarjetas: listaTexto(f.tarjetas),
    planes: (f.planes?.references?.nodes ?? []).map((n) => aPlan(n.fields)).filter((p): p is Plan => p !== null),
    notas: texto(f.notas).split('\n').map((l) => l.trim()).filter(Boolean),
    vigencia: vigencia(f.vigencia, f.fin),
    ...(texto(f.inicio) ? { desde: texto(f.inicio) } : {}),
    ...colores,
    orden: numero(f.orden) ?? 99,
  };
}

function aBanner(e: Entrada, i: number): (Banner & { orden: number }) | null {
  const f = mapa(e.fields);
  if (!visible(f.activo) || !texto(f.titulo)) return null;
  return {
    id: e.handle,
    etiqueta: texto(f.etiqueta),
    titulo: texto(f.titulo),
    bajada: texto(f.bajada),
    boton: texto(f.boton) || 'Ver más',
    destino: DESTINO_OPCION[texto(f.destino)] ?? 'home',
    imagen: f.imagen?.reference?.image?.url ?? imagenBannerPorDefecto(i),
    colorEtiqueta: COLOR_ETIQUETA[texto(f.color_etiqueta)] ?? COLOR_ETIQUETA.Azul,
    vigencia: vigencia(f.vigencia, f.fin),
    ...(texto(f.inicio) ? { desde: texto(f.inicio) } : {}),
    orden: numero(f.orden) ?? 99,
  };
}

function aDestacada(f: Record<string, Campo>): PromoDestacada | null {
  if (!visible(f.promo_activa) || !texto(f.promo_titulo)) return null;
  return {
    titulo: texto(f.promo_titulo),
    bajada: texto(f.promo_bajada),
    tarjetas: listaTexto(f.promo_tarjetas),
    canal: CANAL_OPCION[texto(f.promo_canal)] ?? 'ambos',
    vigencia: vigencia(f.promo_vigencia, f.promo_fin),
  };
}

export async function GET() {
  try {
    const [promos, banners, sitio] = await Promise.all([lista('samaco_promo'), lista('samaco_banner'), lista('samaco_sitio')]);
    const config = sitio[0] ? mapa(sitio[0].fields) : null;
    const quitarOrden = <T extends { orden: number }>({ orden: _o, ...resto }: T) => resto;

    const contenido: Partial<Contenido> = {
      medios: promos.map(aMedio).filter((m): m is NonNullable<typeof m> => m !== null).sort(porOrden).map(quitarOrden),
      banners: banners.map(aBanner).filter((b): b is NonNullable<typeof b> => b !== null).sort(porOrden).map(quitarOrden),
      ...(config ? {
        destacada: aDestacada(config),
        cinta: listaTexto(config.cinta),
        legal: texto(config.legal),
      } : {}),
    };
    return new Response(JSON.stringify(contenido), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    console.error('[contenido]', e);
    return respuesta(503, { error: 'sin-contenido' });
  }
}
