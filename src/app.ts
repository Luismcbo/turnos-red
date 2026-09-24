import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import './config/zod.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { zodErrorHandler } from './middlewares/zodErrorHandler.js';
import turnoRoutes from './routes/turno.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDir));

  app.use('/turnos', turnoRoutes);

  // Cadena de errores (siempre al final): 404 -> ZodError -> formato estandar.
  app.use(notFoundHandler);
  app.use(zodErrorHandler);
  app.use(errorHandler);

  return app;
}
