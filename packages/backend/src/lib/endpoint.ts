import * as express from 'express'
import { ZodError, z } from 'zod'
import { ZodOpenApiOperationObject } from 'zod-openapi'

export type RequestConfig<
  ParamsSchema extends z.AnyZodObject = z.AnyZodObject,
  BodySchema extends z.AnyZodObject = z.AnyZodObject,
  QuerySchema extends z.AnyZodObject = z.AnyZodObject,
> = {
  path?: ParamsSchema
  body?: BodySchema
  query?: QuerySchema
}

export type EndpointRequest<
  TRequestConfig extends RequestConfig = RequestConfig,
> = {
  [K in keyof TRequestConfig as undefined extends TRequestConfig[K]
    ? never
    : K]: TRequestConfig[K] extends z.ZodTypeAny
    ? z.output<TRequestConfig[K]>
    : never
}

export type HttpStatusCode = `${1 | 2 | 3 | 4 | 5}${string}`
export function isHttpStatusCode(str: string): str is HttpStatusCode {
  return str.length === 3 && ['1', '2', '3', '4', '5'].includes(str[0])
}

type SuccessHttpStatusCode =
  | '200'
  | '201'
  | '202'
  | '203'
  | '204'
  | '205'
  | '206'
  | '207'
  | '208'
  | '226'

export type ResponseConfig = {
  [K in HttpStatusCode]?: z.ZodString | z.AnyZodObject
}

type InferResponseType<TResponseConfig, THttpStatusCode> =
  unknown extends TResponseConfig
    ? void
    : THttpStatusCode extends HttpStatusCode
    ? TResponseConfig extends ResponseConfig
      ? TResponseConfig[THttpStatusCode] extends z.ZodTypeAny
        ? {
            statusCode: THttpStatusCode
            data: z.input<TResponseConfig[THttpStatusCode]>
          }
        : never
      : never
    : never

interface EndpointConfig<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig | unknown = unknown,
> extends Pick<ZodOpenApiOperationObject, 'tags' | 'summary' | 'description'> {
  operationId: string
  request?: TRequestConfig
  response?: TResponseConfig
  handler: (
    request: EndpointRequest<TRequestConfig>,
  ) => Promise<InferResponseType<TResponseConfig, SuccessHttpStatusCode>>
}

interface ValidatedRequest {
  body?: unknown
  path?: unknown
  query?: unknown
}
export function endpoint<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig | unknown = unknown,
>(config: EndpointConfig<TRequestConfig, TResponseConfig>) {
  function handler(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    const validatedRequest: ValidatedRequest = {}
    if (config.request) {
      const pathValidationResult = config.request.path?.safeParse(req.params)
      const bodyValidationResult = config.request.body?.safeParse(req.body)
      const queryValidationResult = config.request.query?.safeParse(req.params)

      const issues: z.ZodIssue[] = []
      if (pathValidationResult) {
        if (pathValidationResult.success) {
          validatedRequest.path = pathValidationResult.data
        } else {
          issues.push(...pathValidationResult.error.issues)
        }
      }
      if (bodyValidationResult) {
        if (bodyValidationResult.success) {
          validatedRequest.body = bodyValidationResult.data
        } else {
          issues.push(...bodyValidationResult.error.issues)
        }
      }
      if (queryValidationResult) {
        if (queryValidationResult.success) {
          validatedRequest.query = queryValidationResult.data
        } else {
          issues.push(...queryValidationResult.error.issues)
        }
      }

      if (issues.length > 0) {
        const error = new ZodError(issues)
        res.status(400).send(error)
        return
      }
    }

    config
      .handler(validatedRequest as EndpointRequest<TRequestConfig>)
      .then((result) => {
        if (result) {
          res.status(Number(result.statusCode)).send(result.data)
        } else {
          res.status(204).send()
        }
      })
      .catch((error) => next(error))
  }

  handler.config = config

  return handler
}

export function e<Errors = Error>(): Errors {
  return null as unknown as Errors
}
