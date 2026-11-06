import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../logger';

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [{ code: 'ROUTE_NOT_FOUND' }],
    requestId: request.requestId,
  });
};

// express.json() ke errors (galat JSON, bohat bara body) ko 500 ki bajaye sahi 4xx dena
function toAppError(error: unknown): AppError | undefined {
  if (error instanceof AppError) return error;
  if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.parse.failed') return new AppError('Request body is not valid JSON', 400, 'INVALID_JSON');
    if (error.type === 'entity.too.large') return new AppError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  }
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (error: unknown, request, response, _next) => {
  const knownError = toAppError(error);
  const statusCode = knownError?.statusCode ?? 500;
  const code = knownError?.code ?? 'INTERNAL_SERVER_ERROR';
  const message = knownError?.message ?? 'An unexpected error occurred';

  if (statusCode >= 500) {
    logger.error({ err: error, requestId: request.requestId }, 'Request failed');
  } else {
    logger.warn({ err: error, requestId: request.requestId, statusCode }, 'Request rejected');
  }

  response.status(statusCode).json({
    success: false,
    message,
    errors: [{ code, ...(knownError?.details ? { details: knownError.details } : {}) }],
    requestId: request.requestId,
  });
};
