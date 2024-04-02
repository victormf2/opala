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

export interface ResponseConfig<
  TResponseSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  schema: TResponseSchema
  status?: number
}

interface EndpointConfig<
  TRequestConfig extends RequestConfig,
  TResponseConfig extends ResponseConfig | undefined,
> extends Pick<ZodOpenApiOperationObject, 'tags' | 'summary' | 'description'> {
  operationId: string
  request?: TRequestConfig
  response?: TResponseConfig
  handler: (
    request: EndpointRequest<TRequestConfig>,
  ) => TResponseConfig extends ResponseConfig
    ? Promise<z.input<TResponseConfig['schema']>>
    : Promise<void>
}

export type EndpointMetadata<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig = ResponseConfig,
> = Omit<EndpointConfig<TRequestConfig, TResponseConfig>, 'handler'>

interface ValidatedRequest {
  body?: unknown
  path?: unknown
  query?: unknown
}

export function endpoint<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig | undefined = undefined,
>(
  config: EndpointConfig<TRequestConfig, TResponseConfig>,
): express.RequestHandler & { config: typeof config } {
  function handler(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    const validatedRequest: ValidatedRequest = {}
    if (config.request) {
      const pathValidationResult = config.request.path?.safeParse(req.params)
      const bodyValidationResult = config.request.body?.safeParse(req.body)
      const queryValidationResult = config.request.query?.safeParse(req.query)

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
        req.app.opala
          .errorHandler?.(error, {
            endpoint: config,
            next,
            req,
            res,
          })
          .catch((innerError) => next(innerError))
        return
      }
    }

    config
      .handler(validatedRequest as EndpointRequest<TRequestConfig>)
      .then((value) => {
        req.app.opala
          .successHandler?.(value, {
            endpoint: config,
            next,
            req,
            res,
          })
          .catch((innerError) => next(innerError))
      })
      .catch((error) => {
        req.app.opala
          .errorHandler?.(error, {
            endpoint: config,
            next,
            req,
            res,
          })
          .catch((innerError) => next(innerError))
      })
  }

  handler.config = config

  return handler
}

export function e<Errors = Error>(): Errors {
  return null as unknown as Errors
}
