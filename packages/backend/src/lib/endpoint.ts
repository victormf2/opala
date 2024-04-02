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
  TResponseSchema extends z.ZodString | z.AnyZodObject =
    | z.ZodString
    | z.AnyZodObject,
> {
  schema: TResponseSchema
  status?: number
}

interface EndpointConfigBase<TRequestConfig extends RequestConfig>
  extends Pick<ZodOpenApiOperationObject, 'tags' | 'summary' | 'description'> {
  operationId: string
  request?: TRequestConfig
}

interface EndpointConfigWithResponse<
  TRequestConfig extends RequestConfig,
  TResponseConfig extends ResponseConfig,
> extends EndpointConfigBase<TRequestConfig> {
  response: TResponseConfig
  handler: (
    request: EndpointRequest<TRequestConfig>,
  ) => Promise<z.input<TResponseConfig['schema']>>
}

interface EndpointConfigWithoutResponse<TRequestConfig extends RequestConfig>
  extends EndpointConfigBase<TRequestConfig> {
  handler: (request: EndpointRequest<TRequestConfig>) => Promise<void>
}

interface ValidatedRequest {
  body?: unknown
  path?: unknown
  query?: unknown
}

export function endpoint<TRequestConfig extends RequestConfig = RequestConfig>(
  config: EndpointConfigWithoutResponse<TRequestConfig>,
): express.RequestHandler & { config: typeof config }
export function endpoint<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig = ResponseConfig,
>(
  config: EndpointConfigWithResponse<TRequestConfig, TResponseConfig>,
): express.RequestHandler & { config: typeof config }
export function endpoint<
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig = ResponseConfig,
>(
  config:
    | EndpointConfigWithoutResponse<TRequestConfig>
    | EndpointConfigWithResponse<TRequestConfig, TResponseConfig>,
): express.RequestHandler & { config: typeof config } {
  const handleValidatedRequest =
    'response' in config
      ? (
          validatedRequest: EndpointRequest<TRequestConfig>,
          res: express.Response,
        ) =>
          config
            .handler(validatedRequest)
            .then((result) =>
              res.status(config.response.status ?? 200).send(result),
            )
      : (
          validatedRequest: EndpointRequest<TRequestConfig>,
          res: express.Response,
        ) => config.handler(validatedRequest).then(() => res.sendStatus(204))
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
        res.status(400).send(error)
        return
      }
    }

    handleValidatedRequest(
      validatedRequest as EndpointRequest<TRequestConfig>,
      res,
    ).catch((error) => next(error))
  }

  handler.config = config

  return handler
}

export function e<Errors = Error>(): Errors {
  return null as unknown as Errors
}
