import type { TurnoCrudo, Turno, NuevoTurnoInput } from '../models/turno.model.js';

const REGEX_FECHA_DDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const REGEX_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA_HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const REGEX_HORA_PUNTO = /^([01]\d|2[0-3])\.([0-5]\d)$/;

const VALORES_CONFIRMADO_TRUE = new Set(['si', 'sí', 'true', '1', 'yes']);
const VALORES_CONFIRMADO_FALSE = new Set(['no', 'false', '0']);

/** Convierte un id heterogeneo (string/number) a numero entero, o null si no es valido. */
export function normalizarId(idCrudo: string | number): number | null {
  const id = typeof idCrudo === 'number' ? idCrudo : Number(String(idCrudo).trim());
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

/** Convierte el documento (string/number) a string normalizado (sin espacios). */
export function normalizarDocumento(documentoCrudo: string | number): string {
  return String(documentoCrudo).trim();
}

/** Normaliza el nombre del paciente: recorta espacios y colapsa espacios internos. */
export function normalizarPaciente(pacienteCrudo: string): string {
  return pacienteCrudo.trim().replace(/\s+/g, ' ');
}

/** Normaliza la especialidad a "Primera Letra Mayuscula" por palabra. */
export function normalizarEspecialidad(especialidadCrudo: string): string {
  return especialidadCrudo
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (letra) => letra.toUpperCase());
}

/** Acepta "DD/MM/YYYY" o "YYYY-MM-DD" y devuelve siempre "YYYY-MM-DD", o null si es invalida. */
export function normalizarFecha(fechaCrudo: string): string | null {
  const fecha = fechaCrudo.trim();

  const matchDDMMYYYY = REGEX_FECHA_DDMMYYYY.exec(fecha);
  if (matchDDMMYYYY) {
    const [, dia, mes, anio] = matchDDMMYYYY;
    return `${anio}-${mes}-${dia}`;
  }

  if (REGEX_FECHA_ISO.test(fecha)) {
    return fecha;
  }

  return null;
}

/** Acepta "HH.mm" o "HH:mm" y devuelve siempre "HH:mm", o null si es invalida. */
export function normalizarHora(horaCrudo: string): string | null {
  const hora = horaCrudo.trim();

  if (REGEX_HORA_HHMM.test(hora)) {
    return hora;
  }

  const matchPunto = REGEX_HORA_PUNTO.exec(hora);
  if (matchPunto) {
    const [, hh, mm] = matchPunto;
    return `${hh}:${mm}`;
  }

  return null;
}

/** Normaliza valores heterogeneos de "confirmado" ("si"/"no"/boolean) a boolean. */
export function normalizarConfirmado(confirmadoCrudo: string | boolean): boolean | null {
  if (typeof confirmadoCrudo === 'boolean') {
    return confirmadoCrudo;
  }

  const valor = confirmadoCrudo.trim().toLowerCase();
  if (VALORES_CONFIRMADO_TRUE.has(valor)) return true;
  if (VALORES_CONFIRMADO_FALSE.has(valor)) return false;

  return null;
}

/**
 * Normaliza los campos de un turno (sin id): paciente, documento, especialidad,
 * fecha, hora, confirmado y observaciones opcionales.
 * Devuelve null si algun campo requerido es invalido.
 */
export function normalizarCamposTurno(crudo: Omit<TurnoCrudo, 'id'>): NuevoTurnoInput | null {
  const paciente = normalizarPaciente(crudo.paciente ?? '');
  if (paciente.length === 0) return null;

  const fecha = normalizarFecha(crudo.fecha ?? '');
  if (fecha === null) return null;

  const hora = normalizarHora(crudo.hora ?? '');
  if (hora === null) return null;

  const confirmado = normalizarConfirmado(crudo.confirmado);
  if (confirmado === null) return null;

  const documento = normalizarDocumento(crudo.documento);
  if (documento.length === 0) return null;

  const especialidad = normalizarEspecialidad(crudo.especialidad ?? '');
  if (especialidad.length === 0) return null;

  const datos: NuevoTurnoInput = { paciente, documento, especialidad, fecha, hora, confirmado };

  if (crudo.observaciones && crudo.observaciones.trim().length > 0) {
    datos.observaciones = crudo.observaciones.trim();
  }

  return datos;
}

/**
 * Normaliza un TurnoCrudo (con id) a Turno de dominio.
 * Devuelve null si el registro es invalido (y no debe aceptarse).
 */
export function normalizarTurno(crudo: TurnoCrudo): Turno | null {
  const id = normalizarId(crudo.id);
  if (id === null) return null;

  const datos = normalizarCamposTurno(crudo);
  if (datos === null) return null;

  return { id, ...datos };
}

export interface ResultadoNormalizacion {
  turnos: Turno[];
  aceptados: number;
  rechazados: number;
}

/** Normaliza un lote de turnos crudos, descartando los invalidos. */
export function normalizarTurnos(crudos: TurnoCrudo[]): ResultadoNormalizacion {
  const turnos: Turno[] = [];
  let rechazados = 0;

  for (const crudo of crudos) {
    const turno = normalizarTurno(crudo);
    if (turno) {
      turnos.push(turno);
    } else {
      rechazados++;
    }
  }

  return { turnos, aceptados: turnos.length, rechazados };
}
