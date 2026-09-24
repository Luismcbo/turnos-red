import { ErrorCode, type ApiErrorBody, type ErrorDetail } from '../errors/AppError.js';

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  404: ErrorCode.NOT_FOUND,
  500: ErrorCode.INTERNAL_ERROR,
};

/**
 * Arma el cuerpo de error estandar { status, message, code, details } a partir del error
 * capturado en el `catch` de un controller y del status que ese controller fue calculando.
 * - status 4xx: error "customizado" (throw new Error(...)): se expone su mensaje.
 * - status 5xx: fallo inesperado: se registra en el log y NO se filtra el detalle interno.
 */
export const toErrorBody = (
  status: number,
  error: unknown,
  details: ErrorDetail[] = [],
): ApiErrorBody => {
  if (status >= 500) {
    console.error('[error]', error);
    return {
      status,
      message: 'Error interno del servidor',
      code: ErrorCode.INTERNAL_ERROR,
      details: [],
    };
  }

  return {
    status,
    message: error instanceof Error ? error.message : String(error),
    code: CODE_BY_STATUS[status] ?? ErrorCode.VALIDATION_ERROR,
    details,
  };
};
