import type { ErrorDetail } from '../errors/AppError.js';

export type Location = NonNullable<ErrorDetail['location']>;

/** Resultado de validar un valor: los datos limpios (si todo esta bien) y los problemas hallados. */
export interface Validation<T> {
  data?: T;
  problems: ErrorDetail[];
}

export const problem = (location: Location, field: string, message: string): ErrorDetail => ({
  location,
  field,
  message,
});

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** ":id" de la ruta: entero positivo. */
export const validateIdParam = (rawId: string): Validation<number> => {
  const id = Number(rawId);
  if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) {
    return { problems: [problem('params', 'id', 'Debe ser un entero positivo')] };
  }
  return { data: id, problems: [] };
};

/** Valida un campo de texto del body. Devuelve el texto recortado o undefined si no se envio. */
export const checkText = (
  body: Record<string, unknown>,
  field: string,
  problems: ErrorDetail[],
  options: { required: boolean; maxLength: number },
): string | undefined => {
  const value = body[field];
  if (value === undefined) {
    if (options.required) problems.push(problem('body', field, 'El campo es obligatorio'));
    return undefined;
  }
  if (typeof value !== 'string') {
    problems.push(problem('body', field, 'Debe ser un texto (string)'));
    return undefined;
  }
  const text = value.trim();
  if (text.length === 0) {
    problems.push(problem('body', field, 'No puede estar vacío'));
    return undefined;
  }
  if (text.length > options.maxLength) {
    problems.push(problem('body', field, `No puede superar los ${options.maxLength} caracteres`));
    return undefined;
  }
  return text;
};

/** Rechaza campos que la entidad no conoce (evita typos silenciosos). */
export const checkUnknownKeys = (
  body: Record<string, unknown>,
  allowed: readonly string[],
  problems: ErrorDetail[],
): void => {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) problems.push(problem('body', key, 'Campo no permitido'));
  }
};

/** Cuerpo de PUT: debe traer al menos un campo. */
export const checkNotEmpty = (body: Record<string, unknown>, problems: ErrorDetail[]): void => {
  if (Object.keys(body).length === 0) {
    problems.push(problem('body', '(root)', 'Debe enviar al menos un campo para actualizar'));
  }
};

export const bodyMustBeObject = (): ErrorDetail =>
  problem('body', '(root)', 'El cuerpo debe ser un objeto JSON');

/** Texto de un query param (rechaza repetidos ?a=1&a=2 y objetos). */
export const queryText = (
  query: Record<string, unknown>,
  field: string,
  problems: ErrorDetail[],
): string | undefined => {
  const value = query[field];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    problems.push(problem('query', field, 'Debe ser un único valor de texto'));
    return undefined;
  }
  if (value.trim().length === 0) {
    problems.push(problem('query', field, 'No puede estar vacío'));
    return undefined;
  }
  return value.trim();
};

/** Mensaje resumen a partir de la cantidad de problemas. */
export const summary = (prefix: string, problems: ErrorDetail[]): string =>
  `${prefix} (${problems.length} ${problems.length === 1 ? 'error' : 'errores'})`;
