import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api/axios';
import NoteUpload from '../components/NoteUpload';
import Filters from '../components/Filters';
import NotesList from '../components/NotesList';
import AdminPanel from '../components/AdminPanel';

function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/notes/subjects');
      setSubjects(response.data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      let url = '/notes/notes';
      const params = [];
      if (filterSubject) params.push(`subjectId=${filterSubject}`);
      if (filterCategory) params.push(`category=${filterCategory}`);
      if (params.length) url += '?' + params.join('&');
      
      const response = await api.get(url);
      setNotes(response.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
    setLoading(false);
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/notes/${noteId}`);
      fetchNotes();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [filterSubject, filterCategory]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-8">Notes Exchange</h1>
        
        <AdminPanel subjects={subjects} onSubjectsChange={fetchSubjects} user={user} />
        <NoteUpload subjects={subjects} onUploadSuccess={fetchNotes} />
        <Filters
          subjects={subjects}
          filterSubject={filterSubject}
          setFilterSubject={setFilterSubject}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          onApply={fetchNotes}
        />
        <NotesList
          notes={notes}
          loading={loading}
          onDownload={fetchNotes}
          onDelete={handleDeleteNote}
          user={user}
        />
      </div>
    </Layout>
  );
}

export default Notes;