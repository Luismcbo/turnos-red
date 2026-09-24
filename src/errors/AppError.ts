/** Codigos de error estables que la API expone en el campo "code". */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Detalle de un problema puntual (ej. un campo que fallo la validacion). */
export interface ErrorDetail {
  location?: 'body' | 'query' | 'params';
  field: string;
  message: string;
}

/** Formato unico de TODA respuesta de error de la API. */
export interface ApiErrorBody {
  status: number;
  message: string;
  code: ErrorCode;
  details: ErrorDetail[];
}

export class AppError extends Error {
  constructor(
    readonly status: 400 | 404 | 500,
    readonly code: ErrorCode,
    message: string,
    readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(message: string, details: ErrorDetail[] = []): AppError {
    return new AppError(400, ErrorCode.VALIDATION_ERROR, message, details);
  }

  static invalidJson(): AppError {
    return new AppError(
      400,
      ErrorCode.INVALID_JSON,
      'El cuerpo de la peticion no es un JSON valido',
    );
  }

  static notFound(message: string): AppError {
    return new AppError(404, ErrorCode.NOT_FOUND, message);
  }

  static internal(): AppError {
    return new AppError(500, ErrorCode.INTERNAL_ERROR, 'Error interno del servidor');
  }

  toBody(): ApiErrorBody {
    return { status: this.status, message: this.message, code: this.code, details: this.details };
  }
}
