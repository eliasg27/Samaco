import { Beneficio, Descuento, Estudio, Evento, Profesional, RegistroInput, ResultadoAuth, Sede } from './types';

/**
 * Contrato del Círculo de Profesionales.
 *
 * Hoy lo implementa mock.ts (localStorage). Mapeo previsto a Shopify:
 *  - Profesional  = Customer de Shopify con tag `profesional` (aprobado) o `profesional-pendiente`,
 *                   y metafields `samaco.matricula`, `samaco.colegio`, `samaco.profesion`, `samaco.sede`…
 *                   El alta pasa por una función propia (Vercel) que crea el customer como pendiente;
 *                   Samaco valida la matrícula y cambia el tag desde el admin.
 *  - Descuentos   = descuentos automáticos de Shopify con elegibilidad por segmento de clientes (tag `profesional`),
 *                   así el checkout de Shopify los aplica solo.
 *  - Eventos / Estudios / Beneficios = metaobjects de Shopify (`evento`, `estudio`, `beneficio`).
 */
export interface ProfesionalesService {
  registrar(input: RegistroInput): Promise<ResultadoAuth>;
  ingresar(email: string, password: string): Promise<ResultadoAuth>;
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
