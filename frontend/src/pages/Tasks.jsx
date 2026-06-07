import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api/axios';
import TaskManager from '../components/TaskManager';

function Tasks() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/notes/subjects');
      setSubjects(response.data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <TaskManager subjects={subjects} user={user} />
      </div>
    </Layout>
  );
}

export default Tasks;