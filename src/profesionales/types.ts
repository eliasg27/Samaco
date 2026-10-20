export type Sede = 'mendoza' | 'san-juan';

export const SEDES: Record<Sede, string> = {
  'mendoza':  'Samaco Mendoza',
  'san-juan': 'Samaco San Juan',
};

// Opciones tomadas del formulario oficial del Círculo (Google Forms de Samaco).

/** "Especialidad" en el formulario. */
export type Profesion = 'arquitecto' | 'ingeniero' | 'desarrollador' | 'constructor' | 'otro';

export const PROFESIONES: Record<Profesion, string> = {
  arquitecto:    'Arquitecto/a',
  ingeniero:     'Ingeniero/a civil',
  desarrollador: 'Desarrollador/a inmobiliario',
  constructor:   'Constructor/a independiente',
  otro:          'Profesional',
};

export type Zona = 'capital' | 'godoy-cruz' | 'lujan' | 'maipu' | 'guaymallen' | 'las-heras' | 'otros';

export const ZONAS: Record<Zona, string> = {
  'capital':    'Ciudad de Mendoza',
  'godoy-cruz': 'Godoy Cruz',
  'lujan':      'Luján de Cuyo',
  'maipu':      'Maipú',
  'guaymallen': 'Guaymallén',
  'las-heras':  'Las Heras',
  'otros':      'Otros',
};

export type ComprasEnSamaco = 'regular' | 'alguna-vez' | 'no';

export const COMPRAS_EN_SAMACO: Record<ComprasEnSamaco, string> = {
  'regular':    'Sí, regularmente',
  'alguna-vez': 'Sí, alguna vez',
  'no':         'No, pero me interesa',
};

export type ComoNosConociste = 'evento' | 'colega' | 'redes' | 'ventas' | 'otro';

export const COMO_NOS_CONOCISTE: Record<ComoNosConociste, string> = {
  evento: 'Evento de lanzamiento',
  colega: 'Un colega me lo recomendó',
  redes:  'Redes sociales de Samaco',
  ventas: 'El equipo de ventas de Samaco',
  otro:   'Otro',
};

/** Colegio que emite la matrícula (la matrícula es opcional). */
export type Colegio = 'camza' | 'casj' | 'otro';

export const COLEGIOS: Record<Colegio, string> = {
  camza: 'Colegio de Arquitectos de Mendoza',
  casj:  'Colegio de Arquitectos de San Juan',
  otro:  'Otro colegio / consejo profesional',
};

/** pendiente: Samaco todavía no revisó la solicitud. aprobado: miembro activo. */
export type EstadoMembresia = 'pendiente' | 'aprobado' | 'rechazado';

export interface Profesional {
  id: string;
  /** Número de socio del Círculo (se asigna al aprobar). */
  numeroSocio?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  profesion: Profesion;
  /** Opcional: no todos los miembros tienen matrícula (desarrolladores, constructores…). */
  matricula?: string;
  colegio?: Colegio;
  zona: Zona;
  sede: Sede;
  comprasEnSamaco: ComprasEnSamaco;
  comoNosConociste?: ComoNosConociste;
  estudio?: string;
  /** Aceptó aparecer en el directorio público de la Red de Profesionales. */
  apareceEnDirectorio: boolean;
  estado: EstadoMembresia;
  fechaAlta: string; // ISO
  /** IDs de eventos en los que se inscribió. */
  eventosInscriptos: string[];
}

export interface RegistroInput {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  profesion: Profesion;
  matricula?: string;
  colegio?: Colegio;
  zona: Zona;
  sede: Sede;
  comprasEnSamaco: ComprasEnSamaco;
  comoNosConociste?: ComoNosConociste;
  estudio?: string;
  apareceEnDirectorio: boolean;
}

export type TipoEvento = 'capacitacion' | 'lanzamiento' | 'visita' | 'networking';

export const TIPOS_EVENTO: Record<TipoEvento, string> = {
  capacitacion: 'Capacitación',
  lanzamiento:  'Lanzamiento',
  visita:       'Visita técnica',
  networking:   'Encuentro',
};

export interface Evento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  sede: Sede;
  fecha: string; // ISO con hora
  lugar: string;
  descripcion: string;
  marca?: string;
  cupo: number;
  inscriptos: number;
  imagen: string;
  /** Solo para miembros aprobados. */
  exclusivo: boolean;
}

export interface Descuento {
  id: string;
  /** Categoría del catálogo o marca a la que aplica. */
  alcance: string;
  porcentaje: number;
  detalle: string;
  vigenciaHasta?: string; // ISO
  sede: Sede | 'todas';
}

export interface Beneficio {
  id: string;
  icono: 'percent' | 'calendar' | 'user' | 'truck' | 'book' | 'award';
  titulo: string;
  descripcion: string;
}

export interface Estudio {
  id: string;
  nombre: string;
  responsables: string[];
  sede: Sede;
  especialidades: string[];
  imagen: string;
  web?: string;
  instagram?: string;
}

export type ResultadoAuth =
  | { ok: true; profesional: Profesional }
  /** codigo 'no-registrado': entró con su cuenta de Shopify pero nunca pidió el alta al Círculo. */
  | { ok: false; error: string; codigo?: 'no-registrado'; email?: string };

/** Alta: en demo deja la sesión iniciada (trae el profesional); con Shopify queda pendiente y después se ingresa con código. */
export type ResultadoRegistro =
  | { ok: true; profesional?: Profesional }
  | { ok: false; error: string };

/** Ingreso: en demo es inmediato; con Shopify el navegador se va a la página de Shopify que manda el código. */
export type ResultadoIngreso = ResultadoAuth | { ok: true; redirigiendo: true };
