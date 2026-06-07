import { useState, useEffect } from 'react';
import api from '../api/axios';

function TaskManager({ subjects, user }) {
  const [adminTasks, setAdminTasks] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreatePersonalTask, setShowCreatePersonalTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [showTaskStats, setShowTaskStats] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '', description: '', dueDate: '', subjectId: '', forBatch: ''
  });
  const [newPersonalTask, setNewPersonalTask] = useState({
    title: '', description: '', dueDate: '', subjectId: ''
  });

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks/my-tasks');
      setAdminTasks(response.data.adminTasks || []);
      setPersonalTasks(response.data.personalTasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createAdminTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/admin', newTask);
      showMessage('Admin task created!', 'success');
      setShowCreateTask(false);
      setNewTask({ title: '', description: '', dueDate: '', subjectId: '', forBatch: '' });
      fetchTasks();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const createPersonalTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/personal', newPersonalTask);
      showMessage('Personal task created!', 'success');
      setShowCreatePersonalTask(false);
      setNewPersonalTask({ title: '', description: '', dueDate: '', subjectId: '' });
      fetchTasks();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const updatePersonalTask = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/personal/${editingTask.id}`, editingTask);
      showMessage('Task updated!', 'success');
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const deletePersonalTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/personal/${taskId}`);
      fetchTasks();
      showMessage('Task deleted', 'success');
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleComplete = async (taskId, isAdmin, isCurrentlyCompleted) => {
    const url = isCurrentlyCompleted 
      ? `/tasks/undo/${taskId}`
      : `/tasks/complete/${taskId}`;
    try {
      await api.post(url, {});
      fetchTasks();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const viewTaskStats = async (taskId, taskTitle) => {
    try {
      const response = await api.get(`/tasks/admin/stats/${taskId}`);
      setTaskStats(response.data);
      setShowTaskStats(taskTitle);
      setTimeout(() => setShowTaskStats(null), 5000);
    } catch (err) {
      alert('Failed to load stats');
    }
  };

  return (
    <div>
      <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Task Manager</h1>

      {message && (
        <p className={`text-xs mb-4 ${messageType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}

      {showTaskStats && taskStats && (
        <div className="bg-gray-50 p-4 mb-6 text-sm">
          <p className="font-medium">📊 Stats for: {showTaskStats}</p>
          <p className="text-gray-500 text-xs mt-1">Total Students: {taskStats.totalStudents}</p>
          <p className="text-gray-500 text-xs">Completed: {taskStats.completedCount}</p>
          <p className="text-gray-500 text-xs">Pending: {taskStats.pendingCount}</p>
        </div>
      )}

      {/* Admin Tasks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Admin Tasks</h2>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateTask(!showCreateTask)}
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
            >
              {showCreateTask ? 'Cancel' : '+ Create Task'}
            </button>
          )}
        </div>

        {showCreateTask && user.role === 'ADMIN' && (
          <form onSubmit={createAdminTask} className="mb-6 p-4 bg-gray-50">
            <input
              type="text"
              placeholder="Title"
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={e => setNewTask({...newTask, description: e.target.value})}
              rows={2}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
            />
            <input
              type="datetime-local"
              value={newTask.dueDate}
              onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            />
            <select
              value={newTask.subjectId}
              onChange={e => setNewTask({...newTask, subjectId: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={newTask.forBatch}
              onChange={e => setNewTask({...newTask, forBatch: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
            >
              <option value="">All Batches</option>
              <option value="A1">Batch A1</option>
              <option value="A2">Batch A2</option>
              <option value="A3">Batch A3</option>
            </select>
            <button type="submit" className="bg-gray-900 text-white text-xs px-4 py-2">Create</button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : adminTasks.length === 0 ? (
          <p className="text-gray-300 text-sm">No admin tasks assigned.</p>
        ) : (
          adminTasks.map(task => (
            <div key={task.id} className="border-b border-gray-100 pb-4 mb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    📂 {task.subject?.name} | 📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleComplete(task.id, true, task.isCompleted)}
                    className={`text-xs ${task.isCompleted ? 'text-gray-400' : 'text-green-600'} hover:underline`}
                  >
                    {task.isCompleted ? 'Undo' : 'Complete'}
                  </button>
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => viewTaskStats(task.id, task.title)}
                      className="text-xs text-gray-400 hover:text-gray-900"
                    >
                      Stats
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Personal Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Personal Tasks</h2>
          <button
            onClick={() => { setShowCreatePersonalTask(!showCreatePersonalTask); setEditingTask(null); }}
            className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            {showCreatePersonalTask ? 'Cancel' : '+ Add Task'}
          </button>
        </div>

        {showCreatePersonalTask && (
          <form onSubmit={createPersonalTask} className="mb-6 p-4 bg-gray-50">
            <input
              type="text"
              placeholder="Title"
              value={newPersonalTask.title}
              onChange={e => setNewPersonalTask({...newPersonalTask, title: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            />
            <textarea
              placeholder="Description"
              value={newPersonalTask.description}
              onChange={e => setNewPersonalTask({...newPersonalTask, description: e.target.value})}
              rows={2}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
            />
            <input
              type="datetime-local"
              value={newPersonalTask.dueDate}
              onChange={e => setNewPersonalTask({...newPersonalTask, dueDate: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            />
            <select
              value={newPersonalTask.subjectId}
              onChange={e => setNewPersonalTask({...newPersonalTask, subjectId: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="submit" className="bg-gray-900 text-white text-xs px-4 py-2">Create</button>
          </form>
        )}

        {editingTask && (
          <form onSubmit={updatePersonalTask} className="mb-6 p-4 bg-gray-50">
            <input
              type="text"
              value={editingTask.title}
              onChange={e => setEditingTask({...editingTask, title: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            />
            <textarea
              value={editingTask.description || ''}
              onChange={e => setEditingTask({...editingTask, description: e.target.value})}
              rows={2}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
            />
            <input
              type="datetime-local"
              value={editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : ''}
              onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            />
            <select
              value={editingTask.subjectId || ''}
              onChange={e => setEditingTask({...editingTask, subjectId: parseInt(e.target.value)})}
              className="w-full border-b border-gray-200 py-2 text-sm mb-3 bg-transparent focus:outline-none"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-gray-900 text-white text-xs px-4 py-2">Save</button>
              <button type="button" onClick={() => setEditingTask(null)} className="text-xs text-gray-400">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : personalTasks.length === 0 ? (
          <p className="text-gray-300 text-sm">No personal tasks.</p>
        ) : (
          personalTasks.map(task => (
            <div key={task.id} className="border-b border-gray-100 pb-4 mb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    📂 {task.subject?.name} | 📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleComplete(task.id, false, task.status === 'COMPLETED')}
                    className={`text-xs ${task.status === 'COMPLETED' ? 'text-gray-400' : 'text-green-600'} hover:underline`}
                  >
                    {task.status === 'COMPLETED' ? 'Undo' : 'Complete'}
                  </button>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-xs text-gray-400 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePersonalTask(task.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskManager;