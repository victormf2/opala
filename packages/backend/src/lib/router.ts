import {
  HandlerResult,
  RequestContext,
  RequestContextWithResult,
} from './context'
import { Endpoint, RequestConfig, ResponseConfig } from './endpoints2'

export class Router<TContextData = unknown> {
  constructor(readonly stack: StackItem[]) {}

  with<TNewData extends Record<string, unknown> | void>(
    transformer: Transformer<TContextData, TNewData>,
  ) {
    return new Router<
      TNewData extends void ? TContextData : TContextData & TNewData
    >([...this.stack, { type: 'Transformer', transformer }])
  }

  withErrorHandler(errorHandler: ErrorHandler<TContextData>) {
    return new Router<TContextData>([
      ...this.stack,
      { type: 'ErrorHandler', errorHandler },
    ])
  }

  withResultHandler(resultHandler: ResultHandler<TContextData>) {
    return new Router<TContextData>([
      ...this.stack,
      { type: 'ResultHandler', resultHandler },
    ])
  }

  map(mapper: (router: this) => void): this
  map<TNewData>(
    mapper: (router: this) => Router<TContextData & TNewData>,
  ): Router<TContextData & TNewData>
  map<TNewData>(
    mapper: (router: this) => void | Router<TContextData & TNewData>,
  ): this | Router<TContextData & TNewData> {
    const newRouter = mapper(this)
    return newRouter ?? this
  }

  route<TInnerRouterContextData extends TContextData>(
    path: string,
    router: Router<TInnerRouterContextData>,
  ) {
    this.stack.push({ type: 'NestedRouter', nestedRouter: { path, router } })
    return this
  }

  get<
    TRequestConfig extends RequestConfig = RequestConfig,
    TResponseConfig extends ResponseConfig = ResponseConfig,
  >(
    path: string,
    endpoint: Endpoint<TContextData, TRequestConfig, TResponseConfig>,
  ) {
    return this.addRoute('get', path, endpoint)
  }

  post<
    TRequestConfig extends RequestConfig = RequestConfig,
    TResponseConfig extends ResponseConfig = ResponseConfig,
  >(
    path: string,
    endpoint: Endpoint<TContextData, TRequestConfig, TResponseConfig>,
  ) {
    return this.addRoute('post', path, endpoint)
  }

  put<
    TRequestConfig extends RequestConfig = RequestConfig,
    TResponseConfig extends ResponseConfig = ResponseConfig,
  >(
    path: string,
    endpoint: Endpoint<TContextData, TRequestConfig, TResponseConfig>,
  ) {
    return this.addRoute('put', path, endpoint)
  }

  patch<
    TRequestConfig extends RequestConfig = RequestConfig,
    TResponseConfig extends ResponseConfig = ResponseConfig,
  >(
    path: string,
    endpoint: Endpoint<TContextData, TRequestConfig, TResponseConfig>,
  ) {
    return this.addRoute('patch', path, endpoint)
  }

  delete<
    TRequestConfig extends RequestConfig = RequestConfig,
    TResponseConfig extends ResponseConfig = ResponseConfig,
  >(
    path: string,
    endpoint: Endpoint<TContextData, TRequestConfig, TResponseConfig>,
  ) {
    return this.addRoute('delete', path, endpoint)
  }

  private addRoute<
    TRequestConfig extends RequestConfig = RequestConfig,
    TResponseConfig extends ResponseConfig = ResponseConfig,
  >(
    method: HttpMethod,
    path: string,
    endpoint: Endpoint<TContextData, TRequestConfig, TResponseConfig>,
  ) {
    this.stack.push({
      type: 'Route',
      route: {
        method: method,
        path: path,
        endpoint: endpoint as unknown as Endpoint<
          any,
          RequestConfig,
          ResponseConfig
        >,
      },
    })
    return this
  }
}

export interface Transformer<TInput, TOutput> {
  (context: RequestContext<TInput>): Promise<TOutput | void>
}

export interface ErrorHandler<TContextData> {
  (
    error: unknown,
    context: RequestContext<TContextData>,
  ): Promise<HandlerResult | undefined>
}

export interface ResultHandler<TContextData> {
  (context: RequestContextWithResult<TContextData>): Promise<HandlerResult>
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface Route {
  method: HttpMethod
  path: string
  endpoint: Endpoint<any, RequestConfig, ResponseConfig>
}

export interface NestedRouter {
  router: Router
  path: string
}

export type StackItem =
  | RouteStackItem
  | TransformerStackItem
  | ErrorHandlerStackItem
  | ResultHandlerStackItem
  | NestedRouterStackItem

export interface RouteStackItem {
  type: 'Route'
  route: Route
}

export interface TransformerStackItem {
  type: 'Transformer'
  transformer: Transformer<any, unknown>
}

export interface ErrorHandlerStackItem {
  type: 'ErrorHandler'
  errorHandler: ErrorHandler<any>
}

export interface ResultHandlerStackItem {
  type: 'ResultHandler'
  resultHandler: ResultHandler<any>
}

export interface NestedRouterStackItem {
  type: 'NestedRouter'
  nestedRouter: NestedRouter
}

export function createRouter<TContextData>() {
  return new Router<TContextData>([])
}

export async function errorHandler(error: unknown): Promise<HandlerResult> {
  if (typeof error === 'object' && error != null) {
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return {
        statusCode: error.statusCode,
        value: error,
      }
    }
  }

  return {
    statusCode: 500,
    value: 'Unknown Error',
  }
}
