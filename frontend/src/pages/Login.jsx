import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function Login() {
  const [moodleId, setMoodleId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { moodleId, password })
      login(res.data.user, res.data.token)
      navigate('/announcements')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="mb-10">
          <h1 className="text-sm font-bold tracking-widest text-gray-900 uppercase mb-1">
            Nexus – ARU
          </h1>
          <p className="text-gray-400 text-sm">A Network for Academic Resources & Updates</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Moodle ID</label>
            <input
              type="text"
              value={moodleId}
              onChange={e => setMoodleId(e.target.value)}
              placeholder="e.g. 23106093"
              className="mt-1.5 w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}
          <button
            type="submit"
            className="mt-2 w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-2.5 text-sm transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login