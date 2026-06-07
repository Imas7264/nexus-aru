import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../api/axios'

function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [content, setContent] = useState('')
  const [type, setType] = useState('IMPORTANT')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    try {
      const res = await api.get('/announcements')
      setAnnouncements(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handlePost(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/announcements', { content, type })
      setContent('')
      fetchAnnouncements()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post')
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/announcements/${id}`)
      fetchAnnouncements()
    } catch (err) {
      console.error(err)
    }
  }

  const important = announcements.filter(a => a.type === 'IMPORTANT')
  const optional = announcements.filter(a => a.type === 'OPTIONAL')

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Announcements</h1>

        {user.role === 'ADMIN' && (
          <form onSubmit={handlePost} className="flex gap-3 items-start mb-12 pb-8 border-b border-gray-100">
            <textarea
              placeholder="Write an announcement..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={2}
              className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors resize-none bg-transparent"
            />
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-sm text-gray-500 focus:outline-none bg-transparent border-b border-gray-200 py-2 pr-2"
            >
              <option value="IMPORTANT">Important</option>
              <option value="OPTIONAL">Optional</option>
            </select>
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors"
            >
              Post
            </button>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </form>
        )}

        <div className="grid grid-cols-2 gap-12">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Important</h2>
            {important.length === 0 && <p className="text-gray-300 text-sm">Nothing here yet</p>}
            {important.map(a => (
              <div key={a.id} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
                <p className="text-sm text-gray-800 leading-relaxed mb-2">{a.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {a.createdBy.name} · {new Date(a.createdAt).toLocaleString()}
                  </span>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Optional</h2>
            {optional.length === 0 && <p className="text-gray-300 text-sm">Nothing here yet</p>}
            {optional.map(a => (
              <div key={a.id} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
                <p className="text-sm text-gray-800 leading-relaxed mb-2">{a.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {a.createdBy.name} · {new Date(a.createdAt).toLocaleString()}
                  </span>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Announcements