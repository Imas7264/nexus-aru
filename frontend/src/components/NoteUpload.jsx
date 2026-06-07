import { useState } from 'react';
import api from '../api/axios';

function NoteUpload({ subjects, onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CLASS_NOTES');
  const [subjectId, setSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showMessage('Please select a file', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('subjectId', subjectId);
    formData.append('file', file);

    try {
      await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('Upload successful!', 'success');
      setTitle('');
      setDescription('');
      setCategory('CLASS_NOTES');
      setSubjectId('');
      setFile(null);
      const fileInput = document.getElementById('uploadFile');
      if (fileInput) fileInput.value = '';
      onUploadSuccess();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-8 mb-8">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Upload Study Material</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className="w-full border-b border-gray-200 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-transparent resize-none"
        />
        <div className="flex gap-4">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 text-sm text-gray-500 focus:outline-none bg-transparent border-b border-gray-200 py-2"
          >
            <option value="CLASS_NOTES">Class Notes</option>
            <option value="ASSIGNMENT">Assignment</option>
            <option value="EXPERIMENT">Experiment</option>
          </select>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            required
            className="flex-1 text-sm text-gray-500 focus:outline-none bg-transparent border-b border-gray-200 py-2"
          >
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <input
          id="uploadFile"
          type="file"
          onChange={e => setFile(e.target.files[0])}
          required
          className="text-sm text-gray-500"
        />
        <button
          type="submit"
          disabled={uploading}
          className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {message && (
          <p className={`text-xs ${messageType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default NoteUpload;