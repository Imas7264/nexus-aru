const express = require('express')
const prisma = require('../prisma')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// ============ ADMIN TASKS (CR creates for students) ============

// Create admin task (CR only)
router.post('/admin', authMiddleware, async (req, res) => {
  // Only admin can create admin tasks
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can create tasks for everyone' })
  }

  try {
    const { title, description, dueDate, subjectId, forBatch } = req.body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        isAdmin: true,
        forBatch: forBatch || null,  // null means all batches
        subjectId: parseInt(subjectId),
        createdById: req.user.id
      }
    })

    res.json({ message: 'Admin task created successfully', task })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Get all admin tasks (visible to all students based on batch)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        isAdmin: true,
        OR: [
          { forBatch: null },           // Tasks for all batches
          { forBatch: req.user.batch }  // Tasks for user's specific batch
        ]
      },
      include: {
        subject: true,
        createdBy: {
          select: { name: true, moodleId: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // For each task, check if current user has completed it
    const completions = await prisma.taskCompletion.findMany({
      where: {
        userId: req.user.id,
        taskId: { in: tasks.map(t => t.id) }
      }
    })

    const completedTaskIds = new Set(completions.map(c => c.taskId))

    const tasksWithStatus = tasks.map(task => ({
      ...task,
      isCompleted: completedTaskIds.has(task.id)
    }))

    res.json(tasksWithStatus)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Get admin task completion statistics (admin only)
router.get('/admin/stats/:taskId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can view statistics' })
  }

  try {
    const taskId = parseInt(req.params.taskId)

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || !task.isAdmin) {
      return res.status(404).json({ error: 'Admin task not found' })
    }

    // Count total students (based on batch filter)
    const whereCondition = task.forBatch ? { batch: task.forBatch } : {}
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT', ...whereCondition }
    })

    // Count completed students
    const completedCount = await prisma.taskCompletion.count({
      where: { taskId }
    })

    res.json({
      taskId,
      title: task.title,
      totalStudents,
      completedCount,
      pendingCount: totalStudents - completedCount
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// ============ PERSONAL TASKS (students create for themselves) ============

// Create personal task
router.post('/personal', authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, subjectId } = req.body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        isAdmin: false,
        forBatch: null,
        subjectId: parseInt(subjectId),
        createdById: req.user.id
      }
    })

    res.json({ message: 'Personal task created', task })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create personal task' })
  }
})

// Get all personal tasks for current user
router.get('/personal', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        isAdmin: false,
        createdById: req.user.id
      },
      include: {
        subject: true
      },
      orderBy: { dueDate: 'asc' }
    })

    res.json(tasks)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch personal tasks' })
  }
})

// Update personal task (edit title, description, due date)
router.put('/personal/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const { title, description, dueDate, subjectId } = req.body

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (task.isAdmin) return res.status(403).json({ error: 'Cannot edit admin tasks' })
    if (task.createdById !== req.user.id) return res.status(403).json({ error: 'Not your task' })

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        subjectId: subjectId ? parseInt(subjectId) : undefined
      }
    })

    res.json({ message: 'Task updated', task: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete personal task
router.delete('/personal/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (task.isAdmin) return res.status(403).json({ error: 'Cannot delete admin tasks' })
    if (task.createdById !== req.user.id) return res.status(403).json({ error: 'Not your task' })

    await prisma.task.delete({
      where: { id: taskId }
    })

    res.json({ message: 'Task deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// ============ COMPLETION (for both admin and personal tasks) ============

// Mark a task as complete
router.post('/complete/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) return res.status(404).json({ error: 'Task not found' })

    if (task.isAdmin) {
      // For admin tasks: create completion record
      const existing = await prisma.taskCompletion.findUnique({
        where: {
          taskId_userId: {
            taskId: task.id,
            userId: req.user.id
          }
        }
      })

      if (existing) {
        return res.status(400).json({ error: 'Task already marked as complete' })
      }

      await prisma.taskCompletion.create({
        data: {
          taskId: task.id,
          userId: req.user.id
        }
      })
    } else {
      // For personal tasks: update status
      if (task.createdById !== req.user.id) {
        return res.status(403).json({ error: 'Not your task' })
      }

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED' }
      })
    }

    res.json({ message: 'Task marked as complete' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to mark task as complete' })
  }
})

// Mark a task as pending (undo complete)
router.post('/undo/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) return res.status(404).json({ error: 'Task not found' })

    if (task.isAdmin) {
      // For admin tasks: delete completion record
      await prisma.taskCompletion.deleteMany({
        where: {
          taskId: task.id,
          userId: req.user.id
        }
      })
    } else {
      // For personal tasks: update status
      if (task.createdById !== req.user.id) {
        return res.status(403).json({ error: 'Not your task' })
      }

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'PENDING' }
      })
    }

    res.json({ message: 'Task marked as pending' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to undo task completion' })
  }
})

// Get all tasks for current user (combined view)
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    // Get admin tasks assigned to user's batch
    const adminTasks = await prisma.task.findMany({
      where: {
        isAdmin: true,
        OR: [
          { forBatch: null },
          { forBatch: req.user.batch }
        ]
      },
      include: {
        subject: true,
        createdBy: {
          select: { name: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Get user's completions
    const completions = await prisma.taskCompletion.findMany({
      where: { userId: req.user.id }
    })
    const completedAdminTaskIds = new Set(completions.map(c => c.taskId))

    // Get personal tasks
    const personalTasks = await prisma.task.findMany({
      where: {
        isAdmin: false,
        createdById: req.user.id
      },
      include: {
        subject: true
      },
      orderBy: { dueDate: 'asc' }
    })

    res.json({
      adminTasks: adminTasks.map(t => ({
        ...t,
        isCompleted: completedAdminTaskIds.has(t.id)
      })),
      personalTasks
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Get all distinct batches for admin's division (for task creation dropdown)
router.get('/batches', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        batch: { not: null },
        ...(req.user.division ? { batch: { startsWith: req.user.division } } : {})
      },
      select: { batch: true },
      distinct: ['batch']
    })
    const batches = users.map(u => u.batch).filter(Boolean).sort()
    res.json(batches)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch batches' })
  }
})

module.exports = router