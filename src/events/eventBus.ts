import { EventEmitter } from 'node:events';
import type { Medico } from '../models/medico.model.js';
import type { Turno } from '../models/turno.model.js';

export interface AppEvents {
  'turno:creado': (turno: Turno) => void;
  'turno:actualizado': (turno: Turno) => void;
  'turno:eliminado': (turno: Turno) => void;
  'medico:eliminado': (medico: Medico) => void;
}

/** Bus de eventos interno de la aplicacion (EventEmitter nativo de Node). */
class EventBus extends EventEmitter {
  emit<K extends keyof AppEvents>(event: K, ...args: Parameters<AppEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
    return super.on(event, listener);
  }
}

/**
 * Instancia singleton compartida por servicios (emisores/oyentes) y Socket.IO (oyente).
 * Desacopla los servicios entre si: turno.service escucha "medico:eliminado" sin que
 * medico.service tenga que importarlo.
 */
export const eventBus = new EventBus();
