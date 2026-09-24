import especialidadesData from '../data/especialidades.json' with { type: 'json' };
import type { EspecialidadItem } from '../models/especialidades.model.js';
import { comparisonKey } from '../utils/normalizers.js';

// Datos en memoria cargados desde src/data/especialidades.json.
// Las funciones son async para que el dia que se integre una base de datos
// no cambie el contrato con los controllers.
const especialidades: EspecialidadItem[] = [...especialidadesData];
let nextId = especialidades.reduce((max, e) => Math.max(max, e.id), 0) + 1;

export interface EspecialidadFilters {
  nombre?: string;
}

export type CreateEspecialidadInput = Omit<EspecialidadItem, 'id'>;
export type UpdateEspecialidadInput = Partial<CreateEspecialidadInput>;

export const findAll = async (filters: EspecialidadFilters = {}): Promise<EspecialidadItem[]> => {
  const { nombre } = filters;
  if (nombre === undefined) return especialidades;
  return especialidades.filter((e) => e.nombre.toLowerCase().includes(nombre.toLowerCase()));
};

export const findById = async (id: number): Promise<EspecialidadItem | undefined> =>
  especialidades.find((e) => e.id === id);

/** Busca por nombre ignorando mayusculas y tildes ("pediatria" == "Pediatría"). */
export const findByNombre = async (nombre: string): Promise<EspecialidadItem | undefined> =>
  especialidades.find((e) => comparisonKey(e.nombre) === comparisonKey(nombre));

export const create = async (data: CreateEspecialidadInput): Promise<EspecialidadItem> => {
  const nueva: EspecialidadItem = { id: nextId++, ...data };
  especialidades.push(nueva);
  return nueva;
};

export const update = async (
  id: number,
  data: UpdateEspecialidadInput,
): Promise<EspecialidadItem | undefined> => {
  const index = especialidades.findIndex((e) => e.id === id);
  if (index === -1) return undefined;
  especialidades[index] = { ...especialidades[index], ...data, id };
  return especialidades[index];
};

export const remove = async (id: number): Promise<boolean> => {
  const index = especialidades.findIndex((e) => e.id === id);
  if (index === -1) return false;
  especialidades.splice(index, 1);
  return true;
};
