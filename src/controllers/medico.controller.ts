import type { Request, Response } from 'express';
import { validated } from '../middlewares/validate.js';
import type { IdParam } from '../schemas/common.schema.js';
import type { CreateMedicoBody, UpdateMedicoBody } from '../schemas/medico.schema.js';
import * as medicoService from '../services/medico.service.js';

export function listMedicos(_req: Request, res: Response): void {
  res.status(200).json(medicoService.listMedicos());
}

export function getMedico(_req: Request, res: Response): void {
  const { id } = validated<IdParam>(res, 'params');
  res.status(200).json(medicoService.getMedicoById(id));
}

export function createMedico(_req: Request, res: Response): void {
  const body = validated<CreateMedicoBody>(res, 'body');
  res.status(201).json(medicoService.createMedico(body));
}

export function updateMedico(_req: Request, res: Response): void {
  const { id } = validated<IdParam>(res, 'params');
  const body = validated<UpdateMedicoBody>(res, 'body');
  res.status(200).json(medicoService.updateMedico(id, body));
}

export function deleteMedico(_req: Request, res: Response): void {
  const { id } = validated<IdParam>(res, 'params');
  medicoService.deleteMedico(id);
  res.status(204).send();
}
