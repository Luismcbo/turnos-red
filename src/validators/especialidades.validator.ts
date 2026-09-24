import type { ErrorDetail } from '../errors/AppError.js';
import type {
  CreateEspecialidadInput,
  EspecialidadFilters,
  UpdateEspecialidadInput,
} from '../services/especialidades.service.js';
import {
  bodyMustBeObject,
  checkNotEmpty,
  checkText,
  checkUnknownKeys,
  isPlainObject,
  queryText,
  type Validation,
} from './common.validator.js';

const FIELDS = ['nombre', 'descripcion'] as const;

/** Body de POST (mode "create": nombre obligatorio) y de PUT (mode "update": al menos un campo). */
export const validateEspecialidadBody = (
  body: unknown,
  mode: 'create' | 'update',
): Validation<CreateEspecialidadInput & UpdateEspecialidadInput> => {
  if (!isPlainObject(body)) return { problems: [bodyMustBeObject()] };

  const problems: ErrorDetail[] = [];
  checkUnknownKeys(body, FIELDS, problems);
  if (mode === 'update') checkNotEmpty(body, problems);

  const nombre = checkText(body, 'nombre', problems, {
    required: mode === 'create',
    maxLength: 60,
  });
  const descripcion = checkText(body, 'descripcion', problems, { required: false, maxLength: 200 });

  if (problems.length > 0) return { problems };
  return {
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
    } as CreateEspecialidadInput & UpdateEspecialidadInput,
    problems,
  };
};

/** Filtros de GET /especialidades: ?nombre=texto */
export const validateEspecialidadQuery = (query: unknown): Validation<EspecialidadFilters> => {
  const problems: ErrorDetail[] = [];
  const source = isPlainObject(query) ? query : {};
  const nombre = queryText(source, 'nombre', problems);

  if (problems.length > 0) return { problems };
  return { data: { nombre }, problems };
};
