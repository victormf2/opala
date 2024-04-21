import assert = require('assert')
import {
  ZodOpenApiObject,
  ZodOpenApiOperationObject,
  createDocument,
} from 'zod-openapi'
import { ResponseConfig } from './endpoint'
import { RouteStackItem, Router } from './router'

export function generateOpenAPIDocs(
  router: Router,
  openapi?: ZodOpenApiObject,
) {
  const zodOpenApiObject: ZodOpenApiObject = {
    openapi: '3.1.0',
    info: {
      title: 'Opala API',
      version: '1.0.0',
    },
    paths: {},
    ...openapi,
  }

  const paths = zodOpenApiObject.paths
  assert(paths)

  addRouterToOpenApiDocs(router, paths)

  const openApiDocument = createDocument(zodOpenApiObject)
  return openApiDocument
}

function addRouterToOpenApiDocs(
  router: Router,
  paths: NonNullable<ZodOpenApiObject['paths']>,
  prefix = '',
) {
  for (const item of router.stack) {
    if (item.type === 'Route') {
      addRouteToOpenApiDocs(prefix, item, paths)
    } else if (item.type === 'NestedRouter') {
      addRouterToOpenApiDocs(
        item.nestedRouter.router,
        paths,
        prefix + item.nestedRouter.path,
      )
    }
  }
}

function addRouteToOpenApiDocs(
  prefix: string,
  item: RouteStackItem,
  paths: NonNullable<ZodOpenApiObject['paths']>,
) {
  const path = prefix + toOpenApiPath(item.route.path)

  paths[path] ??= {}

  const endpointConfig = item.route.endpoint.config
  const operation: ZodOpenApiOperationObject = {
    operationId: endpointConfig.operationId,
    responses: {},
    tags: endpointConfig.tags,
    summary: endpointConfig.summary,
    description: endpointConfig.description,
  }
  paths[path][item.route.method] = operation
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
  const responseConfig = endpointConfig.response as ResponseConfig | undefined
  if (responseConfig) {
    const { status, schema } = responseConfig
    const statusCode = String(status ?? 200) as `${1 | 2 | 3 | 4 | 5}${string}`
    operation.responses[statusCode] = {
      description: statusCode,
      content: {
        'application/json': {
          schema,
        },
      },
    }
  } else {
    operation.responses['204'] = {
      description: 'No Content',
    }
  }
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
