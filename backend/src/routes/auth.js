const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret-key'

router.post('/register', async (req, res) => {
  const { moodleId, password, name, role, division, batch } = req.body

  try {
    const existing = await prisma.user.findUnique({
      where: { moodleId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Moodle ID already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        moodleId,
        password: hashedPassword,
        name,
        role: role || 'STUDENT',
        division,
        batch
      }
    })

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        moodleId: user.moodleId,
        name: user.name,
        role: user.role,
        division: user.division,
        batch: user.batch
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/login', async (req, res) => {
  const { moodleId, password } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: { moodleId }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        moodleId: user.moodleId,
        name: user.name,
        role: user.role,
        division: user.division,
        batch: user.batch
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        moodleId: user.moodleId,
        name: user.name,
        role: user.role,
        division: user.division,
        batch: user.batch
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router