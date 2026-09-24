import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';
import type {
  CreateTurnoInput,
  Turno,
  TurnoCrudo,
  UpdateTurnoInput,
} from '../models/turno.model.js';
import { normalizeTurnos } from '../utils/normalizers.js';
import { readJsonArray } from './fileReader.js';
import { medicoExists } from './medico.service.js';

let turnos: Turno[] = [];
let nextId = 1;

/**
 * Carga inicial: lee turnos.json, normaliza y valida cada registro (incluido que el
 * medicoId, si viene, exista) e informa por consola cuantos se aceptaron y rechazaron.
 * Debe ejecutarse DESPUES de initMedicos().
 */
export async function initTurnos(): Promise<void> {
  const raw = await readJsonArray<TurnoCrudo>(env.turnosDataPath, 'turnos');
  const result = normalizeTurnos(raw);

  turnos = result.turnos.filter(
    (turno) => turno.medicoId === undefined || medicoExists(turno.medicoId),
  );
  nextId = turnos.reduce((maxId, turno) => Math.max(maxId, turno.id), 0) + 1;

  console.log(
    `[turnos] Carga inicial: ${turnos.length} aceptados, ${raw.length - turnos.length} rechazados ` +
      `(de ${raw.length} registros leidos).`,
  );
}

function notFound(id: number): AppError {
  return AppError.notFound(`No existe un turno con id ${id}`);
}

/** Un medicoId que no existe es un dato invalido del cliente (400), no un 404 de la ruta. */
function assertMedicoExists(medicoId: number | null | undefined): void {
  if (medicoId === undefined || medicoId === null || medicoExists(medicoId)) return;

  throw AppError.validation('El medico indicado no existe', [
    { location: 'body', field: 'medicoId', message: `No existe un medico con id ${medicoId}` },
  ]);
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
  assertMedicoExists(data.medicoId);

  const turno: Turno = { id: nextId++, ...data };
  turnos.push(turno);
  eventBus.emit('turno:creado', turno);
  return turno;
}

export function updateTurno(id: number, data: UpdateTurnoInput): Turno {
  const index = turnos.findIndex((item) => item.id === id);
  if (index === -1) throw notFound(id);
  assertMedicoExists(data.medicoId);

  const { medicoId, ...rest } = data;
  const updated: Turno = { ...turnos[index], ...rest, id };
  if (medicoId === null) delete updated.medicoId;
  else if (medicoId !== undefined) updated.medicoId = medicoId;

  turnos[index] = updated;
  eventBus.emit('turno:actualizado', updated);
  return updated;
}

export function deleteTurno(id: number): void {
  const index = turnos.findIndex((item) => item.id === id);
  if (index === -1) throw notFound(id);

  const [deleted] = turnos.splice(index, 1);
  eventBus.emit('turno:eliminado', deleted);
}

/**
 * Cuando se elimina un medico, sus turnos NO se borran: quedan sin medico asignado
 * y se notifica el cambio (turno:actualizado) a los clientes conectados.
 */
eventBus.on('medico:eliminado', (medico) => {
  turnos.forEach((turno, index) => {
    if (turno.medicoId !== medico.id) return;

    const unlinked: Turno = { ...turno };
    delete unlinked.medicoId;
    turnos[index] = unlinked;
    eventBus.emit('turno:actualizado', unlinked);
  });
});
