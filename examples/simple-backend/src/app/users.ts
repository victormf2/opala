import { endpoint } from '@opala/backend'
import { z } from 'zod'

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
    schema: z
      .object({
        users: z.array(User),
      })
      .openapi({
        ref: 'getUsersResponse',
      }),
  },
  async handler() {
    return {
      users,
    }
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
      name: z.string(),
    }),
  },
  response: {
    schema: z
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
    return { user }
  },
})
