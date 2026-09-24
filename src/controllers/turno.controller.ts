import type { Request, Response } from 'express';
import { validated } from '../middlewares/validate.js';
import type { IdParam } from '../schemas/common.schema.js';
import type { CreateTurnoBody, TurnoQuery, UpdateTurnoBody } from '../schemas/turno.schema.js';
import * as turnoService from '../services/turno.service.js';

export function listTurnos(_req: Request, res: Response): void {
  const filters = validated<TurnoQuery>(res, 'query');
  res.status(200).json(turnoService.listTurnos(filters));
}

export function getTurno(_req: Request, res: Response): void {
  const { id } = validated<IdParam>(res, 'params');
  res.status(200).json(turnoService.getTurnoById(id));
}

export function createTurno(_req: Request, res: Response): void {
  const body = validated<CreateTurnoBody>(res, 'body');
  res.status(201).json(turnoService.createTurno(body));
}

export function updateTurno(_req: Request, res: Response): void {
  const { id } = validated<IdParam>(res, 'params');
  const body = validated<UpdateTurnoBody>(res, 'body');
  res.status(200).json(turnoService.updateTurno(id, body));
}

export function deleteTurno(_req: Request, res: Response): void {
  const { id } = validated<IdParam>(res, 'params');
  turnoService.deleteTurno(id);
  res.status(204).send();
}
