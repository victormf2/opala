import { Application, json } from 'express'
import * as swaggerUi from 'swagger-ui-express'
import { OpenAPIObject } from 'zod-openapi/lib-types/openapi3-ts/dist/oas31'
import { isExpressApplication } from './helpers'
import { generateOpenAPIDocs } from './openapi'
import express = require('express')

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {}
    interface Response {}
    interface Locals {}
    interface Application {
      openApiDocs?: OpenAPIObject
    }
  }
}

export const defaultExpressConfiguration = {
  openApi: {
    enable: true,
    path: '/docs',
  },
} satisfies ConfigureExpressOptions

interface ConfigureExpressOptions {
  openApi: {
    enable?: boolean
    path?: string
  }
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
  app.use(json())

  if (config.openApi.enable) {
    const openApiDocsPath =
      config.openApi.path ?? defaultExpressConfiguration.openApi.path
    const options = {
      swaggerOptions: {
        url: `${openApiDocsPath}/swagger.json`,
      },
    }

    let openApiDocs: OpenAPIObject | null = null
    app.get(`${openApiDocsPath}/swagger.json`, (req, res) => {
      if (openApiDocs == null) {
        openApiDocs = generateOpenAPIDocs(app)
        app.openApiDocs = openApiDocs
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
