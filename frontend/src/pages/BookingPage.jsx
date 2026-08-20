import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchDoctors, bookAppointment } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Alert from '../components/ui/Alert'

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
]

const STEPS = ['Choose Doctor', 'Pick Date', 'Select Time']

const inputClass =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 transition-all focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60'

function formatDisplayDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeToMinutes(value) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function slotToMinutes(slot) {
  const [time, period] = slot.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (period === 'AM' && hours === 12) hours = 0
  if (period === 'PM' && hours !== 12) hours += 12
  return hours * 60 + minutes
}

export default function BookingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === String(doctorId)),
    [doctors, doctorId]
  )

  const availableTimeSlots = useMemo(() => {
    const start = timeToMinutes(selectedDoctor?.available_from)
    const end = timeToMinutes(selectedDoctor?.available_to)
    if (start === null || end === null) return []
    return TIME_SLOTS.filter((slot) => {
      const slotMinutes = slotToMinutes(slot)
      return slotMinutes >= start && slotMinutes <= end
    })
  }, [selectedDoctor])

  const currentStep = !doctorId ? 0 : !date ? 1 : 2

  useEffect(() => {
    fetchDoctors()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.doctors ?? []
        setDoctors(list)
      })
      .catch(() => setError('Failed to load doctors. Please try again later.'))
      .finally(() => setLoadingDoctors(false))
  }, [])
  
  useEffect(() => {
    if (time && !availableTimeSlots.includes(time)) setTime('')
  }, [availableTimeSlots, time])
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!doctorId || !date || !time) {
      setError('Please select a doctor, date, and time slot.')
      return
    }

    if (!user?.id) {
      setError('Your patient account is not available. Please sign in again.')
      return
    }

    setSubmitting(true)

    try {
      const result = await bookAppointment({ doctorId, patientId: user.id, date, time })

      if (result.status === 409) {
        setError('This time slot is already booked.')
        return
      }

      if (result.status === 201) {
        setSuccess('Appointment booked successfully! Redirecting to your dashboard...')
        setTimeout(() => navigate('/dashboard'), 1800)
        return
      }

      setError('Unable to book appointment. Please try again.')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-8 animate-fade-in-up">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Book an Appointment</h1>
          <p className="text-slate-500 mt-1.5">Choose your doctor, preferred date, and an available time slot.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 sm:gap-0 sm:justify-between mb-8 animate-fade-in-up animate-delay-100">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i <= currentStep
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < currentStep ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${i <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`hidden sm:block flex-1 h-0.5 mx-4 rounded ${i < currentStep ? 'bg-teal-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 animate-fade-in-up animate-delay-200">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              {error && <div className="mb-6"><Alert variant="error">{error}</Alert></div>}
              {success && <div className="mb-6"><Alert variant="success">{success}</Alert></div>}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Doctor selection */}
                <fieldset>
                  <legend className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">1</span>
                    Select a Doctor
                  </legend>

                  {loadingDoctors ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-20 rounded-xl skeleton" />
                      ))}
                    </div>
                  ) : doctors.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-4">No doctors available at the moment.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {doctors.map((doctor) => {
                        const selected = String(doctor.id) === String(doctorId)
                        return (
                          <button
                            key={doctor.id}
                            type="button"
                            onClick={() => setDoctorId(String(doctor.id))}
                            className={`text-left p-4 rounded-xl border-2 transition-all ${
                              selected
                                ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-4 ring-teal-500/10'
                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-teal-600' : 'bg-slate-200'}`}>
                                <svg className={`w-5 h-5 ${selected ? 'text-white' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{doctor.name}</p>
                                <p className="text-sm text-slate-500 mt-0.5">{doctor.specialty || 'General Practice'}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </fieldset>

                {/* Date */}
                <fieldset>
                  <legend className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">2</span>
                    Choose a Date
                  </legend>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={!doctorId}
                    className={inputClass}
                  />
                </fieldset>

                {/* Time slots */}
                <fieldset>
                  <legend className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">3</span>
                    Pick a Time Slot
                  </legend>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableTimeSlots.length === 0 ? (
                      <p className="col-span-full text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
                        Select a doctor with configured availability to view time slots.
                      </p>
                    ) : availableTimeSlots.map((slot) => {
                      const selected = time === slot
                      const disabled = !date
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => setTime(slot)}
                          className={`py-2.5 px-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-teal-500 bg-teal-600 text-white shadow-md shadow-teal-500/25'
                              : disabled
                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                                : 'border-slate-100 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50'
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={submitting || !doctorId || !date || !time}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/25 focus:outline-none focus:ring-4 focus:ring-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Confirming booking...
                    </span>
                  ) : (
                    'Confirm Appointment'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1 animate-fade-in-up animate-delay-300">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
              <h3 className="font-bold text-slate-900 text-lg mb-5">Booking Summary</h3>

              <dl className="space-y-4">
                <div className="pb-4 border-b border-slate-100">
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Doctor</dt>
                  <dd className="font-semibold text-slate-900">
                    {selectedDoctor ? selectedDoctor.name : '—'}
                  </dd>
                  {selectedDoctor?.specialty && (
                    <dd className="text-sm text-slate-500 mt-0.5">{selectedDoctor.specialty}</dd>
                  )}
                </div>

                <div className="pb-4 border-b border-slate-100">
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatDisplayDate(date) || '—'}
                  </dd>
                </div>

                <div className="pb-4 border-b border-slate-100">
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Time</dt>
                  <dd className="font-semibold text-slate-900">{time || '—'}</dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient</dt>
                  <dd className="font-semibold text-slate-900">{user?.name || '—'}</dd>
                  <dd className="text-sm text-slate-500 mt-0.5">{user?.email}</dd>
                </div>
              </dl>

              <div className="mt-6 p-4 bg-teal-50 rounded-xl border border-teal-100">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-teal-800 leading-relaxed">
                    Please arrive 10 minutes before your scheduled time. Bring a valid ID and insurance card if applicable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
