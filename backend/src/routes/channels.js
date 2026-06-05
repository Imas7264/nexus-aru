const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(channels)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { name, scope } = req.body

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create channels' })
  }

  if (!name || !scope) {
    return res.status(400).json({ error: 'Name and scope are required' })
  }

  if (!['DEPARTMENT', 'DIVISION', 'BATCH'].includes(scope)) {
    return res.status(400).json({ error: 'Scope must be DEPARTMENT, DIVISION or BATCH' })
  }

  try {
    const channel = await prisma.channel.create({
      data: { name, scope }
    })
    res.status(201).json(channel)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.get('/:id/requests', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(id) }
    })

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const requests = await prisma.request.findMany({
      where: { channelId: parseInt(id) },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            name: true,
            moodleId: true,
            role: true
          }
        }
      }
    })

    res.json(requests)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/:id/requests', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { content } = req.body

  if (!content) {
    return res.status(400).json({ error: 'Content is required' })
  }

  try {
    const channel = await prisma.channel.findUnique({
      where: { id: parseInt(id) }
    })

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' })
    }

    const request = await prisma.request.create({
      data: {
        content,
        channelId: parseInt(id),
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            moodleId: true,
            role: true
          }
        }
      }
    })

    res.status(201).json(request)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.patch('/:id/requests/:requestId', authMiddleware, async (req, res) => {
  const { id, requestId } = req.params
  const { status } = req.body

  if (!['PENDING', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be PENDING or COMPLETED' })
  }

  try {
    const request = await prisma.request.findUnique({
      where: { id: parseInt(requestId) }
    })

    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (request.createdById !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own requests' })
    }

    const updated = await prisma.request.update({
      where: { id: parseInt(requestId) },
      data: { status },
      include: {
        createdBy: {
          select: {
            name: true,
            moodleId: true,
            role: true
          }
        }
      }
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router