import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { eventBus } from '../events/eventBus.js';
import type {
  CreateMedicoInput,
  Medico,
  MedicoFilters,
  UpdateMedicoInput,
} from '../models/medico.model.js';
import { medicoRecordSchema } from '../schemas/medico.schema.js';
import { readJsonArray } from './fileReader.js';

let medicos: Medico[] = [];
let nextId = 1;

/**
 * Carga inicial: lee medicos.json y valida cada registro con el schema de Zod,
 * descartando (e informando) los invalidos.
 */
export async function initMedicos(): Promise<void> {
  const raw = await readJsonArray<unknown>(env.medicosDataPath, 'medicos');

  medicos = [];
  for (const record of raw) {
    const result = medicoRecordSchema.safeParse(record);
    if (result.success) medicos.push(result.data);
  }
  nextId = medicos.reduce((maxId, medico) => Math.max(maxId, medico.id), 0) + 1;

  console.log(
    `[medicos] Carga inicial: ${medicos.length} aceptados, ${raw.length - medicos.length} rechazados ` +
      `(de ${raw.length} registros leidos).`,
  );
}

function notFound(id: number): AppError {
  return AppError.notFound(`No existe un medico con id ${id}`);
}

/** Lista medicos aplicando (con AND) los filtros que vengan definidos. */
export function listMedicos(filters: MedicoFilters = {}): Medico[] {
  const { especialidad, disponible } = filters;

  return medicos.filter(
    (medico) =>
      (especialidad === undefined || medico.especialidad === especialidad) &&
      (disponible === undefined || medico.disponible === disponible),
  );
}

export function medicoExists(id: number): boolean {
  return medicos.some((medico) => medico.id === id);
}

export function getMedicoById(id: number): Medico {
  const medico = medicos.find((item) => item.id === id);
  if (!medico) throw notFound(id);
  return medico;
}

export function createMedico(data: CreateMedicoInput): Medico {
  const medico: Medico = { id: nextId++, ...data };
  medicos.push(medico);
  return medico;
}

export function updateMedico(id: number, data: UpdateMedicoInput): Medico {
  const index = medicos.findIndex((item) => item.id === id);
  if (index === -1) throw notFound(id);

  const updated: Medico = { ...medicos[index], ...data, id };
  medicos[index] = updated;
  return updated;
}

/** Elimina el medico y avisa por el bus para que sus turnos queden sin medico asignado. */
export function deleteMedico(id: number): void {
  const index = medicos.findIndex((item) => item.id === id);
  if (index === -1) throw notFound(id);

  const [deleted] = medicos.splice(index, 1);
  eventBus.emit('medico:eliminado', deleted);
}
