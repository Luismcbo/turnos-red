import type { NextFunction, Request, Response } from 'express';

export function rutaNoEncontrada(req: Request, res: Response): void {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// El cuarto parametro (_next) es requerido por Express para reconocer esto
// como middleware de manejo de errores, aunque no se use.
export function manejadorDeErrores(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const mensaje = error instanceof Error ? error.message : 'Error interno del servidor';
  console.error('[error]', mensaje);
  res.status(500).json({ error: 'Error interno del servidor' });
}
