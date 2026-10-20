import { Beneficio, Descuento, Estudio, Evento, Profesional, RegistroInput, ResultadoAuth, ResultadoIngreso, ResultadoRegistro, Sede } from './types';

/**
 * Contrato del Círculo de Profesionales.
 *
 * Implementaciones: shopify.ts (real) y mock.ts (demo en localStorage). index.ts elige según las variables.
 *  - Profesional  = Customer de Shopify con tags `cps` + `cps-pendiente` → Samaco lo cambia a `cps-aprobado`
 *                   (o `cps-rechazado`) desde el admin. Datos en metafields `cps.*` (ver api/_lib/cps.ts).
 *                   El alta y el perfil pasan por las funciones de Vercel en api/cps/ (Admin API).
 *  - Ingreso      = login sin contraseña de Shopify (Customer Account API: código por email).
 *  - Descuentos   = descuentos automáticos de Shopify con elegibilidad por segmento de clientes (tag `profesional`),
 *                   así el checkout de Shopify los aplica solo.
 *  - Eventos / Estudios / Beneficios = metaobjects de Shopify (`evento`, `estudio`, `beneficio`).
 */
export interface ProfesionalesService {
  registrar(input: RegistroInput): Promise<ResultadoRegistro>;
  ingresar(email: string): Promise<ResultadoIngreso>;
  /** Vuelta del login de Shopify (/CPS/acceso?code=…). Solo la usa el provider real. */
  completarIngreso?(params: URLSearchParams): Promise<ResultadoAuth>;
  salir(): Promise<void>;
  sesionActual(): Promise<Profesional | null>;
  actualizarPerfil(id: string, cambios: Partial<Pick<Profesional, 'telefono' | 'estudio' | 'apareceEnDirectorio' | 'sede'>>): Promise<Profesional>;

  getEventos(sede?: Sede): Promise<Evento[]>;
  /** Evento por id (slug de la URL /CPS/eventos/:id). null si no existe. */
  getEvento(id: string): Promise<Evento | null>;
  inscribirEvento(profesionalId: string, eventoId: string): Promise<Profesional>;
  cancelarInscripcion(profesionalId: string, eventoId: string): Promise<Profesional>;

  getDescuentos(): Promise<Descuento[]>;
  getBeneficios(): Promise<Beneficio[]>;
  getEstudios(): Promise<Estudio[]>;
  /** Profesionales aprobados que aceptaron aparecer en el directorio. */
  getDirectorio(): Promise<Pick<Profesional, 'id' | 'nombre' | 'apellido' | 'profesion' | 'estudio' | 'sede'>[]>;
}
