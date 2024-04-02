import {
  configureExpressApplication,
  defaultExpressConfiguration,
} from '@opala/backend'
import { ZodError } from 'zod'
import { createUser, getAllUsers, getUserByName } from './app/users'
import { ResultError, ResultSuccess, resultError } from './result'

const app = configureExpressApplication({
  async successHandler(value, context) {
    const { res, endpoint } = context
    if (value instanceof ResultSuccess) {
      const status = endpoint.response?.status ?? 200
      res.status(status).send(value)
    } else if (value instanceof ResultError) {
      res.status(value.status).send(value)
    } else {
      await defaultExpressConfiguration.successHandler(value, context)
    }
  },
  async errorHandler(error, context) {
    const { res } = context
    if (error instanceof ResultError) {
      res.status(error.status).send(error)
    } else if (error instanceof ZodError) {
      res.status(400).send(
        resultError('validation_error', {
          message: error.message,
          status: 400,
          details: { issues: error.issues },
        }),
      )
    } else {
      await defaultExpressConfiguration.errorHandler(error, context)
    }
  },
})

app.get('/users', getAllUsers)
app.post('/users', createUser)
app.get('/users/:name', getUserByName)

app.listen(3000, function () {
  console.log('Server running on http://localhost:3000')
})
