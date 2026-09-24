/**
 * Forma cruda de un turno tal como llega desde el turnos.json de cada sede.
 * Los tipos son heterogeneos a proposito: cada centro medico exporta distinto.
 */
export interface TurnoCrudo {
  id: string | number;
  paciente: string;
  documento: string | number;
  especialidad: string;
  fecha: string;
  hora: string;
  confirmado: string | boolean;
  observaciones?: string;
}

/** Especialidades soportadas por la red de centros medicos. */
export type Especialidad = 'Clinica medica' | 'Pediatria' | 'Odontologia' | 'Nutricion' | string;

/**
 * Turno normalizado: la forma de dominio que usa el resto de la aplicacion
 * (servicios, controladores, eventos, Socket.IO).
 */
export interface Turno {
  id: number;
  paciente: string;
  documento: string;
  especialidad: Especialidad;
  /** Fecha en formato ISO (YYYY-MM-DD). */
  fecha: string;
  /** Hora en formato HH:mm (24 hs). */
  hora: string;
  confirmado: boolean;
  observaciones?: string;
}

/** Datos aceptados al crear un turno (sin id, lo asigna el servicio). */
export type CreateTurnoInput = Omit<Turno, 'id'>;

/** Datos aceptados al actualizar un turno (todos los campos opcionales). */
export type UpdateTurnoInput = Partial<Omit<Turno, 'id'>>;
