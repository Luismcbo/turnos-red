import profesionalesData from '../data/profesionales.json' with { type: 'json' };
import type { Profesional } from '../models/profesionales.model.js';

// Datos en memoria cargados desde src/data/profesionales.json (ver especialidades.service.ts).
const profesionales: Profesional[] = [...profesionalesData];
let nextId = profesionales.reduce((max, p) => Math.max(max, p.id), 0) + 1;

export interface ProfesionalFilters {
  especialidadId?: number;
  activo?: boolean;
}

export type CreateProfesionalInput = Omit<Profesional, 'id' | 'activo'> & { activo?: boolean };
export type UpdateProfesionalInput = Partial<Omit<Profesional, 'id'>>;

export const findAll = async (filters: ProfesionalFilters = {}): Promise<Profesional[]> => {
  const { especialidadId, activo } = filters;
  return profesionales.filter(
    (p) =>
      (especialidadId === undefined || p.especialidadId === especialidadId) &&
      (activo === undefined || p.activo === activo),
  );
};

export const findById = async (id: number): Promise<Profesional | undefined> =>
  profesionales.find((p) => p.id === id);

export const create = async (data: CreateProfesionalInput): Promise<Profesional> => {
  const nuevo: Profesional = { id: nextId++, activo: true, ...data };
  profesionales.push(nuevo);
  return nuevo;
};

export const update = async (
  id: number,
  data: UpdateProfesionalInput,
): Promise<Profesional | undefined> => {
  const index = profesionales.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  profesionales[index] = { ...profesionales[index], ...data, id };
  return profesionales[index];
};

export const remove = async (id: number): Promise<boolean> => {
  const index = profesionales.findIndex((p) => p.id === id);
  if (index === -1) return false;
  profesionales.splice(index, 1);
  return true;
};
