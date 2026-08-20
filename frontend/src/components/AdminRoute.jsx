import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { decodeToken } from '../api/client'

export default function AdminRoute({ children }) {
  const { token, isAuthenticated } = useAuth()

  if (!isAuthenticated || !token) {
    return <Navigate to="/" replace />
  }

  // Decode token to check role
  const decoded = decodeToken(token)
  const isAdmin = decoded?.role === 'admin'

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
