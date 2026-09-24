import type { Especialidad } from './especialidad.js';

/** Medico de la red: profesional al que se pueden vincular turnos (turno.medicoId). */
export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidad: Especialidad;
  disponible: boolean;
  email?: string;
}

/** Datos aceptados al crear un medico (sin id, lo asigna el servicio). */
export type CreateMedicoInput = Omit<Medico, 'id'>;

/** Datos aceptados al actualizar un medico (todos los campos opcionales). */
export type UpdateMedicoInput = Partial<Omit<Medico, 'id'>>;

/** Filtros de listado de medicos (ya normalizados). */
export interface MedicoFilters {
  especialidad?: Especialidad;
  disponible?: boolean;
}
