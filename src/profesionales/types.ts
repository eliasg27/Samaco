export type Sede = 'mendoza' | 'san-juan';

export const SEDES: Record<Sede, string> = {
  'mendoza':  'Samaco Mendoza',
  'san-juan': 'Samaco San Juan',
};

export type Profesion = 'arquitecto' | 'ingeniero' | 'mmo' | 'disenador';

export const PROFESIONES: Record<Profesion, string> = {
  arquitecto: 'Arquitecto/a',
  ingeniero:  'Ingeniero/a civil',
  mmo:        'Maestro mayor de obras',
  disenador:  'Diseñador/a de interiores',
};

/** Colegio que emite la matrícula. */
export type Colegio = 'camza' | 'casj' | 'otro';

export const COLEGIOS: Record<Colegio, string> = {
  camza: 'Colegio de Arquitectos de Mendoza',
  casj:  'Colegio de Arquitectos de San Juan',
  otro:  'Otro colegio / consejo profesional',
};

/** pendiente: Samaco todavía no validó la matrícula. aprobado: miembro activo. */
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
  matricula: string;
  colegio: Colegio;
  sede: Sede;
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
  password: string;
  profesion: Profesion;
  matricula: string;
  colegio: Colegio;
  sede: Sede;
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
  | { ok: false; error: string };
