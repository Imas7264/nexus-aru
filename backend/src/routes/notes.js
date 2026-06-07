const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Get all subjects
router.get('/subjects', authMiddleware, async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: { notes: true, tasks: true }
        }
      }
    })
    res.json(subjects)
  } catch (err) {
    console.error('Error fetching subjects:', err)
    res.status(500).json({ error: 'Failed to fetch subjects' })
  }
})

// Create a new subject (admin only)
router.post('/subjects', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create subjects' })
  }
  
  try {
    const { name } = req.body
    const subject = await prisma.subject.create({
      data: { name }
    })
    res.json({ message: 'Subject created successfully', subject })
  } catch (err) {
    console.error('Error creating subject:', err)
    res.status(500).json({ error: 'Subject already exists or invalid data' })
  }
})

// Update a subject (admin only)
router.put('/subjects/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can update subjects' })
  }
  
  try {
    const subjectId = parseInt(req.params.id)
    const { name } = req.body
    
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: { name }
    })
    res.json({ message: 'Subject updated successfully', subject })
  } catch (err) {
    console.error('Error updating subject:', err)
    res.status(500).json({ error: 'Failed to update subject' })
  }
})

// Delete a subject (admin only)
router.delete('/subjects/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete subjects' })
  }
  
  try {
    const subjectId = parseInt(req.params.id)
    
    // Check if subject has notes
    const noteCount = await prisma.note.count({
      where: { subjectId }
    })
    
    if (noteCount > 0) {
      return res.status(400).json({ error: `Cannot delete subject with ${noteCount} notes. Delete the notes first.` })
    }
    
    await prisma.subject.delete({
      where: { id: subjectId }
    })
    res.json({ message: 'Subject deleted successfully' })
  } catch (err) {
    console.error('Error deleting subject:', err)
    res.status(500).json({ error: 'Failed to delete subject' })
  }
})

// Upload a note
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, subjectId } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const note = await prisma.note.create({
      data: {
        title,
        description: description || '',
        fileName: req.file.filename,
        fileSize: req.file.size / (1024 * 1024),
        category,
        subjectId: parseInt(subjectId),
        uploadedById: req.user.id
      }
    })
    
    res.json({ message: 'Note uploaded successfully', note })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Failed to upload note: ' + err.message })
  }
})

// Get all notes (with filters)
router.get('/notes', authMiddleware, async (req, res) => {
  try {
    const { subjectId, category } = req.query
    
    const where = {}
    if (subjectId) where.subjectId = parseInt(subjectId)
    if (category) where.category = category
    
    const notes = await prisma.note.findMany({
      where,
      include: {
        subject: true,
        uploadedBy: {
          select: { id: true, name: true, moodleId: true }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })
    
    res.json(notes)
  } catch (err) {
    console.error('Error fetching notes:', err)
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

// Download a note (increments download count)
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }
    
    // Increment download count
    await prisma.note.update({
      where: { id: note.id },
      data: { downloadCount: note.downloadCount + 1 }
    })
    
    const filePath = path.join(uploadDir, note.fileName)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' })
    }
    
    res.download(filePath, note.fileName)
  } catch (err) {
    console.error('Download error:', err)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

// Delete a note (only uploader can delete)
router.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }
    
    if (note.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only delete your own notes' })
    }
    
    // Delete the file from disk
    const filePath = path.join(uploadDir, note.fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    // Delete from database
    await prisma.note.delete({
      where: { id: note.id }
    })
    
    res.json({ message: 'Note deleted successfully' })
  } catch (err) {
    console.error('Delete error:', err)
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

module.exports = router