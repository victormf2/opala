import 'reflect-metadata'

import {
  InputValidationError,
  OutputValidationError,
  RequestContext,
  createRouter,
  generateOpenAPIDocs,
} from '@opala/backend'
import swaggerUi, { SwaggerUiOptions } from 'swagger-ui-express'
import { DependencyContainer, container } from 'tsyringe'
import { OpenAPIObject } from 'zod-openapi/lib-types/openapi3-ts/dist/oas31'
import { createUser, getAllUsers, getUserByName, nossa } from './app/users'
import { ExpressContext, configureExpressRouter } from './express-adapter'
import { ResultError, resultError } from './result'
import express = require('express')

const app = express()
app.use(express.json())

const openApiDocsPath = '/docs'
const swaggerUiOptions: SwaggerUiOptions = {
  swaggerOptions: {
    url: `${openApiDocsPath}/swagger.json`,
  },
}

let openApiDocs: OpenAPIObject | null = null
app.get(`${openApiDocsPath}/swagger.json`, (_, res) => {
  if (openApiDocs == null) {
    openApiDocs = generateOpenAPIDocs(router)
  }
  res.json(openApiDocs)
})
app.use(
  openApiDocsPath,
  swaggerUi.serveFiles(undefined, swaggerUiOptions),
  swaggerUi.setup(undefined, swaggerUiOptions),
)

const router = createRouter<ExpressContext>()
  .with(logger)
  .with(scopedContainer)
  .with(authentication)
  .with(authorization)
  .map((router) => {
    router.get('/users', getAllUsers)
    router.post('/users', createUser)
    router.get('/users/:name', getUserByName)
  })
  .route(
    '/seila',
    createRouter<
      ExpressContext & { user: string; container: DependencyContainer }
    >().map((router) => {
      router.get('/nossa', nossa)
    }),
  )
  .withResultHandler(async (context) => {
    const value = context.result.value
    if (value instanceof ResultError) {
      return {
        statusCode: value.status,
        value,
      }
    }
    return context.result
  })
  .withErrorHandler(async (error) => {
    if (error instanceof ResultError) {
      return {
        statusCode: error.status,
        value: error,
      }
    } else if (error instanceof InputValidationError) {
      return {
        statusCode: 400,
        value: resultError('InputValidationError', {
          status: 400,
          message: error.message,
          details: {
            pathIssues: error.path?.issues,
            queryIssues: error.query?.issues,
            bodyIssues: error.body?.issues,
          },
        }),
      }
    } else if (error instanceof OutputValidationError) {
      return {
        statusCode: 500,
        value: resultError('OutputValidationError', {
          status: 500,
          message: error.message,
          details: {
            issues: error.error.issues,
          },
        }),
      }
    } else {
      return {
        statusCode: 500,
        value: resultError('UnknownError', {
          status: 500,
          message: 'Unknown error',
        }),
      }
    }
  })
configureExpressRouter(app, router)

app.listen(3000, function () {
  console.log('Server running on http://localhost:3000')
})

async function scopedContainer() {
  return { container: container.createChildContainer() }
}

async function logger(context: RequestContext<ExpressContext>) {
  console.log('Received request on: ' + context.data.express.req.originalUrl)
}

async function authentication(): Promise<{ user?: string }> {
  if (Math.random() > 0.3) {
    return { user: 'victor' }
  }

  return {}
}

async function authorization(context: RequestContext<{ user?: string }>) {
  const user = context.data.user
  if (user != null) {
    return { user: user }
  }

  throw resultError('Unauthorized', { status: 401 })
}
