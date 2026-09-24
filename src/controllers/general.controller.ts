import type { Request, Response } from 'express';
import { toErrorBody } from '../utils/httpErrors.js';

/** GET / — endpoint de bienvenida. */
export const hello = async (_req: Request, res: Response) => {
  let status = 200;
  try {
    return res.status(status).json({ message: 'Hello World - API de TurnosRed' });
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

/**
 * Middleware de ruta no encontrada (404). Se registra con app.use(...) al FINAL de la
 * cadena de rutas: solo se ejecuta si ninguna ruta anterior respondio la peticion.
 */
export const notFound = async (req: Request, res: Response) => {
  const status = 404;
  try {
    throw new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  } catch (error) {
    return res.status(status).json(toErrorBody(status, error));
  }
};
