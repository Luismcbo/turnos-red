import type { Request, Response } from 'express';
import * as especialidadesService from '../services/especialidades.service.js';
import { toErrorBody } from '../utils/httpErrors.js';

export const getAll = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const nombre = typeof req.query.nombre === 'string' ? req.query.nombre : undefined;
    const especialidades = await especialidadesService.findAll({ nombre });

    return res.status(status).json(especialidades);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const getById = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const especialidad = await especialidadesService.findById(Number(req.params.id));
    if (!especialidad) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${req.params.id}`);
    }

    return res.status(status).json(especialidad);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const create = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const nueva = await especialidadesService.create(req.body);

    status = 201;
    return res.status(status).json(nueva);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const update = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const actualizada = await especialidadesService.update(Number(req.params.id), req.body);
    if (!actualizada) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${req.params.id}`);
    }

    return res.status(status).json(actualizada);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};

export const remove = async (req: Request, res: Response) => {
  let status = 200;
  try {
    const eliminada = await especialidadesService.remove(Number(req.params.id));
    if (!eliminada) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${req.params.id}`);
    }

    status = 204;
    return res.status(status).json(null);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error));
  }
};
