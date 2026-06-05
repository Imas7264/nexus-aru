const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
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
    res.json(announcements)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { content, type } = req.body

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can post announcements' })
  }

  if (!content || !type) {
    return res.status(400).json({ error: 'Content and type are required' })
  }

  if (!['IMPORTANT', 'OPTIONAL'].includes(type)) {
    return res.status(400).json({ error: 'Type must be IMPORTANT or OPTIONAL' })
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        content,
        type,
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
    res.status(201).json(announcement)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete announcements' })
  }

  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: parseInt(id) }
    })

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    await prisma.announcement.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Announcement deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router