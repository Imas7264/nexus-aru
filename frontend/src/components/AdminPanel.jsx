import { useState } from 'react';
import api from '../api/axios';

function AdminPanel({ subjects, onSubjectsChange, user }) {
  const [usersList, setUsersList] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notes/subjects', { name: newSubjectName });
      showMessage('Subject created!', 'success');
      setNewSubjectName('');
      onSubjectsChange();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const saveSubjectEdit = async (id) => {
    try {
      await api.put(`/notes/subjects/${id}`, { name: editingSubjectName });
      setEditingSubjectId(null);
      setEditingSubjectName('');
      onSubjectsChange();
      showMessage('Subject updated!', 'success');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!confirm(`Delete "${name}"? All notes in this subject will be deleted.`)) return;
    try {
      await api.delete(`/notes/subjects/${id}`);
      onSubjectsChange();
      showMessage('Subject deleted!', 'success');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsersList(response.data);
      showMessage('User list refreshed!', 'success');
    } catch (err) {
      showMessage('Failed to fetch users', 'error');
    }
  };

  const makeAdmin = async (userId, userMoodleId) => {
    if (!confirm(`Make ${userMoodleId} an admin?`)) return;
    try {
      await api.post(`/auth/make-admin/${userId}`, {});
      showMessage(`${userMoodleId} is now admin!`, 'success');
      fetchAllUsers();
    } catch (err) {
      showMessage('Failed to make admin', 'error');
    }
  };

  const deleteUser = async (userId, userMoodleId) => {
    if (!confirm(`Delete "${userMoodleId}"?`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      showMessage(`User ${userMoodleId} deleted!`, 'success');
      fetchAllUsers();
    } catch (err) {
      showMessage('Failed to delete user', 'error');
    }
  };

  if (user.role !== 'ADMIN') return null;

  return (
    <div className="mb-12 pb-8 border-b border-gray-100">
      <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Admin Panel</h1>

      {message && (
        <p className={`text-xs mb-4 ${messageType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {/* Create Subject */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Create Subject</h2>
        <form onSubmit={handleCreateSubject} className="flex gap-3">
          <input
            type="text"
            placeholder="Subject name"
            value={newSubjectName}
            onChange={e => setNewSubjectName(e.target.value)}
            required
            className="flex-1 border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-gray-900 bg-transparent"
          />
          <button type="submit" className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-4 py-2">
            Create
          </button>
        </form>
      </div>

      {/* Manage Subjects */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Manage Subjects</h2>
        <div className="space-y-2">
          {subjects.map(subj => (
            <div key={subj.id} className="flex justify-between items-center py-2 border-b border-gray-100">
              {editingSubjectId === subj.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={editingSubjectName}
                    onChange={e => setEditingSubjectName(e.target.value)}
                    className="flex-1 border-b border-gray-200 py-1 text-sm focus:outline-none bg-transparent"
                  />
                  <button onClick={() => saveSubjectEdit(subj.id)} className="text-xs text-green-600">Save</button>
                  <button onClick={() => setEditingSubjectId(null)} className="text-xs text-gray-400">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-900">
                    {subj.name} ({subj._count?.notes || 0} notes)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSubjectId(subj.id);
                        setEditingSubjectName(subj.name);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subj.id, subj.name)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">User Management</h2>
          <button onClick={fetchAllUsers} className="text-xs text-gray-400 hover:text-gray-900">
            Refresh Users
          </button>
        </div>
        {usersList.map(u => (
          <div key={u.id} className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-900">
              {u.moodleId} - {u.name} ({u.role})
            </span>
            <div className="flex gap-2">
              {u.role !== 'ADMIN' && (
                <button
                  onClick={() => makeAdmin(u.id, u.moodleId)}
                  className="text-xs text-gray-400 hover:text-gray-900"
                >
                  Make Admin
                </button>
              )}
              {u.id !== user.id && (
                <button
                  onClick={() => deleteUser(u.id, u.moodleId)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;