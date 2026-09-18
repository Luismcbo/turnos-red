import type { TurnoCrudo } from '../models/turno.model.js';

type CampoTurnoCrudo = Omit<TurnoCrudo, 'id'>;

const CAMPOS_REQUERIDOS: (keyof CampoTurnoCrudo)[] = [
  'paciente',
  'documento',
  'especialidad',
  'fecha',
  'hora',
  'confirmado',
];

function esStringOrNumber(valor: unknown): valor is string | number {
  return typeof valor === 'string' || typeof valor === 'number';
}

function esStringOrBoolean(valor: unknown): valor is string | boolean {
  return typeof valor === 'string' || typeof valor === 'boolean';
}

/**
 * Valida la forma minima de un body de creacion (POST /turnos): que sea un
 * objeto con todos los campos requeridos presentes y de un tipo aceptable.
 * No normaliza valores (eso lo hace normalizarCamposTurno); solo garantiza
 * que sea seguro pasarlo a esa funcion.
 */
export function validarBodyCreacion(body: unknown): { datos?: CampoTurnoCrudo; error?: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { error: 'El cuerpo de la peticion debe ser un objeto JSON' };
  }

  const registro = body as Record<string, unknown>;

  for (const campo of CAMPOS_REQUERIDOS) {
    if (!(campo in registro) || registro[campo] === null || registro[campo] === undefined) {
      return { error: `Falta el campo requerido: ${campo}` };
    }
  }

  if (typeof registro.paciente !== 'string') {
    return { error: 'El campo "paciente" debe ser un string' };
  }
  if (!esStringOrNumber(registro.documento)) {
    return { error: 'El campo "documento" debe ser string o number' };
  }
  if (typeof registro.especialidad !== 'string') {
    return { error: 'El campo "especialidad" debe ser un string' };
  }
  if (typeof registro.fecha !== 'string') {
    return { error: 'El campo "fecha" debe ser un string (DD/MM/YYYY o YYYY-MM-DD)' };
  }
  if (typeof registro.hora !== 'string') {
    return { error: 'El campo "hora" debe ser un string (HH:mm o HH.mm)' };
  }
  if (!esStringOrBoolean(registro.confirmado)) {
    return { error: 'El campo "confirmado" debe ser boolean o string ("si"/"no")' };
  }
  if (registro.observaciones !== undefined && typeof registro.observaciones !== 'string') {
    return { error: 'El campo "observaciones" debe ser un string' };
  }

  return {
    datos: {
      paciente: registro.paciente,
      documento: registro.documento as string | number,
      especialidad: registro.especialidad,
      fecha: registro.fecha,
      hora: registro.hora,
      confirmado: registro.confirmado as string | boolean,
      observaciones: registro.observaciones as string | undefined,
    },
  };
}

/**
 * Valida la forma minima de un body de actualizacion (PUT /turnos/:id):
 * un objeto donde cada campo presente tenga un tipo aceptable (todos opcionales).
 */
export function validarBodyActualizacion(body: unknown): {
  datos?: Partial<CampoTurnoCrudo>;
  error?: string;
} {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { error: 'El cuerpo de la peticion debe ser un objeto JSON' };
  }

  const registro = body as Record<string, unknown>;

  if (Object.keys(registro).length === 0) {
    return { error: 'El cuerpo de la peticion no puede estar vacio' };
  }

  const datos: Partial<CampoTurnoCrudo> = {};

  if ('paciente' in registro) {
    if (typeof registro.paciente !== 'string') {
      return { error: 'El campo "paciente" debe ser un string' };
    }
    datos.paciente = registro.paciente;
  }
  if ('documento' in registro) {
    if (!esStringOrNumber(registro.documento)) {
      return { error: 'El campo "documento" debe ser string o number' };
    }
    datos.documento = registro.documento;
  }
  if ('especialidad' in registro) {
    if (typeof registro.especialidad !== 'string') {
      return { error: 'El campo "especialidad" debe ser un string' };
    }
    datos.especialidad = registro.especialidad;
  }
  if ('fecha' in registro) {
    if (typeof registro.fecha !== 'string') {
      return { error: 'El campo "fecha" debe ser un string (DD/MM/YYYY o YYYY-MM-DD)' };
    }
    datos.fecha = registro.fecha;
  }
  if ('hora' in registro) {
    if (typeof registro.hora !== 'string') {
      return { error: 'El campo "hora" debe ser un string (HH:mm o HH.mm)' };
    }
    datos.hora = registro.hora;
  }
  if ('confirmado' in registro) {
    if (!esStringOrBoolean(registro.confirmado)) {
      return { error: 'El campo "confirmado" debe ser boolean o string ("si"/"no")' };
    }
    datos.confirmado = registro.confirmado;
  }
  if ('observaciones' in registro) {
    if (typeof registro.observaciones !== 'string') {
      return { error: 'El campo "observaciones" debe ser un string' };
    }
    datos.observaciones = registro.observaciones;
  }

  return { datos };
}
