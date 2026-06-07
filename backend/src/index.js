const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const notesRoutes = require('./routes/notes') 
const tasksRoutes = require('./routes/tasks')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'NEXUS-ARU backend is running' })
})

app.use('/auth', authRoutes)
app.use('/notes', notesRoutes)
app.use('/tasks', tasksRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})