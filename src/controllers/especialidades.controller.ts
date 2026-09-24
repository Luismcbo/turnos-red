import type { Request, Response } from 'express';
import type { ErrorDetail } from '../errors/AppError.js';
import * as especialidadesService from '../services/especialidades.service.js';
import * as profesionalesService from '../services/profesionales.service.js';
import { toErrorBody } from '../utils/httpErrors.js';
import { problem, summary, validateIdParam } from '../validators/common.validator.js';
import {
  validateEspecialidadBody,
  validateEspecialidadQuery,
} from '../validators/especialidades.validator.js';

const nombreDuplicado = (nombre: string): ErrorDetail =>
  problem('body', 'nombre', `Ya existe una especialidad llamada "${nombre}"`);

export const getAll = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const query = validateEspecialidadQuery(req.query);
    if (!query.data) {
      status = 400;
      details = query.problems;
      throw new Error(summary('Los filtros enviados no son válidos', details));
    }

    const especialidades = await especialidadesService.findAll(query.data);

    return res.status(status).json(especialidades);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};

export const getById = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const id = validateIdParam(req.params.id);
    if (id.data === undefined) {
      status = 400;
      details = id.problems;
      throw new Error('El id de la especialidad debe ser un entero positivo');
    }

    const especialidad = await especialidadesService.findById(id.data);
    if (!especialidad) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${id.data}`);
    }

    return res.status(status).json(especialidad);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};

export const create = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const body = validateEspecialidadBody(req.body, 'create');
    if (!body.data) {
      status = 400;
      details = body.problems;
      throw new Error(summary('Los datos de la especialidad no son válidos', details));
    }

    if (await especialidadesService.findByNombre(body.data.nombre)) {
      status = 400;
      details = [nombreDuplicado(body.data.nombre)];
      throw new Error('Ya existe una especialidad con ese nombre');
    }

    const nueva = await especialidadesService.create(body.data);

    status = 201;
    return res.status(status).json(nueva);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};

export const update = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const id = validateIdParam(req.params.id);
    if (id.data === undefined) {
      status = 400;
      details = id.problems;
      throw new Error('El id de la especialidad debe ser un entero positivo');
    }

    const body = validateEspecialidadBody(req.body, 'update');
    if (!body.data) {
      status = 400;
      details = body.problems;
      throw new Error(summary('Los datos de la especialidad no son válidos', details));
    }

    if (!(await especialidadesService.findById(id.data))) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${id.data}`);
    }

    if (body.data.nombre !== undefined) {
      const mismoNombre = await especialidadesService.findByNombre(body.data.nombre);
      if (mismoNombre && mismoNombre.id !== id.data) {
        status = 400;
        details = [nombreDuplicado(body.data.nombre)];
        throw new Error('Ya existe una especialidad con ese nombre');
      }
    }

    const actualizada = await especialidadesService.update(id.data, body.data);

    return res.status(status).json(actualizada);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};

export const remove = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const id = validateIdParam(req.params.id);
    if (id.data === undefined) {
      status = 400;
      details = id.problems;
      throw new Error('El id de la especialidad debe ser un entero positivo');
    }

    if (!(await especialidadesService.findById(id.data))) {
      status = 404;
      throw new Error(`No existe una especialidad con id ${id.data}`);
    }

    const asociados = await profesionalesService.countByEspecialidad(id.data);
    if (asociados > 0) {
      status = 400;
      details = [problem('params', 'id', `Tiene ${asociados} profesional(es) asociado(s)`)];
      throw new Error('No se puede eliminar una especialidad con profesionales asociados');
    }

    await especialidadesService.remove(id.data);

    status = 204;
    return res.status(status).json(null);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};
