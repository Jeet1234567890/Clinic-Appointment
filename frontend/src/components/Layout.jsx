import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-teal-50 text-teal-700'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-mesh">
      <header className="sticky top-0 z-50 glass-header border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="hover:opacity-90 transition-opacity">
              <Logo size="sm" />
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/book" className={navLinkClass}>
                Book Visit
              </NavLink>
            </nav>

            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {getInitials(user.name)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>

      <footer className="border-t border-slate-200/80 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>&copy; 2026 ClinicCare. Your health, our priority.</p>
          <p>Need help? Call <span className="font-medium text-teal-700">(555) 123-4567</span></p>
        </div>
      </footer>
    </div>
  )
}
