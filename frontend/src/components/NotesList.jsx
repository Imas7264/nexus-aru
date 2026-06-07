import { useState } from 'react';
import api from '../api/axios';

function NotesList({ notes, loading, onDownload, onDelete, user }) {
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (noteId, fileName) => {
    setDownloadingId(noteId);
    try {
      const response = await api.get(`/notes/download/${noteId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onDownload();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-sm">Loading materials...</p>;
  }

  if (notes.length === 0) {
    return <p className="text-gray-300 text-sm">No study materials found.</p>;
  }

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <div key={note.id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{note.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>📂 {note.subject?.name}</span>
                <span>📁 {note.category?.replace('_', ' ')}</span>
                <span>📥 {note.downloadCount || 0} downloads</span>
                <span>👤 {note.uploadedBy?.name}</span>
              </div>
              {note.description && (
                <p className="text-sm text-gray-600 mt-2">{note.description}</p>
              )}
              <p className="text-xs text-gray-300 mt-1">
                📅 {new Date(note.uploadedAt).toLocaleDateString()}
                {note.fileSize && ` | 💾 ${note.fileSize.toFixed(2)} MB`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(note.id, note.fileName)}
                disabled={downloadingId === note.id}
                className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
              >
                {downloadingId === note.id ? 'Downloading...' : 'Download'}
              </button>
              {(note.uploadedById === user?.id || user?.role === 'ADMIN') && (
                <button
                  onClick={() => onDelete(note.id)}
                  className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotesList;