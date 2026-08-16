import { createContext, useContext, useState } from 'react'
import { loginUser, registerUser } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('clinic_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('clinic_token'))

  const persistSession = (payload) => {
    const nextUser = payload.user || {
      id: payload.user_id,
      name: payload.name || payload.email?.split('@')[0],
      email: payload.email || '',
      role: payload.role || 'patient',
    }

    const nextToken = payload.token || null

    localStorage.setItem('clinic_user', JSON.stringify(nextUser))
    if (nextToken) {
      localStorage.setItem('clinic_token', nextToken)
    } else {
      localStorage.removeItem('clinic_token')
    }

    setUser(nextUser)
    setToken(nextToken)
    return nextUser
  }

  const login = async (email, password) => {
    const payload = await loginUser({ email, password })
    return persistSession(payload)
  }

  const register = async (name, email, password) => {
    const payload = await registerUser({ name, email, password, role: 'patient' })
    return persistSession(payload)
  }

  const logout = () => {
    localStorage.removeItem('clinic_user')
    localStorage.removeItem('clinic_token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
