import { RequestContext, createEndpoint } from '@opala/backend'
import { z } from 'zod'
import { resultError, resultSuccess, zodResult } from '../result'
import express = require('express')

// interface ExpressContext extends Context {
//   express: {
//     req: express.Request
//     res: express.Response
//     next: express.NextFunction
//   }
// }
// export class ExpressAdapter
//   implements
//     IAdapter<express.RequestHandler, express.RequestHandler, ExpressContext>
// {
//   wrapRequestHandler(handler: Handler<ExpressContext>): express.RequestHandler {
//     function expressHandler(
//       req: express.Request,
//       res: express.Response,
//       next: express.NextFunction,
//     ) {
//       handler({
//         body: req.body,
//         pathParams: req.params,
//         queryParams: req.query as QueryParams,
//         express: { req, res, next },
//       })
//         .then((result) => {
//           res.status(result.statusCode).send(result.value)
//         })
//         .catch((error) => next(error))
//     }

//     return expressHandler
//   }

//   wrapMiddleware(
//     middleware: Middleware<ExpressContext>,
//   ): express.RequestHandler {
//     throw new Error('Not implemented')
//   }
// }
// const adapter = new ExpressAdapter()
// const api = new Api({ adapter }).withBeforeHandler(async (context) => {
//   return {
//     ...context,
//     banana: 123,
//   }
// })

export const User = z
  .object({
    name: z.string(),
  })
  .openapi({
    ref: 'User',
  })
export type User = z.infer<typeof User>

export const getAllUsers = createEndpoint({
  operationId: 'getAllUsers',
  tags: ['Users'],
  summary: 'Get all users',
  response: {
    schema: zodResult(
      z.object({
        users: z.array(User),
      }),
    ),
  },
  async handler() {
    return resultSuccess({
      users,
    })
  },
})

export const users: User[] = [{ name: 'Sample' }]

export const createUser = createEndpoint({
  operationId: 'createUser',
  tags: ['Users'],
  summary: 'Create user',
  request: {
    body: User,
  },
  async handler({ body: user }) {
    users.push(user)
  },
})

export const getUserByName = createEndpoint({
  operationId: 'getUserByName',
  tags: ['Users'],
  summary: 'Get user by name',
  request: {
    path: z.object({
      name: z.string(),
    }),
  },
  response: {
    schema: zodResult(
      z.object({
        user: User,
      }),
    ),
  },
  async handler({ path: { name } }) {
    const user = users.find((u) => u.name === name)
    if (user == null) {
      return resultError('not_found', { status: 404 })
    }
    return resultSuccess({ user })
  },
})

export const nossa = createEndpoint({
  operationId: 'nossa',
  tags: ['Seila'],
  response: {
    schema: z.object({
      text: z.string(),
    }),
  },
  async handler(_, context: RequestContext<{ user: string }>) {
    return {
      text: '123',
    }
  },
})
