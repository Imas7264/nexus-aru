import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Announcements from './pages/Announcements'
import Channels from './pages/Channels'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/announcements" element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          } />
          <Route path="/channels" element={
            <ProtectedRoute>
              <Channels />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/announcements" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App