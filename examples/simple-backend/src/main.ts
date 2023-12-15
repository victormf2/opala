import { configureExpressApplication } from '@opala/backend'
import { createUser, getAllUsers, getUserByName } from './app/users'

const app = configureExpressApplication()

app.get('/users', getAllUsers)
app.post('/users', createUser)
app.get('/users/:name', getUserByName)

app.listen(3000, function () {
  console.log('Server running on http://localhost:3000')
})
