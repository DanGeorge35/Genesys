import { type NextFunction, type Request, type Response } from 'express'
import ErrorResponse from '../messages/ErrorMessage'

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction
): any => {
  let error = { ...err }

  error.message = err.message

  console.log('ERRROR', err)

  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new ErrorResponse(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new ErrorResponse(message, 400)
  }

  // Mongoose validatoin error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message)
    error = new ErrorResponse(message, 400)
  }

  const statusCode = error.statusCode ?? 500

  res.status(statusCode).json({
    success: false,
    error: err.message ?? 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  })
}

export default errorHandler
