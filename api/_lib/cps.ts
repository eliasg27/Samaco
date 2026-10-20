// Mapeo entre el cliente de Shopify y el Profesional del sitio.
//
// En Shopify un profesional es un cliente con:
//  - tags: `cps` + `cps-pendiente` (solicitud) → Samaco lo cambia a `cps-aprobado` (o `cps-rechazado`)
//  - metafields `cps.*` (definidos con scripts/cps-setup.mjs). Se guardan los textos legibles
//    ("Arquitecto/a", "Godoy Cruz"…) para que se entiendan en el admin; acá se traducen a las claves del sitio.

import {
  COLEGIOS, COMO_NOS_CONOCISTE, COMPRAS_EN_SAMACO, PROFESIONES, SEDES, ZONAS,
  type Colegio, type ComoNosConociste, type ComprasEnSamaco, type EstadoMembresia,
  type Profesion, type Profesional, type RegistroInput, type Sede, type Zona,
} from '../../src/profesionales/types.js';

export const TAG_BASE = 'cps';
export const TAG = { pendiente: 'cps-pendiente', aprobado: 'cps-aprobado', rechazado: 'cps-rechazado' } as const;

/** Campos que se leen del cliente en la Admin API. */
export const CAMPOS_CLIENTE = `id firstName lastName email tags createdAt
  metafields(namespace: "cps", first: 20) { nodes { key value } }`;

export interface ClienteAdmin {
  id: string; firstName: string | null; lastName: string | null; email: string | null;
  tags: string[]; createdAt: string;
  metafields: { nodes: { key: string; value: string }[] };
}

/** Busca la clave a partir del texto guardado (acepta también la clave directa). */
function clave<K extends string>(mapa: Record<K, string>, valor: string | undefined): K | undefined {
  if (!valor) return undefined;
  if (valor in mapa) return valor as K;
  return (Object.keys(mapa) as K[]).find((k) => mapa[k] === valor);
}

const numeroDe = (gid: string) => gid.split('/').pop() ?? gid;

export function aProfesional(c: ClienteAdmin): Profesional {
  const m = Object.fromEntries(c.metafields.nodes.map((n) => [n.key, n.value]));
  const estado: EstadoMembresia = c.tags.includes(TAG.aprobado) ? 'aprobado' : c.tags.includes(TAG.rechazado) ? 'rechazado' : 'pendiente';
  let eventos: string[] = [];
  try { eventos = JSON.parse(m.eventos ?? '[]'); } catch { /* json inválido */ }
  return {
    id: numeroDe(c.id),
    numeroSocio: estado === 'aprobado' ? (m.numero_socio || `CPS-${numeroDe(c.id).slice(-5)}`) : undefined,
    nombre: c.firstName ?? '',
    apellido: c.lastName ?? '',
    email: c.email ?? '',
    telefono: m.whatsapp ?? '',
    profesion: clave<Profesion>(PROFESIONES, m.profesion) ?? 'otro',
    matricula: m.matricula || undefined,
    colegio: clave<Colegio>(COLEGIOS, m.colegio),
    zona: clave<Zona>(ZONAS, m.zona) ?? 'otros',
    sede: clave<Sede>(SEDES, m.sede) ?? 'mendoza',
    comprasEnSamaco: clave<ComprasEnSamaco>(COMPRAS_EN_SAMACO, m.compras_en_samaco) ?? 'no',
    comoNosConociste: clave<ComoNosConociste>(COMO_NOS_CONOCISTE, m.como_nos_conociste),
    estudio: m.estudio || undefined,
    apareceEnDirectorio: m.directorio === 'true',
    estado,
    fechaAlta: m.fecha_alta || c.createdAt,
    eventosInscriptos: Array.isArray(eventos) ? eventos : [],
  };
}

const texto = (key: string, value: string | undefined) =>
  value?.trim() ? [{ namespace: 'cps', key, type: 'single_line_text_field', value: value.trim().slice(0, 200) }] : [];

/** Metafields a guardar al registrarse. */
export function metafieldsRegistro(i: RegistroInput) {
  return [
    ...texto('profesion', PROFESIONES[i.profesion]),
    ...texto('matricula', i.matricula),
    ...texto('colegio', i.matricula && i.colegio ? COLEGIOS[i.colegio] : undefined),
    ...texto('whatsapp', i.telefono),
    ...texto('zona', ZONAS[i.zona]),
    ...texto('sede', SEDES[i.sede]),
    ...texto('estudio', i.estudio),
    ...texto('compras_en_samaco', COMPRAS_EN_SAMACO[i.comprasEnSamaco]),
    ...texto('como_nos_conociste', i.comoNosConociste ? COMO_NOS_CONOCISTE[i.comoNosConociste] : undefined),
    { namespace: 'cps', key: 'directorio', type: 'boolean', value: String(Boolean(i.apareceEnDirectorio)) },
    { namespace: 'cps', key: 'fecha_alta', type: 'date_time', value: new Date().toISOString() },
  ];
}

/** Valida el formulario de alta. Devuelve el mensaje de error o null. */
export function validarRegistro(i: Partial<RegistroInput>): string | null {
  const req = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  if (!req(i.nombre) || !req(i.apellido)) return 'Completá nombre y apellido.';
  if (!req(i.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.email!.trim())) return 'Revisá el email.';
  if (!req(i.telefono) || i.telefono!.replace(/\D/g, '').length < 8) return 'Revisá el WhatsApp.';
  if (!i.profesion || !(i.profesion in PROFESIONES)) return 'Elegí tu especialidad.';
  if (!i.zona || !(i.zona in ZONAS)) return 'Elegí tu zona de trabajo.';
  if (!i.sede || !(i.sede in SEDES)) return 'Elegí la sede.';
  if (!i.comprasEnSamaco || !(i.comprasEnSamaco in COMPRAS_EN_SAMACO)) return 'Contanos si comprás en Samaco.';
  if (i.colegio && !(i.colegio in COLEGIOS)) return 'Revisá el colegio.';
  if (i.comoNosConociste && !(i.comoNosConociste in COMO_NOS_CONOCISTE)) return 'Revisá cómo nos conociste.';
  return null;
}
