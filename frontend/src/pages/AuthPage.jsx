import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import Alert from '../components/ui/Alert'

const FEATURES = [
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Easy online scheduling' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Trusted healthcare professionals' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Real-time slot availability' },
]

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'

export default function AuthPage() {
  const { login, register, isAuthenticated } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (!isLogin && !name) {
      setError('Please enter your name.')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-auth-panel relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Logo size="lg" light />

          <div className="space-y-8 animate-fade-in-up">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                Healthcare made<br />simple for you
              </h1>
              <p className="mt-4 text-lg text-teal-100 leading-relaxed max-w-md">
                Book appointments with top specialists in minutes. Manage your visits from one secure portal.
              </p>
            </div>

            <ul className="space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature.label} className="flex items-center gap-3 text-teal-50">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                    </svg>
                  </div>
                  <span className="font-medium">{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-teal-200/80">
            Join thousands of patients who trust ClinicCare
          </p>
        </div>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center bg-mesh px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-slate-500 mt-1.5">
                {isLogin
                  ? 'Sign in to manage your appointments'
                  : 'Register to start booking with our doctors'}
              </p>
            </div>

            <div className="flex p-1 rounded-xl bg-slate-100 mb-8">
              {['Sign in', 'Register'].map((label, i) => {
                const active = (i === 0) === isLogin
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setIsLogin(i === 0); setError('') }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputClass}
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/25 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign in to your account' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
