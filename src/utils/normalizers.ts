import { ESPECIALIDADES, type Especialidad } from '../models/especialidad.js';
import type { TurnoCrudo, Turno, CreateTurnoInput } from '../models/turno.model.js';

const DATE_DDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_DOT = /^([01]\d|2[0-3])\.([0-5]\d)$/;

const CONFIRMED_TRUE = new Set(['si', 'sí', 'true', '1', 'yes']);
const CONFIRMED_FALSE = new Set(['no', 'false', '0']);

/** Convierte un id heterogeneo (string/number) a numero entero, o null si no es valido. */
export function normalizeId(rawId: string | number): number | null {
  const id = typeof rawId === 'number' ? rawId : Number(String(rawId).trim());
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

/** Convierte el documento (string/number) a string normalizado (sin espacios). */
export function normalizeDocumento(rawDocumento: string | number): string {
  return String(rawDocumento).trim();
}

/** Normaliza el nombre del paciente: recorta espacios y colapsa espacios internos. */
export function normalizePaciente(rawPaciente: string): string {
  return rawPaciente.trim().replace(/\s+/g, ' ');
}

/** Clave de comparacion: sin tildes, en minusculas y con espacios colapsados. */
export function comparisonKey(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

const ESPECIALIDAD_BY_KEY = new Map<string, Especialidad>(
  ESPECIALIDADES.map((especialidad) => [comparisonKey(especialidad), especialidad]),
);

/**
 * Traduce una especialidad escrita de forma libre ("PEDIATRÍA", "clinica medica") a su
 * grafia canonica. Solo se usa donde se tolera variacion (archivos de las sedes y filtros
 * por query params); el cuerpo de la API se valida de forma estricta con Zod.
 */
export function normalizeEspecialidad(rawEspecialidad: string): Especialidad | null {
  return ESPECIALIDAD_BY_KEY.get(comparisonKey(rawEspecialidad)) ?? null;
}

/** Verifica que la combinacion anio/mes/dia exista en el calendario (rechaza 31/02). */
function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Acepta "DD/MM/YYYY" o "YYYY-MM-DD" y devuelve siempre "YYYY-MM-DD", o null si es invalida. */
export function normalizeFecha(rawFecha: string): string | null {
  const fecha = rawFecha.trim();

  const matchDDMMYYYY = DATE_DDMMYYYY.exec(fecha);
  if (matchDDMMYYYY) {
    const [, day, month, year] = matchDDMMYYYY;
    return isRealDate(Number(year), Number(month), Number(day)) ? `${year}-${month}-${day}` : null;
  }

  if (DATE_ISO.test(fecha)) {
    const [year, month, day] = fecha.split('-').map(Number);
    return isRealDate(year, month, day) ? fecha : null;
  }

  return null;
}

/** Acepta "HH.mm" o "HH:mm" y devuelve siempre "HH:mm", o null si es invalida. */
export function normalizeHora(rawHora: string): string | null {
  const hora = rawHora.trim();

  if (TIME_HHMM.test(hora)) {
    return hora;
  }

  const matchDot = TIME_DOT.exec(hora);
  if (matchDot) {
    const [, hh, mm] = matchDot;
    return `${hh}:${mm}`;
  }

  return null;
}

/** Normaliza valores heterogeneos de "confirmado" ("si"/"no"/boolean) a boolean. */
export function normalizeConfirmado(rawConfirmado: string | boolean): boolean | null {
  if (typeof rawConfirmado === 'boolean') {
    return rawConfirmado;
  }

  const value = rawConfirmado.trim().toLowerCase();
  if (CONFIRMED_TRUE.has(value)) return true;
  if (CONFIRMED_FALSE.has(value)) return false;

  return null;
}

/**
 * Normaliza los campos de un turno (sin id): paciente, documento, especialidad,
 * fecha, hora, confirmado y observaciones opcionales.
 * Devuelve null si algun campo requerido es invalido.
 */
export function normalizeTurnoFields(raw: Omit<TurnoCrudo, 'id'>): CreateTurnoInput | null {
  const paciente = normalizePaciente(raw.paciente ?? '');
  if (paciente.length === 0) return null;

  const fecha = normalizeFecha(raw.fecha ?? '');
  if (fecha === null) return null;

  const hora = normalizeHora(raw.hora ?? '');
  if (hora === null) return null;

  const confirmado = normalizeConfirmado(raw.confirmado);
  if (confirmado === null) return null;

  const documento = normalizeDocumento(raw.documento);
  if (documento.length === 0) return null;

  const especialidad = normalizeEspecialidad(raw.especialidad ?? '');
  if (especialidad === null) return null;

  const data: CreateTurnoInput = { paciente, documento, especialidad, fecha, hora, confirmado };

  if (raw.observaciones && raw.observaciones.trim().length > 0) {
    data.observaciones = raw.observaciones.trim();
  }

  if (raw.medicoId !== undefined && raw.medicoId !== null && raw.medicoId !== '') {
    const medicoId = normalizeId(raw.medicoId);
    if (medicoId === null) return null;
    data.medicoId = medicoId;
  }

  return data;
}

/**
 * Normaliza un TurnoCrudo (con id) a Turno de dominio.
 * Devuelve null si el registro es invalido (y no debe aceptarse).
 */
export function normalizeTurno(raw: TurnoCrudo): Turno | null {
  const id = normalizeId(raw.id);
  if (id === null) return null;

  const data = normalizeTurnoFields(raw);
  if (data === null) return null;

  return { id, ...data };
}

export interface NormalizationResult {
  turnos: Turno[];
  accepted: number;
  rejected: number;
}

/** Normaliza un lote de turnos crudos, descartando los invalidos. */
export function normalizeTurnos(rawTurnos: TurnoCrudo[]): NormalizationResult {
  const turnos: Turno[] = [];
  let rejected = 0;

  for (const raw of rawTurnos) {
    const turno = normalizeTurno(raw);
    if (turno) {
      turnos.push(turno);
    } else {
      rejected++;
    }
  }

  return { turnos, accepted: turnos.length, rejected };
}
