import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { setupSocket } from './sockets/socket.js';
import { initMedicos } from './services/medico.service.js';
import { initTurnos } from './services/turno.service.js';

async function main(): Promise<void> {
  await initMedicos();
  await initTurnos();

  const app = createApp();
  const httpServer = createServer(app);
  setupSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] TurnosRed escuchando en http://localhost:${env.port}`);
    console.log(`[server] Cliente de prueba Socket.IO en http://localhost:${env.port}/`);
  });
}

main().catch((error) => {
  console.error('[server] Error fatal al iniciar la aplicacion:', error);
  process.exit(1);
});
