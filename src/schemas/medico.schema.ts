import { z } from 'zod';
import { especialidadFilterSchema, especialidadSchema } from './common.schema.js';

const nameSchema = z.string().trim().min(1, 'No puede estar vacío').max(60);

const medicoFields = {
  nombre: nameSchema,
  apellido: nameSchema,
  matricula: z.string().trim().min(1, 'No puede estar vacío').max(20),
  especialidad: especialidadSchema,
  disponible: z.boolean(),
  email: z.email().max(120),
};

/** Cuerpo de POST /medicos. "disponible" vale true si no se envia. */
export const createMedicoSchema = z.strictObject({
  ...medicoFields,
  disponible: medicoFields.disponible.default(true),
  email: medicoFields.email.optional(),
});

/** Cuerpo de PUT /medicos/:id: actualiza los campos enviados (al menos uno). */
export const updateMedicoSchema = z
  .strictObject(medicoFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    error: 'Debe enviar al menos un campo para actualizar',
  });

/** Registro de medicos.json (con id), validado al arrancar. */
export const medicoRecordSchema = z.strictObject({
  id: z.number().int().positive(),
  ...createMedicoSchema.shape,
});

export type CreateMedicoBody = z.output<typeof createMedicoSchema>;
export type UpdateMedicoBody = z.output<typeof updateMedicoSchema>;

/**
 * Query params de GET /medicos (opcionales, se combinan con AND):
 *   ?especialidad=Odontologia&disponible=true
 */
export const medicoQuerySchema = z.object({
  especialidad: especialidadFilterSchema.optional(),
  disponible: z
    .enum(['true', 'false'], { error: 'Debe ser "true" o "false"' })
    .transform((value) => value === 'true')
    .optional(),
});

export type MedicoQuery = z.output<typeof medicoQuerySchema>;
