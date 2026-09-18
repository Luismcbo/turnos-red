import { env } from '../config/env.js';
import { turnoEventBus } from '../events/turnoEventBus.js';
import type { ActualizarTurnoInput, NuevoTurnoInput, Turno } from '../models/turno.model.js';
import { leerTurnosCrudos } from './turnosFileReader.js';
import { normalizarTurnos } from '../utils/normalizarTurno.js';

let turnos: Turno[] = [];
let siguienteId = 1;

/**
 * Carga inicial: lee turnos.json, normaliza y valida cada registro,
 * e informa por consola cuantos se aceptaron y cuantos se rechazaron.
 */
export async function inicializarTurnos(): Promise<void> {
  const crudos = await leerTurnosCrudos(env.turnosDataPath);
  const resultado = normalizarTurnos(crudos);

  turnos = resultado.turnos;
  siguienteId = turnos.reduce((maxId, turno) => Math.max(maxId, turno.id), 0) + 1;

  console.log(
    `[turnos] Carga inicial: ${resultado.aceptados} aceptados, ${resultado.rechazados} rechazados ` +
      `(de ${crudos.length} registros leidos).`,
  );
}

export function listarTurnos(): Turno[] {
  return turnos;
}

export function buscarTurnoPorId(id: number): Turno | undefined {
  return turnos.find((turno) => turno.id === id);
}

export function crearTurno(datos: NuevoTurnoInput): Turno {
  const turno: Turno = { id: siguienteId++, ...datos };
  turnos.push(turno);
  turnoEventBus.emit('turno:creado', turno);
  return turno;
}

export function actualizarTurno(id: number, datos: ActualizarTurnoInput): Turno | undefined {
  const indice = turnos.findIndex((turno) => turno.id === id);
  if (indice === -1) return undefined;

  const turnoActualizado: Turno = { ...turnos[indice], ...datos, id };
  turnos[indice] = turnoActualizado;
  turnoEventBus.emit('turno:actualizado', turnoActualizado);
  return turnoActualizado;
}

export function eliminarTurno(id: number): Turno | undefined {
  const indice = turnos.findIndex((turno) => turno.id === id);
  if (indice === -1) return undefined;

  const [turnoEliminado] = turnos.splice(indice, 1);
  turnoEventBus.emit('turno:eliminado', turnoEliminado);
  return turnoEliminado;
}
