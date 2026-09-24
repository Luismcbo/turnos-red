import type { Request, Response } from 'express';
import type { ErrorDetail } from '../errors/AppError.js';
import * as especialidadesService from '../services/especialidades.service.js';
import * as profesionalesService from '../services/profesionales.service.js';
import { toErrorBody } from '../utils/httpErrors.js';
import { problem, summary, validateIdParam } from '../validators/common.validator.js';
import {
  validateProfesionalBody,
  validateProfesionalQuery,
} from '../validators/profesionales.validator.js';

const ID_ERROR = 'El id del profesional debe ser un entero positivo';
const BODY_ERROR = 'Los datos del profesional no son válidos';

export const getAll = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const query = validateProfesionalQuery(req.query);
    if (!query.data) {
      status = 400;
      details = query.problems;
      throw new Error(summary('Los filtros enviados no son válidos', details));
    }

    const profesionales = await profesionalesService.findAll(query.data);

    return res.status(status).json(profesionales);
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
      throw new Error(ID_ERROR);
    }

    const profesional = await profesionalesService.findById(id.data);
    if (!profesional) {
      status = 404;
      throw new Error(`No existe un profesional con id ${id.data}`);
    }

    return res.status(status).json(profesional);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};

export const create = async (req: Request, res: Response) => {
  let status = 200;
  let details: ErrorDetail[] = [];
  try {
    const body = validateProfesionalBody(req.body, 'create');
    if (!body.data) {
      status = 400;
      details = body.problems;
      throw new Error(summary(BODY_ERROR, details));
    }

    if (!(await especialidadesService.findById(body.data.especialidadId))) {
      status = 400;
      details = [
        problem(
          'body',
          'especialidadId',
          `No existe una especialidad con id ${body.data.especialidadId}`,
        ),
      ];
      throw new Error('La especialidad indicada no existe');
    }

    if (await profesionalesService.findByMatricula(body.data.matricula)) {
      status = 400;
      details = [
        problem('body', 'matricula', `La matrícula "${body.data.matricula}" ya está registrada`),
      ];
      throw new Error('Ya existe un profesional con esa matrícula');
    }

    const nuevo = await profesionalesService.create(body.data);

    status = 201;
    return res.status(status).json(nuevo);
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
      throw new Error(ID_ERROR);
    }

    const body = validateProfesionalBody(req.body, 'update');
    if (!body.data) {
      status = 400;
      details = body.problems;
      throw new Error(summary(BODY_ERROR, details));
    }

    if (!(await profesionalesService.findById(id.data))) {
      status = 404;
      throw new Error(`No existe un profesional con id ${id.data}`);
    }

    if (
      body.data.especialidadId !== undefined &&
      !(await especialidadesService.findById(body.data.especialidadId))
    ) {
      status = 400;
      details = [
        problem(
          'body',
          'especialidadId',
          `No existe una especialidad con id ${body.data.especialidadId}`,
        ),
      ];
      throw new Error('La especialidad indicada no existe');
    }

    if (body.data.matricula !== undefined) {
      const mismaMatricula = await profesionalesService.findByMatricula(body.data.matricula);
      if (mismaMatricula && mismaMatricula.id !== id.data) {
        status = 400;
        details = [
          problem('body', 'matricula', `La matrícula "${body.data.matricula}" ya está registrada`),
        ];
        throw new Error('Ya existe un profesional con esa matrícula');
      }
    }

    const actualizado = await profesionalesService.update(id.data, body.data);

    return res.status(status).json(actualizado);
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
      throw new Error(ID_ERROR);
    }

    if (!(await profesionalesService.findById(id.data))) {
      status = 404;
      throw new Error(`No existe un profesional con id ${id.data}`);
    }

    await profesionalesService.remove(id.data);

    status = 204;
    return res.status(status).json(null);
  } catch (error) {
    if (status < 400) status = 500;
    return res.status(status).json(toErrorBody(status, error, details));
  }
};
