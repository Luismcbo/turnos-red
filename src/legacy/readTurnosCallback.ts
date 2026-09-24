/**
 * Modulo comparativo (fuera del flujo principal de la app).
 *
 * Muestra la MISMA operacion de leer turnos.json pero con la API clasica
 * de callbacks de node:fs, para contrastar contra la version async/await
 * con node:fs/promises usada en src/services/fileReader.ts.
 *
 * Diferencias clave:
 * - Con callbacks el manejo de errores se hace por parametro (error-first
 *   callback), no con try/catch: hay que chequear "if (error)" a mano.
 * - Anidar varias lecturas con callbacks lleva a "callback hell"; con
 *   async/await el codigo se lee de arriba hacia abajo.
 * - No se puede usar "await" ni retornar una promesa: todo el resultado
 *   se recibe dentro del callback.
 *
 * Correr con: npm run demo:callback
 */
import { readFile } from 'node:fs';
import { env } from '../config/env.js';
import type { TurnoCrudo } from '../models/turno.model.js';

function readTurnosWithCallback(
  rutaArchivo: string,
  callback: (error: Error | null, turnos?: TurnoCrudo[]) => void,
): void {
  readFile(rutaArchivo, 'utf-8', (error, contenido) => {
    if (error) {
      callback(new Error(`No se pudo leer el archivo de turnos: ${error.message}`));
      return;
    }

    try {
      const datos = JSON.parse(contenido) as TurnoCrudo[];
      callback(null, datos);
    } catch (parseError) {
      const mensaje = parseError instanceof Error ? parseError.message : String(parseError);
      callback(new Error(`El archivo de turnos no es JSON valido: ${mensaje}`));
    }
  });
}

readTurnosWithCallback(env.turnosDataPath, (error, turnos) => {
  if (error) {
    console.error('[callback] Error al leer turnos:', error.message);
    return;
  }

  console.log(`[callback] Se leyeron ${turnos?.length ?? 0} turnos crudos desde el archivo.`);
});
