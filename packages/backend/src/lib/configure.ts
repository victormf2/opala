import { ZodError } from 'zod'
import type { EndpointMetadata } from './endpoint'
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
    if (!endpoint.response.schema) {
      res.sendStatus(endpoint.response.status ?? 204)
      return
    }
    const status = endpoint.response.status ?? 200
    const parsedValue = await endpoint.response.schema.safeParseAsync(value)
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
