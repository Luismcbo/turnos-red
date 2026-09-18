import { readFile } from 'node:fs/promises';
import type { TurnoCrudo } from '../models/turno.model.js';

/**
 * Lee y parsea el turnos.json de una sede de forma asincrona (async/await),
 * usando la API basada en promesas de node:fs/promises.
 */
export async function leerTurnosCrudos(rutaArchivo: string): Promise<TurnoCrudo[]> {
  try {
    const contenido = await readFile(rutaArchivo, 'utf-8');
    const datos = JSON.parse(contenido) as TurnoCrudo[];

    if (!Array.isArray(datos)) {
      throw new Error('El archivo de turnos no contiene un arreglo JSON valido');
    }

    return datos;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`No se pudo leer el archivo de turnos (${rutaArchivo}): ${error.message}`);
    }
    throw error;
  }
}
