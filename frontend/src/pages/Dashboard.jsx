import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { fetchPatientAppointments } from '../api/client'
import Alert from '../components/ui/Alert'

const SPECIALTY_COLORS = {
  'General Practice': 'from-blue-500 to-indigo-500',
  Cardiology: 'from-rose-500 to-pink-500',
  Dermatology: 'from-amber-500 to-orange-500',
  'Internal Medicine': 'from-violet-500 to-purple-500',
  'Emergency Medicine': 'from-red-500 to-orange-500',
  Pediatrics: 'from-pink-500 to-red-500',
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const loadAppointments = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchPatientAppointments(token)
        setAppointments(data.appointments || [])
      } catch (err) {
        setError(err.message || 'Failed to load appointments')
        console.error('Error fetching appointments:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [token])

  const nextAppointment = appointments.length > 0 ? appointments[0] : null
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled'
      case 'cancelled':
        return 'Cancelled'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero welcome */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-600 p-8 sm:p-10 shadow-xl shadow-teal-500/20 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-teal-100 font-medium text-sm uppercase tracking-wider mb-2">
                Patient Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-teal-50 mt-2 text-lg max-w-lg">
                You have <span className="font-semibold text-white">{appointments.length} upcoming visit{appointments.length !== 1 ? 's' : ''}</span> scheduled.
              </p>
            </div>

            <Link
              to="/book"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Book New Appointment
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up animate-delay-100">
          {[
            { label: 'Upcoming Visits', value: appointments.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
            { label: 'Next Visit', value: nextAppointment ? formatShortDate(nextAppointment.date) : '—', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
            { label: 'Doctors Seen', value: new Set(appointments.map(a => a.doctor?.id)).size, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Appointments list */}
        <section className="animate-fade-in-up animate-delay-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Appointments</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your scheduled visits at a glance</p>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full animate-spin mb-4" style={{ borderRadius: '50%', background: 'conic-gradient(from 0deg, #14b8a6, #06b6d4, #14b8a6)', opacity: 0.3 }} />
              <p className="text-slate-600 font-medium">Loading your appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No appointments scheduled</p>
              <p className="text-sm text-slate-400 mt-1 mb-6">Book your first visit with a specialist</p>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                Book your first appointment
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment, index) => {
                const specialty = appointment.doctor?.specialty || 'Unknown Specialty'
                const gradient = SPECIALTY_COLORS[specialty] || 'from-teal-500 to-cyan-500'
                const statusColor = getStatusColor(appointment.status)
                const statusLabel = getStatusLabel(appointment.status)
                
                return (
                  <article
                    key={appointment.id}
                    className="group bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-teal-100 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-lg">{appointment.doctor?.name || 'Unknown Doctor'}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                            {statusLabel}
                          </span>
                          {index === 0 && appointment.status === 'scheduled' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              Next up
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 font-medium">{specialty}</p>
                      </div>

                      <div className="flex sm:flex-col items-start sm:items-end gap-3 sm:gap-1 sm:text-right shrink-0 pl-0 sm:pl-4 sm:border-l border-slate-100">
                        <div className="flex items-center gap-2 text-slate-900">
                          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold text-sm">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-sm">{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
