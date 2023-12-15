import { Application, json } from 'express'
import { writeFileSync } from 'fs'
import * as swaggerUi from 'swagger-ui-express'
import { OpenAPIObject } from 'zod-openapi/lib-types/openapi3-ts/dist/oas31'
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

export const defaultExpressConfiguration: ConfigureExpressOptions = {
  swagger: true,
}

interface ConfigureExpressOptions {
  swagger: boolean
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

  if (config.swagger) {
    const openApiDocs = generateOpenAPIDocs(app._router)

    const options = {
      swaggerOptions: {
        url: '/api-docs/swagger.json',
      },
    }
    app.get('/api-docs/swagger.json', (req, res) => res.json(openApiDocs))
    app.use(
      '/api-docs',
      swaggerUi.serveFiles(undefined, options),
      swaggerUi.setup(undefined, options),
    )

    writeFileSync('assets/swagger.jon', JSON.stringify(config.swagger, null, 2))

    app.openApiDocs = openApiDocs
  }

  return app
}

function isExpressApplication(obj: unknown): obj is Application {
  return (
    typeof obj === 'function' && 'init' in obj && typeof obj.init === 'function'
  )
}
