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
  const [error, setError] = useState('')

  const defaultChannels = [
    { scope: 'DIVISION',   name: user.division },
    { scope: 'BATCH',      name: String(user.batch) },
    { scope: 'DEPARTMENT', name: user.department },
  ]

  useEffect(() => { fetchChannels() }, [])

  useEffect(() => {
    if (selectedChannel) fetchRequests(selectedChannel.id)
  }, [selectedChannel])

  async function fetchChannels() {
    try {
      const res = await api.get('/channels')
      let all = res.data

      // Seed any of the 3 defaults that don't exist yet
      for (const ch of defaultChannels) {
        if (!ch.name) continue
        const exists = all.find(c => c.name === ch.name && c.scope === ch.scope)
        if (!exists) {
          try { await api.post('/channels', ch) } catch (_) {}
        }
      }

      // Re-fetch after potential seeding
      const seeded = await api.get('/channels')
      all = seeded.data

      // Only show the 3 channels matching this user's division/batch/department
      const visible = all.filter(c =>
        (c.scope === 'DIVISION'   && c.name === user.division) ||
        (c.scope === 'BATCH'      && c.name === String(user.batch)) ||
        (c.scope === 'DEPARTMENT' && c.name === user.department)
      )

      // Fixed order: division → batch → department
      const order = ['DIVISION', 'BATCH', 'DEPARTMENT']
      visible.sort((a, b) => order.indexOf(a.scope) - order.indexOf(b.scope))

      setChannels(visible)
      if (visible.length > 0) setSelectedChannel(visible[0])
    } catch (err) { console.error(err) }
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Request Channels</h1>

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