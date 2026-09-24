import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import './config/zod.js';
import * as generalController from './controllers/general.controller.js';
import { errorHandler } from './middlewares/errorHandler.js';
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
  app.get('/', generalController.hello);
  app.use('/socket-client', express.static(publicDir));

  app.use('/turnos', turnoRoutes);
  app.use('/medicos', medicoRoutes);
  app.use('/especialidades', especialidadesRoutes);
  app.use('/profesionales', profesionalesRoutes);

  // Final de la cadena: 404 (controller general) -> ZodError -> errores restantes.
  app.use(generalController.notFound);
  app.use(zodErrorHandler);
  app.use(errorHandler);

  return app;
}
