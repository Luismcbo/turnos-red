/**
 * MOCKUP (propuesta): turno medico vinculado a un Paciente y a un Profesional por id.
 * Reemplaza al `Turno` actual (que guarda `paciente` y `documento` sueltos). Solo tipos.
 * Ver pacientes-turnos.md en la raiz del proyecto.
 */
import type { PacienteResumen } from './pacientes.model.js';

/** Ciclo de vida de un turno. */
export const ESTADOS_TURNO = [
  'PENDIENTE',
  'CONFIRMADO',
  'ATENDIDO',
  'CANCELADO',
  'AUSENTE',
] as const;
export type EstadoTurno = (typeof ESTADOS_TURNO)[number];

export interface TurnoMedico {
  id: number;
  pacienteId: number;
  profesionalId: number;
  /** Se guarda ademas del profesional para poder listar/filtrar sin cruzar tablas. */
  especialidadId: number;
  /** Fecha ISO (YYYY-MM-DD). */
  fecha: string;
  /** Hora de inicio HH:mm (24 hs). */
  hora: string;
  duracionMinutos: number;
  estado: EstadoTurno;
  /** Motivo de consulta declarado por el paciente. */
  motivo?: string;
  /** Notas internas (recepcion / profesional). */
  observaciones?: string;
  creadoEn: string;
  actualizadoEn: string;
}

/** Cuerpo de POST /turnos-medicos (endpoint futuro): el servidor asigna id, estado inicial y marcas de tiempo. */
export type CreateTurnoMedicoInput = Pick<
  TurnoMedico,
  'pacienteId' | 'profesionalId' | 'fecha' | 'hora'
> &
  Partial<Pick<TurnoMedico, 'duracionMinutos' | 'motivo' | 'observaciones'>>;

// ---------------------------------------------------------------------------
// Contrato de GET /pacientes/:id/turnos (lo que consume el Frontend)
// ---------------------------------------------------------------------------

/** Filtros de GET /pacientes/:id/turnos (todos opcionales, se combinan con AND). */
export interface TurnosDePacienteFilters {
  estado?: EstadoTurno;
  /** Fecha minima inclusive (YYYY-MM-DD o DD/MM/YYYY). */
  desde?: string;
  /** Fecha maxima inclusive (YYYY-MM-DD o DD/MM/YYYY). */
  hasta?: string;
  orden?: 'asc' | 'desc';
}

/** Un turno con el profesional y la especialidad ya resueltos (evita N requests extra en el Frontend). */
export interface TurnoDePaciente {
  id: number;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  estado: EstadoTurno;
  motivo?: string;
  profesional: { id: number; nombre: string; apellido: string; matricula: string };
  especialidad: { id: number; nombre: string };
}

export interface TurnosDePacienteResponse {
  paciente: PacienteResumen;
  total: number;
  turnos: TurnoDePaciente[];
}
