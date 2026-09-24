import type { RequestHandler, Response } from 'express';
import { z, type ZodType } from 'zod';

export const REQUEST_SOURCES = ['params', 'query', 'body'] as const;
export type RequestSource = (typeof REQUEST_SOURCES)[number];

export type ValidationSchemas = Partial<Record<RequestSource, ZodType>>;

/**
 * Valida params / query / body con Zod ANTES de llegar al controlador.
 * - Si todo es valido, deja los datos ya parseados/transformados en res.locals.validated
 *   (el controlador los lee con `validated()`).
 * - Si algo falla, lanza el ZodError con cada path prefijado por su origen ("body.fecha")
 *   y lo delega en next(); lo transforma zodErrorHandler al formato estandar de error.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    const parsed: Partial<Record<RequestSource, unknown>> = {};
    const issues: z.core.$ZodIssue[] = [];

    for (const source of REQUEST_SOURCES) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (result.success) {
        parsed[source] = result.data;
      } else {
        issues.push(
          ...result.error.issues.map((issue) => ({ ...issue, path: [source, ...issue.path] })),
        );
      }
    }

    if (issues.length > 0) {
      next(new z.ZodError(issues));
      return;
    }

    res.locals.validated = parsed;
    next();
  };
}

/** Lee del resultado de validate() los datos ya validados de un origen. */
export function validated<T>(res: Response, source: RequestSource): T {
  return (res.locals.validated as Partial<Record<RequestSource, unknown>>)[source] as T;
}
