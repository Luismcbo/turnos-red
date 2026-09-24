import { z } from 'zod';
import { ESPECIALIDADES } from '../models/especialidad.js';

/** Parametro de ruta ":id": entero positivo llegado como string. */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Debe ser un entero positivo')
    .transform(Number)
    .refine((id) => id > 0, 'Debe ser un entero positivo'),
});

export type IdParam = z.output<typeof idParamSchema>;

/**
 * Especialidad con grafia EXACTA. "PEDIATRÍA", "pediatria" o "Pediatria" se rechazan:
 * solo se acepta "Clínica médica", "Pediatría", "Odontología" o "Nutrición".
 */
export const especialidadSchema = z.enum(ESPECIALIDADES, {
  error: `Debe ser exactamente uno de: ${ESPECIALIDADES.map((e) => `"${e}"`).join(', ')} (respetando mayúsculas y tildes)`,
});
