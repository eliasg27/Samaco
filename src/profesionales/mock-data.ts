import { Beneficio, Descuento, Estudio, Evento } from './types';

// Datos de ejemplo para desarrollo. Reemplazar por los reales de Samaco (o por metaobjects de Shopify).

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=800`;

export const EVENTOS: Evento[] = [
  {
    id: 'porcelanatos-gran-formato',
    titulo: 'Porcelanatos de gran formato: diseño y colocación',
    tipo: 'capacitacion',
    sede: 'mendoza',
    fecha: '2026-10-29T18:30:00-03:00',
    lugar: 'Showroom Casa Central — Godoy Cruz',
    descripcion: 'Criterios de especificación, sistemas de nivelación y juntas para formatos de 60x120 y mayores. Incluye demostración en vivo.',
    marca: 'Cemix',
    cupo: 40,
    inscriptos: 27,
    imagen: img('photo-1600585154340-be6161a56a0c'),
    exclusivo: true,
  },
  {
    id: 'after-office-san-juan',
    titulo: 'After office del Círculo de Profesionales',
    tipo: 'networking',
    sede: 'san-juan',
    fecha: '2026-11-06T19:30:00-03:00',
    lugar: 'Samaco San Juan',
    descripcion: 'Encuentro entre estudios y profesionales de San Juan. Presentación de novedades de temporada y espacio para compartir proyectos.',
    cupo: 60,
    inscriptos: 18,
    imagen: img('photo-1511578314322-379afb476865'),
    exclusivo: true,
  },
  {
    id: 'lanzamiento-griferia-fv',
    titulo: 'Lanzamiento línea de grifería de diseño',
    tipo: 'lanzamiento',
    sede: 'mendoza',
    fecha: '2026-11-12T19:00:00-03:00',
    lugar: 'Showroom Casa Central — Godoy Cruz',
    descripcion: 'Presentación de la nueva colección con el equipo técnico de la marca. Acabados, compatibilidades y precios especiales de lanzamiento.',
    marca: 'FV',
    cupo: 80,
    inscriptos: 51,
    imagen: img('photo-1584622650111-993a426fbf0a'),
    exclusivo: false,
  },
  {
    id: 'impermeabilizacion-cubiertas',
    titulo: 'Impermeabilización de cubiertas: membranas y líquidos',
    tipo: 'capacitacion',
    sede: 'san-juan',
    fecha: '2026-11-19T18:00:00-03:00',
    lugar: 'Samaco San Juan — Sala de capacitación',
    descripcion: 'Comparativa de sistemas, detalles constructivos en encuentros y babetas, y errores frecuentes en obra.',
    marca: 'Ormiflex',
    cupo: 35,
    inscriptos: 35,
    imagen: img('photo-1503387762-592deb58ef4e'),
    exclusivo: true,
  },
  {
    id: 'visita-planta-bloques',
    titulo: 'Visita técnica: planta de bloques de hormigón',
    tipo: 'visita',
    sede: 'mendoza',
    fecha: '2026-11-26T09:00:00-03:00',
    lugar: 'Salida desde Casa Central — Godoy Cruz',
    descripcion: 'Recorrida por el proceso productivo y ensayos de resistencia. Traslado incluido. Cupo limitado.',
    cupo: 20,
    inscriptos: 9,
    imagen: img('photo-1504307651254-35680f356dfd'),
    exclusivo: true,
  },
  {
    id: 'cierre-de-anio-2026',
    titulo: 'Cierre de año del Círculo — Mendoza y San Juan',
    tipo: 'networking',
    sede: 'mendoza',
    fecha: '2026-12-10T20:00:00-03:00',
    lugar: 'A confirmar',
    descripcion: 'Encuentro anual de miembros de ambas sedes. Reconocimiento a obras destacadas del año.',
    cupo: 150,
    inscriptos: 64,
    imagen: img('photo-1519167758481-83f550bb49b3'),
    exclusivo: true,
  },
];

export const DESCUENTOS: Descuento[] = [
  { id: 'd-1', alcance: 'Pisos y Revestimientos', porcentaje: 12, detalle: 'Sobre precio de lista, acumulable con 15% OFF por transferencia.', sede: 'todas' },
  { id: 'd-2', alcance: 'Grifería',               porcentaje: 10, detalle: 'Todas las marcas.', sede: 'todas' },
  { id: 'd-3', alcance: 'Sanitarios',             porcentaje: 10, detalle: 'Loza y vanitorios.', sede: 'todas' },
  { id: 'd-4', alcance: 'Obra Gruesa',            porcentaje: 5,  detalle: 'Cemento, hierro y bloques para obras con acopio.', sede: 'mendoza' },
  { id: 'd-5', alcance: 'Pinturas',               porcentaje: 8,  detalle: 'Látex y esmaltes de línea profesional.', vigenciaHasta: '2026-12-31', sede: 'todas' },
  { id: 'd-6', alcance: 'Herramientas',           porcentaje: 7,  detalle: 'Herramientas eléctricas.', sede: 'san-juan' },
];

export const BENEFICIOS: Beneficio[] = [
  { id: 'b-1', icono: 'percent',  titulo: 'Precios profesionales',      descripcion: 'Descuentos exclusivos por categoría, aplicados automáticamente al comprar con tu cuenta.' },
  { id: 'b-2', icono: 'calendar', titulo: 'Eventos y capacitaciones',   descripcion: 'Lanzamientos, charlas técnicas con marcas y visitas a plantas en Mendoza y San Juan.' },
  { id: 'b-3', icono: 'user',     titulo: 'Asesor comercial asignado',  descripcion: 'Un referente en tu sede para cotizaciones de obra, acopio y logística de entregas.' },
  { id: 'b-4', icono: 'truck',    titulo: 'Entregas programadas',       descripcion: 'Coordinación de entregas por etapa de obra con la flota propia de Samaco.' },
  { id: 'b-5', icono: 'book',     titulo: 'Fichas y catálogos técnicos', descripcion: 'Documentación técnica de las marcas para especificar y presupuestar.' },
  { id: 'b-6', icono: 'award',    titulo: 'Red de profesionales',       descripcion: 'Tu estudio visible en el directorio del Círculo para clientes que buscan profesionales.' },
];

export const ESTUDIOS: Estudio[] = [
  { id: 'es-1', nombre: 'Estudio Andino Arquitectura', responsables: ['Arq. (ejemplo)'], sede: 'mendoza',  especialidades: ['Vivienda unifamiliar', 'Bodegas'],      imagen: img('photo-1600607687939-ce8a6c25118c') },
  { id: 'es-2', nombre: 'Taller Piedemonte',           responsables: ['Arq. (ejemplo)'], sede: 'mendoza',  especialidades: ['Interiorismo', 'Reformas'],             imagen: img('photo-1600566753190-17f0baa2a6c3') },
  { id: 'es-3', nombre: 'Zonda Estudio',               responsables: ['Arq. (ejemplo)'], sede: 'san-juan', especialidades: ['Arquitectura sismorresistente'],         imagen: img('photo-1600585154526-990dced4db0d') },
  { id: 'es-4', nombre: 'Cuyo Proyectos',              responsables: ['Ing. (ejemplo)'], sede: 'san-juan', especialidades: ['Dirección de obra', 'Comercial'],        imagen: img('photo-1497366216548-37526070297c') },
  { id: 'es-5', nombre: 'Estudio Cordillera',          responsables: ['Arq. (ejemplo)'], sede: 'mendoza',  especialidades: ['Arquitectura sustentable'],              imagen: img('photo-1600047509807-ba8f99d2cdde') },
  { id: 'es-6', nombre: 'Río Bermejo Arquitectos',     responsables: ['Arq. (ejemplo)'], sede: 'san-juan', especialidades: ['Vivienda', 'Equipamiento'],              imagen: img('photo-1600210492486-724fe5c67fb0') },
];

/** Cuenta de demostración aprobada (solo en modo mock). */
/** Cuenta aprobada para probar el modo demo (sin contraseña, como el ingreso real con código). */
export const DEMO_CUENTA = { email: 'demo@samaco.test' };
