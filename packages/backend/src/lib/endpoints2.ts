import { z } from 'zod'
import { ZodOpenApiOperationObject } from 'zod-openapi'
import { HandlerResult, RequestContext } from './context'
import {
  InputValidationError,
  InputValidationErrorProps,
  OutputValidationError,
} from './errors'

export class Endpoint<
  TContextData,
  TRequestConfig extends RequestConfig,
  TResponseConfig extends ResponseConfig,
> {
  constructor(
    readonly config: EndpointConfig<
      TContextData,
      TRequestConfig,
      TResponseConfig
    >,
  ) {}

  async handleRequest(
    context: RequestContext<TContextData>,
  ): Promise<HandlerResult> {
    const config = this.config
    const validatedRequest: ValidatedRequest = {}
    if (config.request) {
      const pathValidationResult = await config.request.path?.safeParseAsync(
        context.pathParams,
      )
      const bodyValidationResult = await config.request.body?.safeParseAsync(
        context.body,
      )
      const queryValidationResult = await config.request.query?.safeParseAsync(
        context.queryParams,
      )

      const inputValidationErrorProps: InputValidationErrorProps = {}
      let hasInputValidationError = false
      if (pathValidationResult) {
        if (pathValidationResult.success) {
          validatedRequest.path = pathValidationResult.data
        } else {
          inputValidationErrorProps.path = pathValidationResult.error
          hasInputValidationError = true
        }
      }
      if (bodyValidationResult) {
        if (bodyValidationResult.success) {
          validatedRequest.body = bodyValidationResult.data
        } else {
          inputValidationErrorProps.body = bodyValidationResult.error
          hasInputValidationError = true
        }
      }
      if (queryValidationResult) {
        if (queryValidationResult.success) {
          validatedRequest.query = queryValidationResult.data
        } else {
          inputValidationErrorProps.query = queryValidationResult.error
          hasInputValidationError = true
        }
      }

      if (hasInputValidationError) {
        throw new InputValidationError(inputValidationErrorProps)
      }
    }

    const result = await config.handler(
      validatedRequest as EndpointRequest<TRequestConfig>,
      context,
    )

    if (result == null || config.response?.schema == null) {
      return {
        value: undefined,
        statusCode: config.response?.statusCode ?? 204,
      }
    }

    const parsedResult = await config.response.schema.safeParseAsync(result)
    if (!parsedResult.success) {
      throw new OutputValidationError(parsedResult.error)
    }

    return {
      value: parsedResult.data,
      statusCode: config.response.statusCode ?? 200,
    }
  }
}

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
  schema?: TResponseSchema
  statusCode?: number
}

interface EndpointConfig<
  TContextData,
  TRequestConfig extends RequestConfig,
  TResponseConfig extends ResponseConfig,
> extends Pick<ZodOpenApiOperationObject, 'tags' | 'summary' | 'description'> {
  operationId: string
  request?: TRequestConfig
  response?: TResponseConfig
  handler: (
    request: EndpointRequest<TRequestConfig>,
    context: RequestContext<TContextData>,
  ) => TResponseConfig extends ResponseConfig
    ? TResponseConfig['schema'] extends z.ZodTypeAny
      ? Promise<z.input<TResponseConfig['schema']>>
      : Promise<void>
    : Promise<void>
}

export type EndpointMetadata<
  TContextData,
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig = ResponseConfig,
> = Omit<
  EndpointConfig<TContextData, TRequestConfig, TResponseConfig>,
  'handler'
>

interface ValidatedRequest {
  body?: unknown
  path?: unknown
  query?: unknown
}

export function createEndpoint<
  TContextData,
  TRequestConfig extends RequestConfig = RequestConfig,
  TResponseConfig extends ResponseConfig = ResponseConfig,
>(config: EndpointConfig<TContextData, TRequestConfig, TResponseConfig>) {
  return new Endpoint(config)
}
