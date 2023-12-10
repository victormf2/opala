import { endpoint, generateOpenAPIDocs } from '@opala/backend'
import * as swaggerUi from 'swagger-ui-express'
import { z } from 'zod'
import { extendZodWithOpenApi } from 'zod-openapi'
import express = require('express')

extendZodWithOpenApi(z)

const User = z
  .object({
    name: z.string(),
  })
  .openapi({
    ref: 'User',
  })
type User = z.infer<typeof User>

const users: User[] = [{ name: 'Sample' }]

const app = express()
app.use(express.json())

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: string
    }
  }
}
app.get(
  '/users',
  endpoint({
    tags: ['Users'],
    summary: 'Get all users',
    response: {
      200: z
        .object({
          users: z.array(User),
        })
        .openapi({
          ref: 'GetUsersResponse',
        }),
    },
    async handler() {
      return {
        statusCode: '200',
        data: {
          users,
        },
      }
    },
  }),
)

app.post(
  '/users',
  endpoint({
    tags: ['Users'],
    summary: 'Create user',
    request: {
      body: User,
    },
    async handler({ body: user }) {
      users.push(user)
    },
  }),
)
app.get(
  '/users/:name',
  endpoint({
    tags: ['Users'],
    summary: 'Get user by name',
    request: {
      path: z.object({
        name: z.string(),
      }),
    },
    response: {
      200: z
        .object({
          user: User,
        })
        .openapi({
          ref: 'GetUserByNameResponse',
        }),
    },
    async handler({ path: { name } }) {
      const user = users.find((u) => u.name === name)
      if (user == null) {
        throw new Error('User Not Found')
      }
      return {
        statusCode: '200',
        data: { user },
      }
    },
  }),
)
const openApiDoc = generateOpenAPIDocs(app._router)

const options = {
  swaggerOptions: {
    url: '/api-docs/swagger.json',
  },
}
app.get('/api-docs/swagger.json', (req, res) => res.json(openApiDoc))
app.use(
  '/api-docs',
  swaggerUi.serveFiles(undefined, options),
  swaggerUi.setup(undefined, options),
)

app.listen(3000, function () {
  console.log('Server running on http://localhost:3000')
})
