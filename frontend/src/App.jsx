import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Announcements from './pages/Announcements'
import Channels from './pages/Channels'
import axios from 'axios'

const API_URL = 'http://localhost:3000'


function App() {
 // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  
  // Login form state
  const [moodleId, setMoodleId] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Notes state
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState('CLASS_NOTES')
  const [uploadSubjectId, setUploadSubjectId] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadMessageType, setUploadMessageType] = useState('')
  
  // Task state
  const [adminTasks, setAdminTasks] = useState([])
  const [personalTasks, setPersonalTasks] = useState([])
  const [taskStats, setTaskStats] = useState({})
  const [showTaskStats, setShowTaskStats] = useState(null)
  const [taskLoading, setTaskLoading] = useState(false)
  
  // Create task form state
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    subjectId: '',
    forBatch: ''
  })
  
  // Create personal task form
  const [showCreatePersonalTask, setShowCreatePersonalTask] = useState(false)
  const [newPersonalTask, setNewPersonalTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    subjectId: ''
  })
  
  // Edit personal task
  const [editingTask, setEditingTask] = useState(null)
  
  // User management state
  const [usersList, setUsersList] = useState([])
  
  // Subject management state
  const [newSubjectName, setNewSubjectName] = useState('')
  const [subjectMessage, setSubjectMessage] = useState('')
  const [subjectMessageType, setSubjectMessageType] = useState('')
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [editingSubjectName, setEditingSubjectName] = useState('')
  
  // Filters
  const [filterSubject, setFilterSubject] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  
  // Register form state
  const [showRegister, setShowRegister] = useState(false)
  const [registerMessage, setRegisterMessage] = useState('')
  const [registerMessageType, setRegisterMessageType] = useState('')
  const [registerData, setRegisterData] = useState({
    moodleId: '',
    password: '',
    name: '',
    division: '',
    batch: ''
  })
  
  // Helper function to show temporary messages
  const showTemporaryMessage = (setMessageFunc, setTypeFunc, message, type, duration = 3000) => {
    setMessageFunc(message)
    setTypeFunc(type)
    setTimeout(() => {
      setMessageFunc('')
      setTypeFunc('')
    }, duration)
  }
  
  // Load data when logged in
  useEffect(() => {
    if (token) {
      fetchSubjects()
      fetchNotes()
      fetchTasks()
    }
  }, [token, filterSubject, filterCategory])
  
  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubjects(response.data)
    } catch (err) {
      console.error('Failed to fetch subjects:', err)
    }
  }
  
  const fetchNotes = async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/notes/notes`
      const params = []
      if (filterSubject) params.push(`subjectId=${filterSubject}`)
      if (filterCategory) params.push(`category=${filterCategory}`)
      if (params.length) url += '?' + params.join('&')
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotes(response.data)
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
    setLoading(false)
  }
  
  // ============ TASK FUNCTIONS ============
  
  const fetchTasks = async () => {
    setTaskLoading(true)
    try {
      const response = await axios.get(`${API_URL}/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAdminTasks(response.data.adminTasks || [])
      setPersonalTasks(response.data.personalTasks || [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
    setTaskLoading(false)
  }
  
  const createAdminTask = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/tasks/admin`, newTask, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Admin task created successfully!', 'success')
      setShowCreateTask(false)
      setNewTask({ title: '', description: '', dueDate: '', subjectId: '', forBatch: '' })
      fetchTasks()
    } catch (err) {
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const createPersonalTask = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/tasks/personal`, newPersonalTask, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Personal task created!', 'success')
      setShowCreatePersonalTask(false)
      setNewPersonalTask({ title: '', description: '', dueDate: '', subjectId: '' })
      fetchTasks()
    } catch (err) {
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const updatePersonalTask = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`${API_URL}/tasks/personal/${editingTask.id}`, editingTask, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Task updated!', 'success')
      setEditingTask(null)
      fetchTasks()
    } catch (err) {
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const deletePersonalTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await axios.delete(`${API_URL}/tasks/personal/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTasks()
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Task deleted', 'success')
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message))
    }
  }
  
  const toggleComplete = async (taskId, isAdmin, isCurrentlyCompleted) => {
    const url = isCurrentlyCompleted 
      ? `${API_URL}/tasks/undo/${taskId}`
      : `${API_URL}/tasks/complete/${taskId}`
    
    try {
      await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchTasks()
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message))
    }
  }
  
  const viewTaskStats = async (taskId, taskTitle) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/admin/stats/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTaskStats(response.data)
      setShowTaskStats(taskTitle)
      setTimeout(() => setShowTaskStats(null), 5000)
    } catch (err) {
      alert('Failed to load stats')
    }
  }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        moodleId,
        password
      })
      setToken(response.data.token)
      setUser(response.data.user)
      setIsLoggedIn(true)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed')
      setTimeout(() => setLoginError(''), 3000)
    }
  }
  
  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/auth/register`, registerData)
      showTemporaryMessage(setRegisterMessage, setRegisterMessageType, 'Registration successful! Please login.', 'success')
      setTimeout(() => {
        setShowRegister(false)
        setRegisterData({ moodleId: '', password: '', name: '', division: '', batch: '' })
      }, 2000)
    } catch (err) {
      showTemporaryMessage(setRegisterMessage, setRegisterMessageType, err.response?.data?.error || 'Registration failed', 'error')
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    setToken('')
  }
  
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Please select a file', 'error')
      return
    }
    
    const formData = new FormData()
    formData.append('title', uploadTitle)
    formData.append('description', uploadDescription)
    formData.append('category', uploadCategory)
    formData.append('subjectId', uploadSubjectId)
    formData.append('file', uploadFile)
    
    try {
      await axios.post(`${API_URL}/notes/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Upload successful!', 'success')
      setUploadTitle('')
      setUploadDescription('')
      setUploadCategory('CLASS_NOTES')
      setUploadSubjectId('')
      setUploadFile(null)
      const fileInput = document.getElementById('fileInput')
      if (fileInput) fileInput.value = ''
      fetchNotes()
    } catch (err) {
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Upload failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const handleDownload = async (noteId, fileName) => {
    try {
      const response = await axios.get(`${API_URL}/notes/download/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      fetchNotes()
    } catch (err) {
      alert('Download failed')
    }
  }
  
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return
    try {
      await axios.delete(`${API_URL}/notes/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotes()
      showTemporaryMessage(setUploadMessage, setUploadMessageType, 'Note deleted!', 'success')
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message))
    }
  }
  
  const handleCreateSubject = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/notes/subjects`, 
        { name: newSubjectName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Subject created!', 'success')
      setNewSubjectName('')
      fetchSubjects()
    } catch (err) {
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const startEditSubject = (id, name) => {
    setEditingSubjectId(id)
    setEditingSubjectName(name)
  }
  
  const cancelSubjectEdit = () => {
    setEditingSubjectId(null)
    setEditingSubjectName('')
  }
  
  const saveSubjectEdit = async (id) => {
    try {
      await axios.put(`${API_URL}/notes/subjects/${id}`,
        { name: editingSubjectName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEditingSubjectId(null)
      setEditingSubjectName('')
      fetchSubjects()
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Subject updated!', 'success')
    } catch (err) {
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const handleDeleteSubject = async (id, name) => {
    if (!confirm(`Delete "${name}"? All notes in this subject will be deleted.`)) return
    try {
      await axios.delete(`${API_URL}/notes/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchSubjects()
      fetchNotes()
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Subject deleted!', 'success')
    } catch (err) {
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Failed: ' + (err.response?.data?.error || err.message), 'error')
    }
  }
  
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsersList(response.data)
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'User list refreshed!', 'success')
    } catch (err) {
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Failed to fetch users', 'error')
    }
  }
  
  const makeAdmin = async (userId, userMoodleId) => {
    if (!confirm(`Make ${userMoodleId} an admin?`)) return
    try {
      await axios.post(`${API_URL}/auth/make-admin/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, `${userMoodleId} is now admin!`, 'success')
      fetchAllUsers()
    } catch (err) {
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Failed to make admin', 'error')
    }
  }
  
  const deleteUser = async (userId, userMoodleId) => {
    if (!confirm(`Delete "${userMoodleId}"? This will also delete their notes.`)) return
    try {
      await axios.delete(`${API_URL}/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, `User ${userMoodleId} deleted!`, 'success')
      fetchAllUsers()
    } catch (err) {
      showTemporaryMessage(setSubjectMessage, setSubjectMessageType, 'Failed to delete user', 'error')
    }
  }
  
  // Check for saved login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])
  
  const messageStyles = {
    success: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
    error: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }
  }
  
  // Login/Register Form
  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', fontFamily: 'Arial' }}>
        <h1>📚 NEXUS-ARU</h1>
        
        {!showRegister ? (
          <>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Moodle ID" value={moodleId} onChange={(e) => setMoodleId(e.target.value)} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>Login</button>
            </form>
            {loginError && <p style={{ ...messageStyles.error, padding: '10px', marginTop: '10px', borderRadius: '4px' }}>{loginError}</p>}
            <p style={{ marginTop: '16px' }}>Don't have an account? <button onClick={() => setShowRegister(true)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>Register here</button></p>
          </>
        ) : (
          <>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <input type="text" placeholder="Moodle ID" value={registerData.moodleId} onChange={(e) => setRegisterData({...registerData, moodleId: e.target.value})} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <input type="password" placeholder="Password" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <input type="text" placeholder="Full Name" value={registerData.name} onChange={(e) => setRegisterData({...registerData, name: e.target.value})} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <input type="text" placeholder="Division (e.g., A2)" value={registerData.division} onChange={(e) => setRegisterData({...registerData, division: e.target.value})} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <input type="text" placeholder="Batch (e.g., B1)" value={registerData.batch} onChange={(e) => setRegisterData({...registerData, batch: e.target.value})} style={{ width: '100%', padding: '8px', margin: '8px 0' }} required />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none' }}>Register</button>
            </form>
            {registerMessage && <p style={{ ...messageStyles[registerMessageType], padding: '10px', marginTop: '10px', borderRadius: '4px' }}>{registerMessage}</p>}
            <p style={{ marginTop: '16px' }}>Already have an account? <button onClick={() => setShowRegister(false)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>Login here</button></p>
          </>
        )}
      </div>
    )
  }
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/announcements" element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          } />
          <Route path="/channels" element={
            <ProtectedRoute>
              <Channels />
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={<Navigate to="/announcements" />} />
          <Route path="/" element={
           <ProtectedRoute>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                <div>
                  <h1>📚 NEXUS-ARU</h1>
                  <p>Welcome, <strong>{user.name}</strong>! (Role: {user.role} | Division: {user.division} | Batch: {user.batch})</p>
                </div>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
              </div>
              
              {/* ============ TASK MANAGER SECTION ============ */}
              <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #28a745', borderRadius: '8px', background: '#f0fff0' }}>
                <h3>✅ Task Manager</h3>
                
                {/* Show task stats popup */}
                {showTaskStats && (
                  <div style={{ marginBottom: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
                    <strong>📊 Stats for: {showTaskStats}</strong><br />
                    Total Students: {taskStats.totalStudents}<br />
                    Completed: {taskStats.completedCount}<br />
                    Pending: {taskStats.pendingCount}
                  </div>
                )}
                
                {/* Admin Tasks Section (visible to all students) */}
                <div style={{ marginBottom: '20px' }}>
                  <h4>📋 Admin Tasks (CR Assignments)</h4>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => setShowCreateTask(!showCreateTask)} style={{ marginBottom: '10px', padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {showCreateTask ? 'Cancel' : '+ Create Task for Students'}
                    </button>
                  )}
                  
                  {/* Create Admin Task Form */}
                  {showCreateTask && user.role === 'ADMIN' && (
                    <form onSubmit={createAdminTask} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <h5>Create Admin Task</h5>
                      <input type="text" placeholder="Title" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
                      <textarea placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} rows="2" />
                      <input type="datetime-local" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
                      <select value={newTask.subjectId} onChange={(e) => setNewTask({...newTask, subjectId: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <select value={newTask.forBatch} onChange={(e) => setNewTask({...newTask, forBatch: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }}>
                        <option value="">All Batches</option>
                        <option value="A1">Batch A1</option>
                        <option value="A2">Batch A2</option>
                        <option value="A3">Batch A3</option>
                      </select>
                      <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Task</button>
                    </form>
                  )}
                  
                  {taskLoading ? <p>Loading tasks...</p> : (
                    adminTasks.length === 0 ? <p style={{ color: '#666' }}>No admin tasks assigned.</p> : (
                      adminTasks.map(task => (
                        <div key={task.id} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', marginBottom: '10px', background: task.isCompleted ? '#e8f5e9' : 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <strong>{task.title}</strong>
                              {task.description && <p style={{ margin: '5px 0', fontSize: '14px' }}>{task.description}</p>}
                              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                                📂 {task.subject?.name} | 📅 Due: {new Date(task.dueDate).toLocaleDateString()} | 👤 Created by: {task.createdBy?.name}
                              </p>
                            </div>
                            <div>
                              <button onClick={() => toggleComplete(task.id, true, task.isCompleted)} style={{ marginRight: '5px', padding: '5px 10px', background: task.isCompleted ? '#ffc107' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {task.isCompleted ? '↩️ Undo' : '✅ Complete'}
                              </button>
                              {user.role === 'ADMIN' && (
                                <button onClick={() => viewTaskStats(task.id, task.title)} style={{ padding: '5px 10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📊 Stats</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
                
                {/* Personal Tasks Section */}
                <div>
                  <h4>📝 My Personal Tasks</h4>
                  <button onClick={() => { setShowCreatePersonalTask(!showCreatePersonalTask); setEditingTask(null); }} style={{ marginBottom: '10px', padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {showCreatePersonalTask ? 'Cancel' : '+ Add Personal Task'}
                  </button>
                  
                  {/* Create Personal Task Form */}
                  {showCreatePersonalTask && (
                    <form onSubmit={createPersonalTask} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <h5>Create Personal Task</h5>
                      <input type="text" placeholder="Title" value={newPersonalTask.title} onChange={(e) => setNewPersonalTask({...newPersonalTask, title: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
                      <textarea placeholder="Description" value={newPersonalTask.description} onChange={(e) => setNewPersonalTask({...newPersonalTask, description: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} rows="2" />
                      <input type="datetime-local" value={newPersonalTask.dueDate} onChange={(e) => setNewPersonalTask({...newPersonalTask, dueDate: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
                      <select value={newPersonalTask.subjectId} onChange={(e) => setNewPersonalTask({...newPersonalTask, subjectId: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                    </form>
                  )}
                  
                  {/* Edit Personal Task Form */}
                  {editingTask && (
                    <form onSubmit={updatePersonalTask} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ffc107', borderRadius: '4px', background: '#fff3cd' }}>
                      <h5>Edit Task</h5>
                      <input type="text" placeholder="Title" value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
                      <textarea placeholder="Description" value={editingTask.description || ''} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} rows="2" />
                      <input type="datetime-local" value={editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : ''} onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required />
                      <select value={editingTask.subjectId || ''} onChange={(e) => setEditingTask({...editingTask, subjectId: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', margin: '5px 0' }} required>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button type="submit" style={{ marginRight: '5px', padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                      <button type="button" onClick={() => setEditingTask(null)} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </form>
                  )}
                  
                  {taskLoading ? <p>Loading...</p> : (
                    personalTasks.length === 0 ? <p style={{ color: '#666' }}>No personal tasks. Add one above.</p> : (
                      personalTasks.map(task => (
                        <div key={task.id} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', marginBottom: '10px', background: task.status === 'COMPLETED' ? '#e8f5e9' : 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <strong>{task.title}</strong>
                              {task.description && <p style={{ margin: '5px 0', fontSize: '14px' }}>{task.description}</p>}
                              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                                📂 {task.subject?.name} | 📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <button onClick={() => toggleComplete(task.id, false, task.status === 'COMPLETED')} style={{ marginRight: '5px', padding: '5px 10px', background: task.status === 'COMPLETED' ? '#ffc107' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {task.status === 'COMPLETED' ? '↩️ Undo' : '✅ Complete'}
                              </button>
                              <button onClick={() => setEditingTask(task)} style={{ marginRight: '5px', padding: '5px 10px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️ Edit</button>
                              <button onClick={() => deletePersonalTask(task.id)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
              
              {/* ============ ADMIN PANEL ============ */}
              {user.role === 'ADMIN' && (
                <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #007bff', borderRadius: '8px', background: '#f0f8ff' }}>
                  <h3>🔧 Admin Panel</h3>
                  <h4>➕ Create New Subject</h4>
                  <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input type="text" placeholder="Subject name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} style={{ flex: 1, padding: '8px' }} required />
                    <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                  </form>
                  {subjectMessage && <p style={{ ...messageStyles[subjectMessageType], padding: '8px', marginBottom: '10px', borderRadius: '4px' }}>{subjectMessage}</p>}
                  
                  <h4>📖 Manage Subjects</h4>
                  {subjects.map(subj => (
                    <div key={subj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                      {editingSubjectId === subj.id ? (
                        <>
                          <input type="text" value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)} style={{ padding: '5px' }} />
                          <button onClick={() => saveSubjectEdit(subj.id)} style={{ marginLeft: '5px', padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                          <button onClick={cancelSubjectEdit} style={{ marginLeft: '5px', padding: '5px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <span>{subj.name} ({subj._count?.notes || 0} notes)</span>
                          <div>
                            <button onClick={() => startEditSubject(subj.id, subj.name)} style={{ marginRight: '5px', padding: '5px 10px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => handleDeleteSubject(subj.id, subj.name)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  <h4>👥 User Management</h4>
                  <button onClick={fetchAllUsers} style={{ marginBottom: '10px', padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Refresh Users</button>
                  {usersList.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #eee' }}>
                      <span>{u.moodleId} - {u.name} ({u.role})</span>
                      <div>
                        {u.role !== 'ADMIN' && <button onClick={() => makeAdmin(u.id, u.moodleId)} style={{ marginRight: '5px', padding: '5px 10px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Make Admin</button>}
                        {u.id !== user.id && <button onClick={() => deleteUser(u.id, u.moodleId)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* ============ NOTES EXCHANGE SECTION ============ */}
              <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3>📤 Upload Study Material</h3>
                <form onSubmit={handleUpload}>
                  <input type="text" placeholder="Title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} required />
                  <textarea placeholder="Description" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} rows="2" />
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} style={{ flex: 1, padding: '8px' }}>
                      <option value="CLASS_NOTES">Class Notes</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="EXPERIMENT">Experiment</option>
                    </select>
                    <select value={uploadSubjectId} onChange={(e) => setUploadSubjectId(e.target.value)} style={{ flex: 1, padding: '8px' }} required>
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <input id="fileInput" type="file" onChange={(e) => setUploadFile(e.target.files[0])} style={{ width: '100%', marginBottom: '10px' }} required />
                  <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Upload</button>
                  {uploadMessage && <p style={{ ...messageStyles[uploadMessageType], padding: '8px', marginTop: '10px', borderRadius: '4px' }}>{uploadMessage}</p>}
                </form>
              </div>
              
              {/* Filters */}
              <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3>🔍 Filters</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} style={{ flex: 1, padding: '8px' }}>
                    <option value="">All Subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ flex: 1, padding: '8px' }}>
                    <option value="">All Categories</option>
                    <option value="CLASS_NOTES">Class Notes</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="EXPERIMENT">Experiment</option>
                  </select>
                  <button onClick={fetchNotes} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply</button>
                </div>
              </div>
              
              {/* Notes List */}
              <div>
                <h3>📄 Study Materials ({notes.length} items)</h3>
                {loading && <p>Loading...</p>}
                {!loading && notes.length === 0 && <p>No notes found.</p>}
                {notes.map(note => (
                  <div key={note.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '10px', background: '#f9f9f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <h4>{note.title}</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>📂 {note.subject?.name} | 📁 {note.category?.replace('_', ' ')} | 📥 {note.downloadCount || 0} downloads | 👤 {note.uploadedBy?.name}</p>
                        {note.description && <p>{note.description}</p>}
                        <p style={{ fontSize: '12px', color: '#999' }}>📅 {new Date(note.uploadedAt).toLocaleDateString()} | 💾 {note.fileSize?.toFixed(2)} MB</p>
                      </div>
                      <div>
                        <button onClick={() => handleDownload(note.id, note.fileName)} style={{ marginRight: '5px', padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Download</button>
                        {(note.uploadedById === user.id || user.role === 'ADMIN') && <button onClick={() => handleDeleteNote(note.id)} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
           </ProtectedRoute>
          }/>
        </Routes>
      
      
      </BrowserRouter>
    </AuthProvider>
  )
}





export default App