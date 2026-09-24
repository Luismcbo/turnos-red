import type { Request, Response } from 'express';
import * as profesionalesService from '../services/profesionales.service.js';
import { toErrorBody } from '../utils/httpErrors.js';

export const getAll = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const { especialidadId, activo } = req.query;
    const profesionales = await profesionalesService.findAll({
      especialidadId: especialidadId === undefined ? undefined : Number(especialidadId),
      activo: activo === undefined ? undefined : activo === 'true',
    });

    return res.status(status).json(profesionales);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const getById = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const profesional = await profesionalesService.findById(Number(req.params.id));
    if (!profesional) {
      status = 404;
      throw new Error(`No existe un profesional con id ${req.params.id}`);
    }

    return res.status(status).json(profesional);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const create = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const nuevo = await profesionalesService.create(req.body);

    status = 201;
    return res.status(status).json(nuevo);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const update = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const actualizado = await profesionalesService.update(Number(req.params.id), req.body);
    if (!actualizado) {
      status = 404;
      throw new Error(`No existe un profesional con id ${req.params.id}`);
    }

    return res.status(status).json(actualizado);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const remove = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const eliminado = await profesionalesService.remove(Number(req.params.id));
    if (!eliminado) {
      status = 404;
      throw new Error(`No existe un profesional con id ${req.params.id}`);
    }

    status = 204;
    return res.status(status).json(null);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};
