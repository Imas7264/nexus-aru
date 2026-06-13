const express = require('express')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')
const { sendOTPEmail } = require('../utils/mailer')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret-key'

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { moodleId, password, name, role, department, division, batch } = req.body

  // Validate moodleId is numeric (so email becomes a valid college email)
  if (!moodleId || !/^\d+$/.test(moodleId)) {
    return res.status(400).json({ error: 'Moodle ID must be numeric (e.g. 23106093)' })
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { moodleId }
    })

    if (existing) {
      // Already registered but not verified — resend OTP
      if (!existing.isVerified) {
        const otp = generateOTP()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await prisma.user.update({
          where: { moodleId },
          data: { otpCode: otp, otpExpiresAt }
        })

        await sendOTPEmail(moodleId, otp)

        return res.status(200).json({
          message: 'Account pending verification. A new OTP has been sent to your college email.',
          moodleId
        })
      }

      return res.status(400).json({ error: 'Moodle ID already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const otp = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        moodleId,
        password: hashedPassword,
        name,
        role: role || 'STUDENT',
        department,
        division,
        batch,
        isVerified: false,
        otpCode: otp,
        otpExpiresAt
      }
    })

    // Seed channels for this user
    const toSeed = [
      { name: division,   scope: 'DIVISION' },
      { name: batch,      scope: 'BATCH' },
      { name: department, scope: 'DEPARTMENT' },
    ]
    for (const ch of toSeed) {
      if (!ch.name) continue
      await prisma.channel.upsert({
        where: { name_scope: { name: ch.name, scope: ch.scope } },
        update: {},
        create: { name: ch.name, scope: ch.scope }
      })
    }

    await sendOTPEmail(moodleId, otp)

    res.status(201).json({
      message: 'Registration successful. Check your college email for the OTP.',
      moodleId
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { moodleId, otp } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { moodleId } })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' })
    }
    if (!user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' })
    }
    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' })
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP.' })
    }

    await prisma.user.update({
      where: { moodleId },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null }
    })

    res.json({ message: 'Email verified successfully. You can now log in.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

// ── RESEND OTP ────────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  const { moodleId } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { moodleId } })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' })
    }

    const otp = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { moodleId },
      data: { otpCode: otp, otpExpiresAt }
    })

    await sendOTPEmail(moodleId, otp)

    res.json({ message: 'New OTP sent to your college email.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not resend OTP' })
  }
})

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { moodleId, password } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: { moodleId }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Block login if email not verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Email not verified. Please verify your college email before logging in.',
        unverified: true,
        moodleId: user.moodleId
      })
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
        department: user.department,
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
        department: user.department,
        division: user.division,
        batch: user.batch
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// ── GET ALL USERS (admin only) ────────────────────────────────────────────────
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        moodleId: true,
        name: true,
        role: true,
        department: true,
        division: true,
        batch: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// ── MAKE ADMIN (admin only) ───────────────────────────────────────────────────
router.post('/make-admin/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' })
  }

  try {
    const userId = parseInt(req.params.id)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: { id: true, moodleId: true, name: true, role: true }
    })
    res.json({ message: 'User is now an admin', user: updatedUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update user role' })
  }
})

// ── REMOVE ADMIN (admin only) ─────────────────────────────────────────────────
router.patch('/remove-admin/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' })
  }

  try {
    const userId = parseInt(req.params.id)

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove your own admin role' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: 'STUDENT' },
      select: { id: true, moodleId: true, name: true, role: true }
    })

    res.json({ message: 'Admin role removed', user: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// ── DELETE USER (admin only) ──────────────────────────────────────────────────
router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' })
  }

  try {
    const userId = parseInt(req.params.id)

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userNotes = await prisma.note.findMany({
      where: { uploadedById: userId }
    })

    const uploadDir = path.join(__dirname, '../../uploads')
    for (const note of userNotes) {
      const filePath = path.join(uploadDir, note.fileName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.user.delete({ where: { id: userId } })

    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

module.exports = router
