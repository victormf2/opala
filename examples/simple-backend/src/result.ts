import { z } from 'zod'

export type Result<Value, ErrorType extends string> =
  | ResultSuccess<Value>
  | ResultError<ErrorType>

export class ResultSuccess<Value> {
  readonly success = true
  constructor(readonly value: Value) {}
}

interface ResultErrorParams<ErrorType extends string> {
  type: ErrorType
  message?: string
  details?: unknown
  status?: number
}
export class ResultError<ErrorType extends string = string> extends Error {
  readonly success = false
  readonly type: ErrorType
  readonly status: number
  readonly message: string
  readonly details?: unknown
  constructor({
    type,
    status = 500,
    message = type,
    details,
  }: ResultErrorParams<ErrorType>) {
    super(message)
    this.type = type
    this.message = message
    this.status = status
    this.details = details
  }
}

export function resultSuccess<Value>(value: Value) {
  return new ResultSuccess(value)
}

export function resultError<const ErrorType extends string>(
  type: ErrorType,
  params: Omit<ResultErrorParams<ErrorType>, 'type'> = {},
) {
  return new ResultError({
    type,
    ...params,
  })
}

const ResultErrorSchema = z.object({
  success: z.literal(false),
  type: z.string(),
  status: z.number(),
  message: z.string(),
  details: z.unknown().optional(),
})
export function zodResult<ValueSchema extends z.ZodTypeAny>(
  valueSchema: ValueSchema,
) {
  return z
    .object({
      success: z.literal(true),
      value: valueSchema,
    })
    .or(ResultErrorSchema)
}
