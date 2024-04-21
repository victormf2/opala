import {
  QueryParams,
  RequestContext,
  RequestContextWithResult,
  Router,
} from '@opala/backend'
import express = require('express')

export interface ExpressContext {
  express: {
    req: express.Request
    res: express.Response
    next: express.NextFunction
  }
}

export function configureExpressRouter(
  expressRouter: express.Router,
  router: Router,
) {
  expressRouter.use((req, res, next) => {
    req.context = new RequestContext(
      {
        get body() {
          return req.body
        },
        get pathParams() {
          return req.params
        },
        get queryParams() {
          return req.query as QueryParams
        },
      },
      {
        express: {
          req,
          res,
          next,
        },
      },
    )
    next()
  })

  addRoutesToExpress(expressRouter, router)

  expressRouter.use((req, res, next) => {
    const result = req.context.result
    if (result) {
      res.status(result.statusCode).send(result.value)
    }
    next()
  })
}
function addRoutesToExpress(expressRouter: express.Router, router: Router) {
  for (const item of router.stack) {
    if (item.type === 'Transformer') {
      const transformer = item.transformer
      expressRouter.use((req, res, next) => {
        transformer(req.context)
          .then((value) => {
            if (typeof value === 'object' && value != null) {
              req.context = req.context.withData(value)
            }
            next()
          })
          .catch((error) => {
            next(error)
          })
      })
    } else if (item.type === 'ErrorHandler') {
      const errorHandler = item.errorHandler
      expressRouter.use(
        (
          error: unknown,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          if (res.headersSent) {
            next(error)
            return
          }
          errorHandler(error, req.context)
            .then((result) => {
              if (result == null) {
                next(error)
              } else {
                req.context = req.context.withResult(result)
                next()
              }
            })
            .catch((error) => next(error))
        },
      )
    } else if (item.type === 'ResultHandler') {
      const resultHandler = item.resultHandler
      expressRouter.use((req, res, next) => {
        if (req.context.result == null) {
          next()
          return
        }
        resultHandler(req.context as RequestContextWithResult<any>)
          .then((result) => {
            req.context = req.context.withResult(result)
            next()
          })
          .catch((error) => next(error))
      })
    } else if (item.type === 'Route') {
      const route = item.route

      expressRouter[route.method](route.path, (req, res, next) => {
        route.endpoint
          .handleRequest(req.context)
          .then((result) => {
            req.context = req.context.withResult(result)
            next()
          })
          .catch((error) => next(error))
      })
    } else {
      const nestedRouter = item.nestedRouter

      const expressNestedRouter = express.Router()
      addRoutesToExpress(expressNestedRouter, nestedRouter.router)

      expressRouter.use(nestedRouter.path, expressNestedRouter)
    }
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context: RequestContext<unknown>
    }
  }
}
