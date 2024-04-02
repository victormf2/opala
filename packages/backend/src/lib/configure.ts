import { Application, json } from 'express'
import * as swaggerUi from 'swagger-ui-express'
import { ZodError } from 'zod'
import { OpenAPIObject } from 'zod-openapi/lib-types/openapi3-ts/dist/oas31'
import type { EndpointMetadata } from './endpoint'
import { isExpressApplication } from './helpers'
import { generateOpenAPIDocs } from './openapi'
import express = require('express')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Application {
      opala: ConfigureExpressOptions
    }
  }
}

export const defaultExpressConfiguration = {
  openApi: {
    enable: true,
    path: '/docs',
  },
  async successHandler(value, { endpoint, res }) {
    if (!endpoint.response) {
      res.sendStatus(204)
      return
    }
    const parsedValue = await endpoint.response.schema.safeParseAsync(value)
    const status = endpoint.response.status ?? 200
    res.status(status).send(parsedValue)
  },
  async errorHandler(error, { res }) {
    if (error instanceof ZodError) {
      res.status(400).send(error.format())
    } else if (process.env['NODE_ENV'] === 'development') {
      if (error instanceof Error) {
        res.status(500).send({
          ...error,
          stack: error.stack,
          message: error.message,
        })
      } else {
        res.status(500).send(error)
      }
    } else {
      res.status(500).send('Unknown error')
    }
  },
} satisfies ConfigureExpressOptions

interface ConfigureExpressOptions {
  openApi?: {
    enable?: boolean
    path?: string
  }
  successHandler?: (
    value: unknown,
    context: {
      endpoint: EndpointMetadata
      req: express.Request
      res: express.Response
      next: express.NextFunction
    },
  ) => Promise<void>

  errorHandler?: (
    error: unknown,
    context: {
      endpoint: EndpointMetadata
      req: express.Request
      res: express.Response
      next: express.NextFunction
    },
  ) => Promise<void>
}
export function configureExpressApplication(): Application
export function configureExpressApplication(
  config: Partial<ConfigureExpressOptions>,
): Application
export function configureExpressApplication(app: Application): Application
export function configureExpressApplication(
  app: Application,
  config: Partial<ConfigureExpressOptions>,
): Application
export function configureExpressApplication(
  p0?: Application | Partial<ConfigureExpressOptions>,
  p1?: Partial<ConfigureExpressOptions>,
): Application {
  const config: ConfigureExpressOptions = Object.assign(
    {},
    defaultExpressConfiguration,
  )
  if (typeof p0 === 'object') {
    Object.assign(config, p0)
  } else if (typeof p1 === 'object') {
    Object.assign(config, p1)
  }
  const app = isExpressApplication(p0) ? p0 : express()
  app.opala = config
  app.use(json())

  if (config.openApi?.enable) {
    const openApiDocsPath =
      config.openApi.path ?? defaultExpressConfiguration.openApi.path
    const options = {
      swaggerOptions: {
        url: `${openApiDocsPath}/swagger.json`,
      },
    }

    let openApiDocs: OpenAPIObject | null = null
    app.get(`${openApiDocsPath}/swagger.json`, (_, res) => {
      if (openApiDocs == null) {
        openApiDocs = generateOpenAPIDocs(app)
      }
      res.json(openApiDocs)
    })
    app.use(
      openApiDocsPath,
      swaggerUi.serveFiles(undefined, options),
      swaggerUi.setup(undefined, options),
    )
  }

  return app
}
