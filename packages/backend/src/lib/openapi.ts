import assert = require('assert')
import { Router } from 'express'
import {
  ZodOpenApiObject,
  ZodOpenApiOperationObject,
  createDocument,
} from 'zod-openapi'
import { ResponseConfig, endpoint, isHttpStatusCode } from './endpoint'

export function generateOpenAPIDocs(router: Router) {
  const zodOpenApiObject: ZodOpenApiObject = {
    openapi: '3.1.0',
    info: {
      title: 'My API',
      version: '1.0.0',
    },
    paths: {},
  }

  const paths = zodOpenApiObject.paths
  assert(paths)

  for (const layer of router.stack) {
    if (!isRouteLayer(layer)) {
      continue
    }
    const path = toOpenApiPath(layer.route.path)

    paths[path] ??= {}

    for (const routeLayer of layer.route.stack) {
      if (!isEndpointLayer(routeLayer)) {
        continue
      }

      const endpointConfig = routeLayer.handle.config
      const operation: ZodOpenApiOperationObject = {
        operationId: endpointConfig.operationId,
        responses: {},
        tags: endpointConfig.tags,
        summary: endpointConfig.summary,
        description: endpointConfig.description,
      }
      paths[path][routeLayer.method] = operation
      const requestConfig = endpointConfig.request
      if (requestConfig?.path) {
        operation.requestParams ??= {}
        operation.requestParams.path = requestConfig.path
      }
      if (requestConfig?.query) {
        operation.requestParams ??= {}
        operation.requestParams.query = requestConfig.query
      }
      if (requestConfig?.body) {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: requestConfig.body,
            },
          },
        }
      }
      const responseConfig = endpointConfig.response as
        | ResponseConfig
        | undefined
      if (responseConfig) {
        for (const statusCode in responseConfig) {
          if (!isHttpStatusCode(statusCode)) {
            continue
          }
          operation.responses[statusCode] = {
            description: statusCode,
            content: {
              'application/json': {
                schema: responseConfig[statusCode],
              },
            },
          }
        }
      } else {
        operation.responses['204'] = {
          description: 'No Content',
        }
      }
    }
  }

  const openApiDocument = createDocument(zodOpenApiObject)
  return openApiDocument
}

interface RouteLayer {
  name: 'bound dispatch'
  regexp: RegExp
  route: Route
}
interface EndpointLayer {
  handle: ReturnType<typeof endpoint>
  method: Method
  name: 'handler'
}
interface Route {
  methods: Partial<Record<Method, boolean>>
  path: string
  stack: unknown[]
}
type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'
function isRouteLayer(layer: unknown): layer is RouteLayer {
  return (
    typeof layer === 'object' &&
    layer != null &&
    'name' in layer &&
    layer.name === 'bound dispatch' &&
    'route' in layer &&
    layer.route != null
  )
}
function isEndpointLayer(layer: unknown): layer is EndpointLayer {
  return (
    typeof layer === 'object' &&
    layer != null &&
    'name' in layer &&
    layer.name === 'handler' &&
    'handle' in layer &&
    typeof layer.handle === 'function' &&
    'config' in layer.handle &&
    typeof layer.handle.config === 'object' &&
    layer.handle.config != null
  )
}

function toOpenApiPath(expressPath: string) {
  // Regular expression to match Express-style parameters
  const paramRegex = /:[^/]+/g

  // Replace Express-style parameters with OpenAPI-style parameters
  const openAPIPath = expressPath.replace(
    paramRegex,
    (match) => `{${match.substring(1)}}`,
  )

  return openAPIPath
}
