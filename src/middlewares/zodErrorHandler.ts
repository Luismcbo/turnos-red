import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorDetail } from '../errors/AppError.js';
import { REQUEST_SOURCES, type RequestSource } from './validate.js';

function isRequestSource(value: unknown): value is RequestSource {
  return typeof value === 'string' && (REQUEST_SOURCES as readonly string[]).includes(value);
}

/** Traduce cada issue de Zod a un detalle { location, field, message }. */
function toDetails(error: ZodError): ErrorDetail[] {
  return error.issues.flatMap((issue) => {
    const [first, ...rest] = issue.path;
    const location = isRequestSource(first) ? first : undefined;
    const path = (location ? rest : issue.path).map(String);

    // Un campo no permitido llega con path del objeto y las claves en "keys".
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({
        ...(location && { location }),
        field: [...path, key].join('.'),
        message: 'Campo no permitido',
      }));
    }

    return [
      {
        ...(location && { location }),
        field: path.length > 0 ? path.join('.') : '(root)',
        message: issue.message,
      },
    ];
  });
}

/**
 * Intercepta los ZodError y los convierte en el error estandar 400 VALIDATION_ERROR,
 * con "details" indicando exactamente que campo fallo y por que. Cualquier otro
 * error pasa sin tocar al errorHandler final.
 */
export function zodErrorHandler(
  error: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!(error instanceof ZodError)) {
    next(error);
    return;
  }

  const details = toDetails(error);
  const count = details.length;
  next(
    AppError.validation(
      `La peticion contiene datos invalidos (${count} ${count === 1 ? 'error' : 'errores'})`,
      details,
    ),
  );
}
