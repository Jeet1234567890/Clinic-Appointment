import { createContext, useContext, useState } from 'react'
import { decodeToken, loginUser, registerUser, verifyOTP } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('clinic_user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('clinic_token'))
  const [pendingUserId, setPendingUserId] = useState(null)

  const persistSession = (payload) => {
    const nextToken = payload.access_token || payload.token || null
    const decodedToken = nextToken ? decodeToken(nextToken) : null
    const nextUser = payload.user || {
      id: payload.user_id,
      name: payload.name || payload.email?.split('@')[0],
      email: payload.email || '',
      role: payload.role || decodedToken?.role || 'patient',
    }

    localStorage.setItem('clinic_user', JSON.stringify(nextUser))
    if (nextToken) {
      localStorage.setItem('clinic_token', nextToken)
    } else {
      localStorage.removeItem('clinic_token')
    }

    setUser(nextUser)
    setToken(nextToken)
    setPendingUserId(null)
    return nextUser
  }

  const login = async (email, password) => {
    const payload = await loginUser({ email, password })
    return persistSession(payload)
  }

  const register = async (name, email, phone, password, role = 'patient') => {
    const payload = await registerUser({ name, email, phone, password, role })
    // Store pending user_id for OTP verification phase
    setPendingUserId(payload.user_id)
    return payload.user_id
  }

  const verifyUserOTP = async (emailOTP, phoneOTP) => {
    if (!pendingUserId) {
      throw new Error('No pending verification')
    }
    
    const payload = await verifyOTP({
      user_id: pendingUserId,
      email_otp: emailOTP,
      phone_otp: phoneOTP,
    })
    
    return persistSession(payload)
  }

  const logout = () => {
    localStorage.removeItem('clinic_user')
    localStorage.removeItem('clinic_token')
    setUser(null)
    setToken(null)
    setPendingUserId(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, verifyUserOTP, logout, isAuthenticated: !!user, hasPendingOTP: !!pendingUserId }}>
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
