const express = require('express')
const cors = require('cors')
const prisma = require('./prisma')
const authRoutes = require('./routes/auth')
const notesRoutes = require('./routes/notes')
const tasksRoutes = require('./routes/tasks')
const announcementsRoutes = require('./routes/announcements')
const channelsRoutes = require('./routes/channels')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'NEXUS-ARU backend is running' })
})

app.use('/auth', authRoutes)
app.use('/notes', notesRoutes)
app.use('/tasks', tasksRoutes)
app.use('/announcements', announcementsRoutes)
app.use('/channels', channelsRoutes)

async function seedChannels() {
  try {
    const users = await prisma.user.findMany({
      select: { division: true, batch: true, department: true }
    })

    const combos = new Set()
    for (const u of users) {
      if (u.division)   combos.add(JSON.stringify({ name: u.division,   scope: 'DIVISION' }))
      if (u.batch)      combos.add(JSON.stringify({ name: u.batch,      scope: 'BATCH' }))
      if (u.department) combos.add(JSON.stringify({ name: u.department, scope: 'DEPARTMENT' }))
    }

    for (const combo of combos) {
      const { name, scope } = JSON.parse(combo)
      await prisma.channel.upsert({
        where: { name_scope: { name, scope } },
        update: {},
        create: { name, scope }
      })
    }

    console.log(`Channels seeded: ${combos.size} combinations`)
  } catch (err) {
    console.error('Channel seeding failed:', err)
  }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await seedChannels()
})