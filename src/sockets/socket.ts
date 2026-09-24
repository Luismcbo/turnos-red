import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { eventBus } from '../events/eventBus.js';

/**
 * Conecta Socket.IO al servidor HTTP de Express y lo suscribe al bus de
 * eventos interno (EventEmitter). Cada operacion exitosa sobre turnos se
 * retransmite en tiempo real a todos los clientes conectados, sin polling.
 */
export function setupSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`[socket.io] Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[socket.io] Cliente desconectado: ${socket.id}`);
    });
  });

  eventBus.on('turno:creado', (turno) => {
    io.emit('turno:nuevo', turno);
  });

  eventBus.on('turno:actualizado', (turno) => {
    io.emit('turno:actualizado', turno);
  });

  eventBus.on('turno:eliminado', (turno) => {
    io.emit('turno:eliminado', turno);
  });

  return io;
}
