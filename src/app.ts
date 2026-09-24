import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import './config/zod.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { zodErrorHandler } from './middlewares/zodErrorHandler.js';
import especialidadesRoutes from './routes/especialidades.routes.js';
import medicoRoutes from './routes/medico.routes.js';
import profesionalesRoutes from './routes/profesionales.routes.js';
import turnoRoutes from './routes/turno.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Bienvenida (GET /). El cliente de prueba de Socket.IO pasa a servirse en /socket-client/.
  app.get('/', (_req, res) => {
    res.json({ message: 'Hello World - API de TurnosRed' });
  });
  app.use('/socket-client', express.static(publicDir));

  app.use('/turnos', turnoRoutes);
  app.use('/medicos', medicoRoutes);
  app.use('/especialidades', especialidadesRoutes);
  app.use('/profesionales', profesionalesRoutes);

  // Cadena de errores (siempre al final): 404 -> ZodError -> formato estandar.
  app.use(notFoundHandler);
  app.use(zodErrorHandler);
  app.use(errorHandler);

  return app;
}
