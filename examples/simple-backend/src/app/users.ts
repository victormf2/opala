import { endpoint } from '@opala/backend'
import { z } from 'zod'
import { resultError, resultSuccess, zodResult } from '../result'

export const User = z
  .object({
    name: z.string(),
  })
  .openapi({
    ref: 'User',
  })
export type User = z.infer<typeof User>

export const getAllUsers = endpoint({
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

export const createUser = endpoint({
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

export const getUserByName = endpoint({
  operationId: 'getUserByName',
  tags: ['Users'],
  summary: 'Get user by name',
  request: {
    path: z.object({
      name: z.string().refine((str) => str.length < 3),
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
