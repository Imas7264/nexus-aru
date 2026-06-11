import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Announcements', path: '/announcements' },
    { label: 'Channels', path: '/channels' },
    { label: 'Notes', path: '/notes' },
    { label: 'Tasks', path: '/tasks' },
    ...(user.role === 'ADMIN' ? [{ label: 'Users', path: '/users' }] : []),
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <nav className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-sm tracking-widest text-gray-900 uppercase">
          Nexus – ARU
        </span>
        <div className="flex items-center gap-8">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-sm transition-colors ${
                location.pathname === item.path
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400">{user.moodleId} · {user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1 px-8 py-10">
        {children}
      </main>
    </div>
  )
}

export default Layout