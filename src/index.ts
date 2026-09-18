import { createServer } from 'node:http';
import { crearApp } from './app.js';
import { env } from './config/env.js';
import { configurarSocket } from './sockets/socket.js';
import { inicializarTurnos } from './services/turno.service.js';

async function main(): Promise<void> {
  await inicializarTurnos();

  const app = crearApp();
  const httpServer = createServer(app);
  configurarSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] TurnosRed escuchando en http://localhost:${env.port}`);
    console.log(`[server] Cliente de prueba Socket.IO en http://localhost:${env.port}/`);
  });
}

main().catch((error) => {
  console.error('[server] Error fatal al iniciar la aplicacion:', error);
  process.exit(1);
});
