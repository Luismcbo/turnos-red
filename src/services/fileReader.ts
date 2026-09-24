import { readFile } from 'node:fs/promises';

/**
 * Lee y parsea un archivo JSON que contiene un arreglo, de forma asincrona
 * (async/await), usando la API basada en promesas de node:fs/promises.
 */
export async function readJsonArray<T>(filePath: string, label: string): Promise<T[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as unknown;

    if (!Array.isArray(data)) {
      throw new Error(`el archivo de ${label} no contiene un arreglo JSON valido`);
    }

    return data as T[];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`No se pudo leer el archivo de ${label} (${filePath}): ${error.message}`);
    }
    throw error;
  }
}
