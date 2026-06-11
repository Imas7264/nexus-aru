import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/axios'

const TABS = [
  { label: 'Users', value: 'users' },
  { label: 'Subjects', value: 'subjects' },
]

function Manage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('users')

  // Users state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Subjects state
  const [subjects, setSubjects] = useState([])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user.role !== 'ADMIN') { navigate('/announcements'); return }
    fetchUsers()
    fetchSubjects()
  }, [])

  function showMsg(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  // ── Users ──
  async function fetchUsers() {
    setUsersLoading(true)
    try {
      const res = await api.get('/auth/users')
      setUsers(res.data)
    } catch (err) {
      setError('Failed to fetch users')
    }
    setUsersLoading(false)
  }

  async function handleMakeAdmin(userId, name) {
    if (!confirm(`Make ${name} an admin?`)) return
    try {
      await api.post(`/auth/make-admin/${userId}`)
      showMsg(`${name} is now an admin.`)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role')
    }
  }

  async function handleRemoveAdmin(userId, name) {
    if (!confirm(`Remove admin role from ${name}?`)) return
    try {
      await api.patch(`/auth/remove-admin/${userId}`)
      showMsg(`${name} is now a student.`)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role')
    }
  }

  async function handleDeleteUser(userId, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await api.delete(`/auth/users/${userId}`)
      showMsg(`${name} deleted.`)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user')
    }
  }

  // ── Subjects ──
  async function fetchSubjects() {
    setSubjectsLoading(true)
    try {
      const res = await api.get('/notes/subjects')
      setSubjects(res.data)
    } catch (err) {
      setError('Failed to fetch subjects')
    }
    setSubjectsLoading(false)
  }

  async function handleCreateSubject(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/notes/subjects', { name: newSubjectName })
      setNewSubjectName('')
      showMsg('Subject created.')
      fetchSubjects()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subject')
    }
  }

  async function handleDeleteSubject(subjectId, name) {
    if (!confirm(`Delete subject "${name}"? This will also delete all associated notes and tasks.`)) return
    try {
      await api.delete(`/notes/subjects/${subjectId}`)
      showMsg(`"${name}" deleted.`)
      fetchSubjects()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete subject')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Admin Panel</h1>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        {message && <p className="text-green-600 text-xs mb-4">{message}</p>}

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setError('') }}
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

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <>
            {usersLoading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-300 text-sm">No users found.</p>
            ) : (
              <>
                <div className="flex items-center gap-4 pb-3 border-b border-gray-100 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest w-28">Moodle ID</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex-1">Name</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest w-24">Department</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest w-12">Div</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest w-14">Batch</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest w-16">Role</span>
                  <span className="w-36"></span>
                </div>

                {users.map(u => (
                  <div key={u.id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500 w-28">{u.moodleId}</span>
                    <span className="text-sm text-gray-900 font-medium flex-1">{u.name}</span>
                    <span className="text-sm text-gray-500 w-24 truncate">{u.department || '—'}</span>
                    <span className="text-sm text-gray-500 w-12">{u.division || '—'}</span>
                    <span className="text-sm text-gray-500 w-14">{u.batch || '—'}</span>
                    <span className={`text-xs font-medium w-16 ${u.role === 'ADMIN' ? 'text-gray-900' : 'text-gray-400'}`}>
                      {u.role}
                    </span>
                    <div className="flex items-center gap-4 w-36 justify-end">
                      {u.id !== user.id && (
                        u.role === 'ADMIN' ? (
                          <button
                            onClick={() => handleRemoveAdmin(u.id, u.name)}
                            className="text-xs text-gray-400 hover:text-gray-900 transition-colors underline"
                          >
                            Remove admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMakeAdmin(u.id, u.name)}
                            className="text-xs text-gray-400 hover:text-gray-900 transition-colors underline"
                          >
                            Make admin
                          </button>
                        )
                      )}
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── Subjects tab ── */}
        {activeTab === 'subjects' && (
          <>
            {/* Create subject form */}
            <form onSubmit={handleCreateSubject} className="flex gap-3 items-center mb-12 pb-8 border-b border-gray-100">
              <input
                type="text"
                placeholder="New subject name"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                required
                className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
              />
              <button
                type="submit"
                className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors"
              >
                Create Subject
              </button>
            </form>

            {subjectsLoading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : subjects.length === 0 ? (
              <p className="text-gray-300 text-sm">No subjects yet.</p>
            ) : (
              subjects.map(s => (
                <div key={s.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-900">{s.name}</span>
                  <button
                    onClick={() => handleDeleteSubject(s.id, s.name)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </>
        )}

      </div>
    </Layout>
  )
}

export default Manage