import 'dotenv/config';

interface EnvConfig {
  port: number;
  turnosDataPath: string;
  medicosDataPath: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT ?? 3000),
  turnosDataPath: required('TURNOS_DATA_PATH'),
  medicosDataPath: process.env.MEDICOS_DATA_PATH ?? './data/medicos.json',
};
