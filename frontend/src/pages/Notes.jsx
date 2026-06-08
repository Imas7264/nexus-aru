import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../api/axios'

const CATEGORIES = [
  { label: 'Assignments', value: 'ASSIGNMENT' },
  { label: 'Experiments', value: 'EXPERIMENT' },
  { label: 'Notes', value: 'CLASS_NOTES' },
  { label: 'Other', value: 'OTHER' },
]

function Notes() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('ASSIGNMENT')
  const [notes, setNotes] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newFile, setNewFile] = useState(null)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { fetchSubjects() }, [])

  useEffect(() => {
    if (selectedSubject) fetchNotes(selectedSubject.id, selectedCategory)
  }, [selectedSubject, selectedCategory])

  async function fetchSubjects() {
    try {
      const res = await api.get('/notes/subjects')
      setSubjects(res.data)
      if (res.data.length > 0) setSelectedSubject(res.data[0])
    } catch (err) { console.error(err) }
  }

  async function fetchNotes(subjectId, category) {
    try {
      const res = await api.get(`/notes/notes?subjectId=${subjectId}&category=${category}`)
      setNotes(res.data)
    } catch (err) { console.error(err) }
  }

  async function handleUpload(e) {
    e.preventDefault()
    setError('')
    if (!newFile) { setError('Please select a file'); return }
    setUploading(true)
    const formData = new FormData()
    formData.append('title', newTitle)
    formData.append('description', newDescription)
    formData.append('category', selectedCategory)
    formData.append('subjectId', selectedSubject.id)
    formData.append('file', newFile)
    try {
      await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMessage('Uploaded successfully!')
      setNewTitle('')
      setNewDescription('')
      setNewFile(null)
      setShowUploadForm(false)
      const fi = document.getElementById('noteFile')
      if (fi) fi.value = ''
      setTimeout(() => setMessage(''), 3000)
      fetchNotes(selectedSubject.id, selectedCategory)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(noteId, fileName) {
    setDownloadingId(noteId)
    try {
      const res = await api.get(`/notes/download/${noteId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      fetchNotes(selectedSubject.id, selectedCategory)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(noteId) {
    if (!confirm('Delete this note?')) return
    try {
      await api.delete(`/notes/notes/${noteId}`)
      fetchNotes(selectedSubject.id, selectedCategory)
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  async function handleCreateSubject(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/notes/subjects', { name: newSubjectName })
      setNewSubjectName('')
      fetchSubjects()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subject')
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Notes Exchange</h1>

        {/* Admin: create subject */}
        {user.role === 'ADMIN' && (
          <form onSubmit={handleCreateSubject} className="flex gap-3 items-center mb-12 pb-8 border-b border-gray-100">
            <input
              type="text"
              placeholder="New subject name"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              required
              className="flex-1 border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
            />
            <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors">
              Create Subject
            </button>
          </form>
        )}

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        {message && <p className="text-green-600 text-xs mb-4">{message}</p>}

        <div className="flex gap-12">

          {/* Left: subjects list */}
          <div className="w-40 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Subjects</p>
            {subjects.length === 0 && <p className="text-gray-300 text-sm">No subjects yet</p>}
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubject(s); setSelectedCategory('ASSIGNMENT'); setShowUploadForm(false) }}
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

          {/* Right: content */}
          <div className="flex-1">
            {selectedSubject ? (
              <>
                {/* Subject name + category tabs */}
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-sm font-semibold text-gray-900">{selectedSubject.name}</h2>
                </div>

                <div className="flex gap-6 mb-8 border-b border-gray-100">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                        selectedCategory === cat.value
                          ? 'text-gray-900 font-medium border-gray-900'
                          : 'text-gray-400 hover:text-gray-900 border-transparent'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Upload toggle + form */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {showUploadForm ? 'Cancel' : '+ Upload'}
                  </button>
                </div>

                {showUploadForm && (
                  <form onSubmit={handleUpload} className="flex gap-3 mb-8 pb-6 border-b border-gray-100">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        placeholder="Title"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        required
                        className="w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        className="w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
                      />
                      <input
                        id="noteFile"
                        type="file"
                        onChange={e => setNewFile(e.target.files[0])}
                        className="text-sm text-gray-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors self-end disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </form>
                )}

                {/* Notes list */}
                {notes.length === 0 && <p className="text-gray-300 text-sm">No materials found.</p>}
                {notes.map(note => (
                  <div key={note.id} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
                    <p className="text-sm text-gray-800 leading-relaxed mb-2">{note.title}</p>
                    {note.description && (
                      <p className="text-xs text-gray-500 mb-2">{note.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {note.uploadedBy?.name} · {new Date(note.uploadedAt).toLocaleString()}
                        {note.fileSize && ` · ${note.fileSize.toFixed(2)} MB`}
                        {` · ${note.downloadCount || 0} downloads`}
                      </span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleDownload(note.id, note.fileName)}
                          disabled={downloadingId === note.id}
                          className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {downloadingId === note.id ? 'Downloading...' : 'Download'}
                        </button>
                        {(note.uploadedById === user?.id || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDelete(note.id)}
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
              <p className="text-gray-300 text-sm">Select a subject</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Notes