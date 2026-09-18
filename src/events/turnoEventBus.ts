import { EventEmitter } from 'node:events';
import type { Turno } from '../models/turno.model.js';

export interface TurnoEventos {
  'turno:creado': (turno: Turno) => void;
  'turno:actualizado': (turno: Turno) => void;
  'turno:eliminado': (turno: Turno) => void;
}

/** Bus de eventos interno de la aplicacion (EventEmitter nativo de Node). */
class TurnoEventBus extends EventEmitter {
  emit<K extends keyof TurnoEventos>(evento: K, ...args: Parameters<TurnoEventos[K]>): boolean {
    return super.emit(evento, ...args);
  }

  on<K extends keyof TurnoEventos>(evento: K, listener: TurnoEventos[K]): this {
    return super.on(evento, listener);
  }
}

/** Instancia singleton compartida por servicios (emisores) y Socket.IO (oyente). */
export const turnoEventBus = new TurnoEventBus();
