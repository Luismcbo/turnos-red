import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { turnoEventBus } from '../events/turnoEventBus.js';
import type {
  CreateTurnoInput,
  Turno,
  TurnoCrudo,
  UpdateTurnoInput,
} from '../models/turno.model.js';
import { normalizeTurnos } from '../utils/normalizers.js';
import { readJsonArray } from './fileReader.js';

let turnos: Turno[] = [];
let nextId = 1;

/**
 * Carga inicial: lee turnos.json, normaliza y valida cada registro,
 * e informa por consola cuantos se aceptaron y cuantos se rechazaron.
 */
export async function initTurnos(): Promise<void> {
  const raw = await readJsonArray<TurnoCrudo>(env.turnosDataPath, 'turnos');
  const result = normalizeTurnos(raw);

  turnos = result.turnos;
  nextId = turnos.reduce((maxId, turno) => Math.max(maxId, turno.id), 0) + 1;

  console.log(
    `[turnos] Carga inicial: ${result.accepted} aceptados, ${result.rejected} rechazados ` +
      `(de ${raw.length} registros leidos).`,
  );
}

function notFound(id: number): AppError {
  return AppError.notFound(`No existe un turno con id ${id}`);
}

export function listTurnos(): Turno[] {
  return turnos;
}

export function getTurnoById(id: number): Turno {
  const turno = turnos.find((item) => item.id === id);
  if (!turno) throw notFound(id);
  return turno;
}

export function createTurno(data: CreateTurnoInput): Turno {
  const turno: Turno = { id: nextId++, ...data };
  turnos.push(turno);
  turnoEventBus.emit('turno:creado', turno);
  return turno;
}

export function updateTurno(id: number, data: UpdateTurnoInput): Turno {
  const index = turnos.findIndex((item) => item.id === id);
  if (index === -1) throw notFound(id);

  const updated: Turno = { ...turnos[index], ...data, id };
  turnos[index] = updated;
  turnoEventBus.emit('turno:actualizado', updated);
  return updated;
}

export function deleteTurno(id: number): void {
  const index = turnos.findIndex((item) => item.id === id);
  if (index === -1) throw notFound(id);

  const [deleted] = turnos.splice(index, 1);
  turnoEventBus.emit('turno:eliminado', deleted);
}
