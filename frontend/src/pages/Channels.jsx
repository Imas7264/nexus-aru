import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../api/axios'

function Channels() {
  const { user } = useAuth()
  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [requests, setRequests] = useState([])
  const [newRequest, setNewRequest] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelScope, setNewChannelScope] = useState('DEPARTMENT')
  const [error, setError] = useState('')

  useEffect(() => { fetchChannels() }, [])

  useEffect(() => {
    if (selectedChannel) fetchRequests(selectedChannel.id)
  }, [selectedChannel])

  async function fetchChannels() {
    try {
      const res = await api.get('/channels')
      let all = res.data

      // If no channels exist yet, seed the 3 defaults for this user's scope
      if (all.length === 0 && user.role === 'ADMIN') {
        await seedDefaultChannels()
        const seeded = await api.get('/channels')
        all = seeded.data
      }

      // Filter: only show channels relevant to the current user's scope
      const visible = all.filter(c => {
        if (c.scope === 'DEPARTMENT') return c.name === user.department
        if (c.scope === 'DIVISION')   return c.name === user.division
        if (c.scope === 'BATCH')      return c.name === user.batch
        return true // fallback: show anything unscoped
      })

      setChannels(visible)
      if (visible.length > 0) setSelectedChannel(visible[0])
    } catch (err) { console.error(err) }
  }

  async function seedDefaultChannels() {
    const defaults = [
      { name: user.division,   scope: 'DIVISION'   },
      { name: user.batch,      scope: 'BATCH'       },
      { name: user.department, scope: 'DEPARTMENT'  },
    ]
    for (const ch of defaults) {
      if (!ch.name) continue
      try { await api.post('/channels', ch) } catch (_) {}
    }
  }

  async function fetchRequests(channelId) {
    try {
      const res = await api.get(`/channels/${channelId}/requests`)
      setRequests(res.data)
    } catch (err) { console.error(err) }
  }

  async function handlePostRequest(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/channels/${selectedChannel.id}/requests`, { content: newRequest })
      setNewRequest('')
      fetchRequests(selectedChannel.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post request')
    }
  }

  async function handleStatusChange(requestId, status) {
    try {
      await api.patch(`/channels/${selectedChannel.id}/requests/${requestId}`, { status })
      fetchRequests(selectedChannel.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  async function handleDeleteRequest(requestId) {
    try {
      await api.delete(`/channels/${selectedChannel.id}/requests/${requestId}`)
      fetchRequests(selectedChannel.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete request')
    }
  }

  async function handleCreateChannel(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/channels', { name: newChannelName, scope: newChannelScope })
      setNewChannelName('')
      fetchChannels()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create channel')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Request Channels</h1>

        {user.role === 'ADMIN' && (
          <form onSubmit={handleCreateChannel} className="flex gap-3 items-center mb-12 pb-8 border-b border-gray-100">
            <input
              type="text"
              placeholder="New channel name"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              required
              className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
            />
            <select
              value={newChannelScope}
              onChange={e => setNewChannelScope(e.target.value)}
              className="text-sm text-gray-500 focus:outline-none bg-transparent border-b border-gray-200 py-2 pr-2"
            >
              <option value="DEPARTMENT">Department</option>
              <option value="DIVISION">Division</option>
              <option value="BATCH">Batch</option>
            </select>
            <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors">
              Create
            </button>
          </form>
        )}

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        <div className="flex gap-12">
          <div className="w-40 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Channels</p>
            {channels.length === 0 && <p className="text-gray-300 text-sm">No channels yet</p>}
            {channels.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChannel(c)}
                className={`w-full text-left py-2 text-sm transition-colors block ${
                  selectedChannel?.id === c.id
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-gray-900'
                }`}
              >
                {c.name}
                <span className="text-xs text-gray-300 block">{c.scope}</span>
              </button>
            ))}
          </div>

          <div className="flex-1">
            {selectedChannel ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-sm font-semibold text-gray-900">{selectedChannel.name}</h2>
                  <span className="text-xs text-gray-400">{selectedChannel.scope}</span>
                </div>

                <form onSubmit={handlePostRequest} className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Post a request..."
                    value={newRequest}
                    onChange={e => setNewRequest(e.target.value)}
                    required
                    className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
                  />
                  <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors">
                    Post
                  </button>
                </form>

                {requests.length === 0 && <p className="text-gray-300 text-sm">No requests yet</p>}
                {requests.map(r => (
                  <div key={r.id} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
                    <p className="text-sm text-gray-800 leading-relaxed mb-2">{r.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {r.createdBy.name} · {new Date(r.createdAt).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-medium ${r.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}`}>
                          {r.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                        </span>
                        {r.createdBy.moodleId === user.moodleId && (
                          <button
                            onClick={() => handleStatusChange(r.id, r.status === 'PENDING' ? 'COMPLETED' : 'PENDING')}
                            className="text-xs text-gray-400 hover:text-gray-900 transition-colors underline"
                          >
                            Mark {r.status === 'PENDING' ? 'completed' : 'pending'}
                          </button>
                        )}
                        {(r.createdBy.moodleId === user.moodleId || user.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDeleteRequest(r.id)}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-300 text-sm">Select a channel</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Channels