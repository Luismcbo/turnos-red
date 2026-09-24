import { z } from 'zod';
import {
  normalizeConfirmado,
  normalizeFecha,
  normalizeHora,
  normalizePaciente,
} from '../utils/normalizers.js';
import { especialidadSchema } from './common.schema.js';

const pacienteSchema = z
  .string()
  .trim()
  .min(1, 'No puede estar vacío')
  .transform(normalizePaciente);

/** documento: string de formato libre ("31654210", "31.654.210", "DNI 31654210"...). */
const documentoSchema = z.string().trim().min(1, 'No puede estar vacío').max(30);

/** Acepta "DD/MM/YYYY" o "YYYY-MM-DD" y siempre entrega "YYYY-MM-DD". */
const fechaSchema = z
  .string()
  .refine((value) => normalizeFecha(value) !== null, {
    error: 'Fecha inválida. Use DD/MM/YYYY o YYYY-MM-DD y una fecha real del calendario',
  })
  .transform((value) => normalizeFecha(value) as string);

/** Acepta "HH:mm" o "HH.mm" y siempre entrega "HH:mm". */
const horaSchema = z
  .string()
  .refine((value) => normalizeHora(value) !== null, {
    error: 'Hora inválida. Use HH:mm o HH.mm (00:00 a 23:59)',
  })
  .transform((value) => normalizeHora(value) as string);

/** Acepta true/false o "si"/"no" y siempre entrega boolean. */
const confirmadoSchema = z
  .custom<boolean | string>(
    (value) =>
      typeof value === 'boolean' ||
      (typeof value === 'string' && normalizeConfirmado(value) !== null),
    { error: 'Debe ser booleano (true/false) o "si"/"no"' },
  )
  .transform((value) =>
    typeof value === 'boolean' ? value : (normalizeConfirmado(value) as boolean),
  );

const observacionesSchema = z.string().trim().max(500);

/** Cuerpo de POST /turnos. Campos desconocidos se rechazan (evita typos silenciosos). */
export const createTurnoSchema = z.strictObject({
  paciente: pacienteSchema,
  documento: documentoSchema,
  especialidad: especialidadSchema,
  fecha: fechaSchema,
  hora: horaSchema,
  confirmado: confirmadoSchema.default(false),
  observaciones: observacionesSchema.optional(),
});

/** Cuerpo de PUT /turnos/:id: actualiza los campos enviados (al menos uno). */
export const updateTurnoSchema = z
  .strictObject({
    paciente: pacienteSchema,
    documento: documentoSchema,
    especialidad: especialidadSchema,
    fecha: fechaSchema,
    hora: horaSchema,
    confirmado: confirmadoSchema,
    observaciones: observacionesSchema,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    error: 'Debe enviar al menos un campo para actualizar',
  });

export type CreateTurnoBody = z.output<typeof createTurnoSchema>;
export type UpdateTurnoBody = z.output<typeof updateTurnoSchema>;
