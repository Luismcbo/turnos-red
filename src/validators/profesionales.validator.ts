import type { ErrorDetail } from '../errors/AppError.js';
import type {
  CreateProfesionalInput,
  ProfesionalFilters,
  UpdateProfesionalInput,
} from '../services/profesionales.service.js';
import {
  bodyMustBeObject,
  checkNotEmpty,
  checkText,
  checkUnknownKeys,
  isPlainObject,
  problem,
  queryText,
  type Validation,
} from './common.validator.js';

const FIELDS = ['nombre', 'apellido', 'matricula', 'especialidadId', 'email', 'activo'] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Body de POST (mode "create": nombre, apellido, matricula y especialidadId obligatorios) y de PUT. */
export const validateProfesionalBody = (
  body: unknown,
  mode: 'create' | 'update',
): Validation<CreateProfesionalInput & UpdateProfesionalInput> => {
  if (!isPlainObject(body)) return { problems: [bodyMustBeObject()] };

  const problems: ErrorDetail[] = [];
  checkUnknownKeys(body, FIELDS, problems);
  if (mode === 'update') checkNotEmpty(body, problems);

  const required = mode === 'create';
  const nombre = checkText(body, 'nombre', problems, { required, maxLength: 60 });
  const apellido = checkText(body, 'apellido', problems, { required, maxLength: 60 });
  const matricula = checkText(body, 'matricula', problems, { required, maxLength: 20 });
  const email = checkText(body, 'email', problems, { required: false, maxLength: 120 });
  if (email !== undefined && !EMAIL.test(email)) {
    problems.push(problem('body', 'email', 'Debe tener formato de correo electrónico'));
  }

  let especialidadId: number | undefined;
  if (body.especialidadId === undefined) {
    if (required) problems.push(problem('body', 'especialidadId', 'El campo es obligatorio'));
  } else if (
    typeof body.especialidadId !== 'number' ||
    !Number.isInteger(body.especialidadId) ||
    body.especialidadId <= 0
  ) {
    problems.push(problem('body', 'especialidadId', 'Debe ser un número entero positivo'));
  } else {
    especialidadId = body.especialidadId;
  }

  let activo: boolean | undefined;
  if (body.activo !== undefined) {
    if (typeof body.activo === 'boolean') activo = body.activo;
    else problems.push(problem('body', 'activo', 'Debe ser booleano (true o false)'));
  }

  if (problems.length > 0) return { problems };
  return {
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(apellido !== undefined && { apellido }),
      ...(matricula !== undefined && { matricula }),
      ...(especialidadId !== undefined && { especialidadId }),
      ...(email !== undefined && { email }),
      ...(activo !== undefined && { activo }),
    } as CreateProfesionalInput & UpdateProfesionalInput,
    problems,
  };
};

/** Filtros de GET /profesionales: ?especialidadId=1&activo=true&apellido=texto */
export const validateProfesionalQuery = (query: unknown): Validation<ProfesionalFilters> => {
  const problems: ErrorDetail[] = [];
  const source = isPlainObject(query) ? query : {};

  const rawEspecialidadId = queryText(source, 'especialidadId', problems);
  let especialidadId: number | undefined;
  if (rawEspecialidadId !== undefined) {
    if (/^\d+$/.test(rawEspecialidadId) && Number(rawEspecialidadId) > 0) {
      especialidadId = Number(rawEspecialidadId);
    } else {
      problems.push(problem('query', 'especialidadId', 'Debe ser un entero positivo'));
    }
  }

  const rawActivo = queryText(source, 'activo', problems);
  let activo: boolean | undefined;
  if (rawActivo !== undefined) {
    if (rawActivo === 'true' || rawActivo === 'false') activo = rawActivo === 'true';
    else problems.push(problem('query', 'activo', 'Debe ser "true" o "false"'));
  }

  const apellido = queryText(source, 'apellido', problems);

  if (problems.length > 0) return { problems };
  return { data: { especialidadId, activo, apellido }, problems };
};
