import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { turnoEventBus } from '../events/turnoEventBus.js';

/**
 * Conecta Socket.IO al servidor HTTP de Express y lo suscribe al bus de
 * eventos interno (EventEmitter). Cada operacion exitosa sobre turnos se
 * retransmite en tiempo real a todos los clientes conectados, sin polling.
 */
export function configurarSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`[socket.io] Cliente conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[socket.io] Cliente desconectado: ${socket.id}`);
    });
  });

  turnoEventBus.on('turno:creado', (turno) => {
    io.emit('turno:nuevo', turno);
  });

  turnoEventBus.on('turno:actualizado', (turno) => {
    io.emit('turno:actualizado', turno);
  });

  turnoEventBus.on('turno:eliminado', (turno) => {
    io.emit('turno:eliminado', turno);
  });

  return io;
}
