import { z } from 'zod'

export interface InputValidationErrorProps {
  path?: z.ZodError
  query?: z.ZodError
  body?: z.ZodError
}
export class InputValidationError extends Error {
  readonly statusCode = 400
  readonly path?: z.ZodError
  readonly query?: z.ZodError
  readonly body?: z.ZodError
  constructor(props: InputValidationErrorProps) {
    super('Invalida input')
    this.path = props.path
    this.query = props.query
    this.body = props.body
  }
}

export class OutputValidationError extends Error {
  readonly statusCode = 500

  constructor(readonly error: z.ZodError) {
    super('Invalid output')
  }
}
