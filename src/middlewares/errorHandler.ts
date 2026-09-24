import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';

/** Ruta inexistente: se convierte en un NOT_FOUND estandar. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

/** Convierte cualquier error conocido/desconocido en un AppError. */
function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  // body-parser (express.json) falla con SyntaxError cuando el JSON esta mal formado.
  if (error instanceof SyntaxError && 'body' in error) return AppError.invalidJson();

  return AppError.internal();
}

/**
 * Middleware de manejo de errores centralizado. Debe registrarse AL FINAL de la
 * cadena de middlewares. Toda falla de la API sale con el mismo formato:
 * { status, message, code, details }.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = toAppError(error);
  if (appError.status === 500) {
    console.error('[error]', error);
  }

  res.status(appError.status).json(appError.toBody());
}
