import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../api/axios'

const TABS = [
  { label: 'Admin Tasks', value: 'admin' },
  { label: 'Personal Tasks', value: 'personal' },
]

function Tasks() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [activeTab, setActiveTab] = useState('admin')
  const [adminTasks, setAdminTasks] = useState([])
  const [personalTasks, setPersonalTasks] = useState([])
  const [loading, setLoading] = useState(false)

  // Admin task form
  const [showAdminForm, setShowAdminForm] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', forBatch: '' })

  // Personal task form
  const [showPersonalForm, setShowPersonalForm] = useState(false)
  const [newPersonalTask, setNewPersonalTask] = useState({ title: '', description: '', dueDate: '' })

  // Edit personal task
  const [editingTask, setEditingTask] = useState(null)

  // Stats
  const [taskStats, setTaskStats] = useState(null)
  const [statsForId, setStatsForId] = useState(null)
  const [batches, setBatches] = useState([])

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { fetchSubjects(); fetchBatches() }, [])

  useEffect(() => {
    if (selectedSubject) fetchTasks()
  }, [selectedSubject])

  async function fetchBatches() {
    try {
      const res = await api.get('/tasks/batches')
      setBatches(res.data)
    } catch (err) { console.error(err) }
  }

  async function fetchSubjects() {
    try {
      const res = await api.get('/notes/subjects')
      setSubjects(res.data)
      if (res.data.length > 0) setSelectedSubject(res.data[0])
    } catch (err) { console.error(err) }
  }

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await api.get('/tasks/my-tasks')
      setAdminTasks(res.data.adminTasks || [])
      setPersonalTasks(res.data.personalTasks || [])
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  function showMsg(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  function switchSubject(subject) {
    setSelectedSubject(subject)
    setActiveTab('admin')
    setShowAdminForm(false)
    setShowPersonalForm(false)
    setEditingTask(null)
    setStatsForId(null)
    setError('')
  }

  // Filter tasks for selected subject
  const filteredAdmin = adminTasks.filter(t => t.subject?.id === selectedSubject?.id)
  const filteredPersonal = personalTasks.filter(t => t.subject?.id === selectedSubject?.id)

  // Group admin tasks by forBatch (null = "All Batches")
  const groupedAdmin = filteredAdmin.reduce((acc, task) => {
    const key = task.forBatch || 'All Batches'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  // Sort groups: "All Batches" first, then alphabetically
  const sortedGroups = Object.keys(groupedAdmin).sort((a, b) => {
    if (a === 'All Batches') return -1
    if (b === 'All Batches') return 1
    return a.localeCompare(b)
  })

  async function handleCreateAdminTask(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/tasks/admin', {
        ...newTask,
        subjectId: selectedSubject.id,
        forBatch: newTask.forBatch || null
      })
      showMsg('Task created!')
      setShowAdminForm(false)
      setNewTask({ title: '', description: '', dueDate: '', forBatch: '' })
      fetchTasks()
    } catch (err) { setError(err.response?.data?.error || 'Failed to create task') }
  }

  async function handleCreatePersonalTask(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/tasks/personal', { ...newPersonalTask, subjectId: selectedSubject.id })
      showMsg('Task created!')
      setShowPersonalForm(false)
      setNewPersonalTask({ title: '', description: '', dueDate: '' })
      fetchTasks()
    } catch (err) { setError(err.response?.data?.error || 'Failed to create task') }
  }

  async function handleUpdatePersonalTask(e) {
    e.preventDefault()
    setError('')
    try {
      await api.put(`/tasks/personal/${editingTask.id}`, editingTask)
      showMsg('Task updated!')
      setEditingTask(null)
      fetchTasks()
    } catch (err) { setError(err.response?.data?.error || 'Failed to update task') }
  }

  async function handleDeletePersonalTask(taskId) {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/personal/${taskId}`)
      fetchTasks()
    } catch (err) { setError(err.response?.data?.error || 'Delete failed') }
  }

  async function toggleComplete(taskId, isAdmin, isCompleted) {
    try {
      await api.post(isCompleted ? `/tasks/undo/${taskId}` : `/tasks/complete/${taskId}`, {})
      fetchTasks()
    } catch (err) { setError(err.response?.data?.error || 'Failed') }
  }

  async function handleDeleteAdminTask(taskId) {
    if (!confirm('Delete this task for everyone?')) return
    try {
      await api.delete(`/tasks/admin/${taskId}`)
      fetchTasks()
    } catch (err) { setError(err.response?.data?.error || 'Delete failed') }
  }

  async function viewStats(taskId) {
    try {
      const res = await api.get(`/tasks/admin/stats/${taskId}`)
      setTaskStats(res.data)
      setStatsForId(taskId)
    } catch (err) { setError('Failed to load stats') }
  }

  const inputClass = "w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"

  const TaskRow = ({ task, isAdmin }) => (
    <div className="mb-6 pb-6 border-b border-gray-100 last:border-0">
      <p className={`text-sm leading-relaxed mb-2 ${
        (isAdmin ? task.isCompleted : task.status === 'COMPLETED')
          ? 'line-through text-gray-400'
          : 'text-gray-800'
      }`}>
        {task.title}
      </p>
      {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}

      {/* Stats panel */}
      {isAdmin && statsForId === task.id && taskStats && (
        <div className="flex gap-8 mb-3">
          <span className="text-xs text-gray-400">Total <span className="text-gray-900 font-medium">{taskStats.totalStudents}</span></span>
          <span className="text-xs text-gray-400">Completed <span className="text-gray-900 font-medium">{taskStats.completedCount}</span></span>
          <span className="text-xs text-gray-400">Pending <span className="text-gray-900 font-medium">{taskStats.pendingCount}</span></span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Due {new Date(task.dueDate).toLocaleString()}
        </span>
        <div className="flex items-center gap-4">
          <span className={`text-xs font-medium ${
            (isAdmin ? task.isCompleted : task.status === 'COMPLETED')
              ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {(isAdmin ? task.isCompleted : task.status === 'COMPLETED') ? 'Completed' : 'Pending'}
          </span>
          <button
            onClick={() => toggleComplete(task.id, isAdmin, isAdmin ? task.isCompleted : task.status === 'COMPLETED')}
            className="text-xs text-gray-400 hover:text-gray-900 transition-colors underline"
          >
            {(isAdmin ? task.isCompleted : task.status === 'COMPLETED') ? 'Mark pending' : 'Mark completed'}
          </button>
          {!isAdmin && (
            <>
              <button
                onClick={() => { setEditingTask(task); setShowPersonalForm(false) }}
                className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeletePersonalTask(task.id)}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </>
          )}
          {isAdmin && user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => statsForId === task.id ? setStatsForId(null) : viewStats(task.id)}
                className="text-xs text-gray-300 hover:text-gray-900 transition-colors"
              >
                {statsForId === task.id ? 'Hide stats' : 'Stats'}
              </button>
              <button
                onClick={() => handleDeleteAdminTask(task.id)}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Task Manager</h1>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        {message && <p className="text-green-600 text-xs mb-4">{message}</p>}

        <div className="flex gap-12">

          {/* Left: subjects */}
          <div className="w-40 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Subjects</p>
            {subjects.length === 0 && <p className="text-gray-300 text-sm">No subjects yet</p>}
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => switchSubject(s)}
                className={`w-full text-left py-2 text-sm transition-colors block ${
                  selectedSubject?.id === s.id
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Right: tasks */}
          <div className="flex-1">
            {selectedSubject ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-sm font-semibold text-gray-900">{selectedSubject.name}</h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-100">
                  {TABS.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => { setActiveTab(tab.value); setShowAdminForm(false); setShowPersonalForm(false); setEditingTask(null) }}
                      className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                        activeTab === tab.value
                          ? 'text-gray-900 font-medium border-gray-900'
                          : 'text-gray-400 hover:text-gray-900 border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Admin Tasks ── */}
                {activeTab === 'admin' && (
                  <>
                    {user.role === 'ADMIN' && (
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={() => setShowAdminForm(!showAdminForm)}
                          className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {showAdminForm ? 'Cancel' : '+ Create Task'}
                        </button>
                      </div>
                    )}

                    {showAdminForm && user.role === 'ADMIN' && (
                      <form onSubmit={handleCreateAdminTask} className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
                        <div className="flex-1 space-y-3">
                          <input type="text" placeholder="Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required className={inputClass} />
                          <input type="text" placeholder="Description (optional)" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className={inputClass} />
                          <input type="datetime-local" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} required className={inputClass} />
                          <select
                            value={newTask.forBatch}
                            onChange={e => setNewTask({...newTask, forBatch: e.target.value})}
                            className={inputClass}
                          >
                            <option value="">All Batches</option>
                            {batches.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors self-end">
                          Create
                        </button>
                      </form>
                    )}

                    {loading ? (
                      <p className="text-gray-400 text-sm">Loading...</p>
                    ) : filteredAdmin.length === 0 ? (
                      <p className="text-gray-300 text-sm">No admin tasks for this subject.</p>
                    ) : (
                      sortedGroups.map(group => (
                        <div key={group} className="mb-8">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                            {group}
                          </p>
                          {groupedAdmin[group].map(task => (
                            <TaskRow key={task.id} task={task} isAdmin={true} />
                          ))}
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* ── Personal Tasks ── */}
                {activeTab === 'personal' && (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => { setShowPersonalForm(!showPersonalForm); setEditingTask(null) }}
                        className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        {showPersonalForm ? 'Cancel' : '+ Add Task'}
                      </button>
                    </div>

                    {showPersonalForm && (
                      <form onSubmit={handleCreatePersonalTask} className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
                        <div className="flex-1 space-y-3">
                          <input type="text" placeholder="Title" value={newPersonalTask.title} onChange={e => setNewPersonalTask({...newPersonalTask, title: e.target.value})} required className={inputClass} />
                          <input type="text" placeholder="Description (optional)" value={newPersonalTask.description} onChange={e => setNewPersonalTask({...newPersonalTask, description: e.target.value})} className={inputClass} />
                          <input type="datetime-local" value={newPersonalTask.dueDate} onChange={e => setNewPersonalTask({...newPersonalTask, dueDate: e.target.value})} required className={inputClass} />
                        </div>
                        <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors self-end">
                          Create
                        </button>
                      </form>
                    )}

                    {editingTask && (
                      <form onSubmit={handleUpdatePersonalTask} className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
                        <div className="flex-1 space-y-3">
                          <input type="text" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} required className={inputClass} />
                          <input type="text" value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})} placeholder="Description (optional)" className={inputClass} />
                          <input type="datetime-local" value={editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : ''} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} required className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-2 self-end">
                          <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors">Save</button>
                          <button type="button" onClick={() => setEditingTask(null)} className="text-xs text-gray-400 hover:text-gray-900 text-center">Cancel</button>
                        </div>
                      </form>
                    )}

                    {loading ? (
                      <p className="text-gray-400 text-sm">Loading...</p>
                    ) : filteredPersonal.length === 0 ? (
                      <p className="text-gray-300 text-sm">No personal tasks for this subject.</p>
                    ) : (
                      filteredPersonal.map(task => (
                        <TaskRow key={task.id} task={task} isAdmin={false} />
                      ))
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-300 text-sm">Select a subject</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Tasks