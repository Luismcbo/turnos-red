import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import * as turnoService from '../services/turno.service.js';
import { normalizeTurnoFields } from '../utils/normalizers.js';
import { validarBodyActualizacion, validarBodyCreacion } from '../utils/validarTurnoBody.js';

const NORMALIZATION_ERROR =
  'No se pudo normalizar el turno: revisar formato de fecha (DD/MM/YYYY o YYYY-MM-DD), ' +
  'hora (HH:mm o HH.mm) y confirmado (boolean o "si"/"no")';

function parseIdParam(rawId: string): number {
  const id = Number(rawId);
  if (!/^\d+$/.test(rawId) || !Number.isInteger(id) || id <= 0) {
    throw AppError.validation('El id debe ser un entero positivo', [
      { location: 'params', field: 'id', message: 'Debe ser un entero positivo' },
    ]);
  }
  return id;
}

export function listTurnos(_req: Request, res: Response): void {
  res.status(200).json(turnoService.listTurnos());
}

export function getTurno(req: Request, res: Response): void {
  const id = parseIdParam(req.params.id);
  res.status(200).json(turnoService.getTurnoById(id));
}

export function createTurno(req: Request, res: Response): void {
  const { datos, error } = validarBodyCreacion(req.body);
  if (error || !datos) throw AppError.validation(error ?? 'Body invalido');

  const normalized = normalizeTurnoFields(datos);
  if (!normalized) throw AppError.validation(NORMALIZATION_ERROR);

  res.status(201).json(turnoService.createTurno(normalized));
}

export function updateTurno(req: Request, res: Response): void {
  const id = parseIdParam(req.params.id);
  const existing = turnoService.getTurnoById(id);

  const { datos: changes, error } = validarBodyActualizacion(req.body);
  if (error || !changes) throw AppError.validation(error ?? 'Body invalido');

  const normalized = normalizeTurnoFields({ ...existing, ...changes });
  if (!normalized) throw AppError.validation(NORMALIZATION_ERROR);

  res.status(200).json(turnoService.updateTurno(id, normalized));
}

export function deleteTurno(req: Request, res: Response): void {
  const id = parseIdParam(req.params.id);
  turnoService.deleteTurno(id);
  res.status(204).send();
}
