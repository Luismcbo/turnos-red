import { z } from 'zod';
import { ESPECIALIDADES, type Especialidad } from '../models/especialidad.js';
import { normalizeEspecialidad } from '../utils/normalizers.js';

/** Entero positivo llegado como string (params y query llegan siempre como texto). */
export const positiveIntFromString = z
  .string()
  .regex(/^\d+$/, 'Debe ser un entero positivo')
  .transform(Number)
  .refine((value) => value > 0, 'Debe ser un entero positivo');

/** Parametro de ruta ":id". */
export const idParamSchema = z.object({ id: positiveIntFromString });

export type IdParam = z.output<typeof idParamSchema>;

/**
 * Especialidad con grafia EXACTA. "PEDIATRÍA", "pediatria" o "Pediatria" se rechazan:
 * solo se acepta "Clínica médica", "Pediatría", "Odontología" o "Nutrición".
 */
export const especialidadSchema = z.enum(ESPECIALIDADES, {
  error: `Debe ser exactamente uno de: ${ESPECIALIDADES.map((e) => `"${e}"`).join(', ')} (respetando mayúsculas y tildes)`,
});

/**
 * Especialidad para FILTROS de query params: tolera mayusculas y tildes
 * ("pediatria", "PEDIATRÍA", "Pediatria") y siempre entrega la grafia canonica.
 */
export const especialidadFilterSchema = z
  .string()
  .refine((value) => normalizeEspecialidad(value) !== null, {
    error: `Especialidad desconocida. Valores admitidos (sin distinguir mayúsculas ni tildes): ${ESPECIALIDADES.join(', ')}`,
  })
  .transform((value) => normalizeEspecialidad(value) as Especialidad);
