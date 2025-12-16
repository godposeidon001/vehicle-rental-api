import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError'

export function errorHandler(
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = (err as ApiError).statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    message,
    errors: (err as ApiError).errors || message,
  })
}
