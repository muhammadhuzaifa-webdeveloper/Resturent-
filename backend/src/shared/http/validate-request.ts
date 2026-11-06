import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error';

function validatePart(part: 'params' | 'query', schema: ZodType): RequestHandler {
  return (request: Request, _response, next) => {
    const result = schema.safeParse(request[part]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
      next(new AppError('Request validation failed', 422, 'VALIDATION_ERROR', details));
      return;
    }
    (request as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
}

export const validateParams = (schema: ZodType) => validatePart('params', schema);
export const validateQuery = (schema: ZodType) => validatePart('query', schema);
