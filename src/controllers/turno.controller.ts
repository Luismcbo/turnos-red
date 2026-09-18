import type { NextFunction, Request, Response } from 'express';
import * as turnoService from '../services/turno.service.js';
import { normalizarCamposTurno } from '../utils/normalizarTurno.js';
import { validarBodyActualizacion, validarBodyCreacion } from '../utils/validarTurnoBody.js';

function parseIdParam(idParam: string): number | null {
  if (!/^\d+$/.test(idParam)) return null;
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function listarTurnos(_req: Request, res: Response, next: NextFunction): void {
  try {
    const turnos = turnoService.listarTurnos();
    res.status(200).json(turnos);
  } catch (error) {
    next(error);
  }
}

export function obtenerTurno(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'El id debe ser un entero positivo' });
      return;
    }

    const turno = turnoService.buscarTurnoPorId(id);
    if (!turno) {
      res.status(404).json({ error: `No existe un turno con id ${id}` });
      return;
    }

    res.status(200).json(turno);
  } catch (error) {
    next(error);
  }
}

export function crearTurno(req: Request, res: Response, next: NextFunction): void {
  try {
    const { datos: bodyValido, error: errorBody } = validarBodyCreacion(req.body);
    if (errorBody || !bodyValido) {
      res.status(400).json({ error: errorBody });
      return;
    }

    const datosNormalizados = normalizarCamposTurno(bodyValido);
    if (!datosNormalizados) {
      res.status(400).json({
        error:
          'No se pudo normalizar el turno: revisar formato de fecha (DD/MM/YYYY o YYYY-MM-DD), ' +
          'hora (HH:mm o HH.mm) y confirmado (boolean o "si"/"no")',
      });
      return;
    }

    const turnoCreado = turnoService.crearTurno(datosNormalizados);
    res.status(201).json(turnoCreado);
  } catch (error) {
    next(error);
  }
}

export function actualizarTurno(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'El id debe ser un entero positivo' });
      return;
    }

    const turnoExistente = turnoService.buscarTurnoPorId(id);
    if (!turnoExistente) {
      res.status(404).json({ error: `No existe un turno con id ${id}` });
      return;
    }

    const { datos: cambios, error: errorBody } = validarBodyActualizacion(req.body);
    if (errorBody || !cambios) {
      res.status(400).json({ error: errorBody });
      return;
    }

    const datosNormalizados = normalizarCamposTurno({ ...turnoExistente, ...cambios });
    if (!datosNormalizados) {
      res.status(400).json({
        error:
          'No se pudo normalizar el turno: revisar formato de fecha (DD/MM/YYYY o YYYY-MM-DD), ' +
          'hora (HH:mm o HH.mm) y confirmado (boolean o "si"/"no")',
      });
      return;
    }

    const turnoActualizado = turnoService.actualizarTurno(id, datosNormalizados);
    res.status(200).json(turnoActualizado);
  } catch (error) {
    next(error);
  }
}

export function eliminarTurno(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'El id debe ser un entero positivo' });
      return;
    }

    const turnoEliminado = turnoService.eliminarTurno(id);
    if (!turnoEliminado) {
      res.status(404).json({ error: `No existe un turno con id ${id}` });
      return;
    }

    res.status(200).json(turnoEliminado);
  } catch (error) {
    next(error);
  }
}
