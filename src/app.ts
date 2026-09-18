import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import turnoRoutes from './routes/turno.routes.js';
import { manejadorDeErrores, rutaNoEncontrada } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

export function crearApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDir));

  app.use('/turnos', turnoRoutes);

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
