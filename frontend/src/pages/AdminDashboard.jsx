import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Alert from '../components/ui/Alert'
import { fetchDoctors, createDoctor, deleteDoctor, setDoctorUnavailable } from '../api/client'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Add Doctor Modal
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [addDoctorLoading, setAddDoctorLoading] = useState(false)
  const [addDoctorForm, setAddDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    available_from: '',
    available_to: '',
  })

  // Set Unavailable
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [unavailableDate, setUnavailableDate] = useState('')
  const [unavailableLoading, setUnavailableLoading] = useState(false)

  // Load doctors on mount
  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchDoctors()
      console.log("data",data)
      setDoctors(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load doctors')
      console.error('Error loading doctors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDoctor = async (e) => {
    e.preventDefault()
    
    if (!addDoctorForm.name || !addDoctorForm.email || !addDoctorForm.phone || !addDoctorForm.password || !addDoctorForm.specialty || !addDoctorForm.available_from || !addDoctorForm.available_to) {
      setError('Please fill in all fields')
      return
    }

    setAddDoctorLoading(true)
    setError('')
    
    try {
      await createDoctor(token, addDoctorForm)
      setSuccess('Doctor added successfully!')
      setAddDoctorForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialty: '',
        available_from: '',
        available_to: '',
      })
      setShowAddDoctor(false)
      await loadDoctors()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to add doctor')
    } finally {
      setAddDoctorLoading(false)
    }
  }

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to delete Dr. ${doctorName}? This action cannot be undone.`)) {
      return
    }

    setError('')
    setLoading(true)

    try {
      await deleteDoctor(token, doctorId)
      setSuccess(`Dr. ${doctorName} has been deleted successfully.`)
      await loadDoctors()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete doctor')
    } finally {
      setLoading(false)
    }
  }

  const handleSetUnavailable = async (e) => {
    e.preventDefault()

    if (!selectedDoctorId || !unavailableDate) {
      setError('Please select a doctor and date')
      return
    }

    setUnavailableLoading(true)
    setError('')

    try {
      const result = await setDoctorUnavailable(token, selectedDoctorId, unavailableDate)
      const doctorName = doctors.find(d => d.id === parseInt(selectedDoctorId))?.name || 'Doctor'
      setSuccess(`Dr. ${doctorName} marked unavailable on ${unavailableDate}. ${result.cancelled_count} patient(s) have been notified.`)
      setSelectedDoctorId('')
      setUnavailableDate('')
      await loadDoctors()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.message || 'Failed to set doctor unavailable')
    } finally {
      setUnavailableLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-600 to-indigo-600 p-8 sm:p-10 shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative">
            <p className="text-purple-100 font-medium text-sm uppercase tracking-wider mb-2">
              Administration
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Doctor Management
            </h1>
            <p className="text-purple-50 mt-2 text-lg max-w-lg">
              Manage doctors, set availability, and handle scheduling.
            </p>
          </div>
        </section>

        {/* Alerts */}
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Doctors List */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Doctors</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage all registered doctors</p>
            </div>
            <button
              onClick={() => setShowAddDoctor(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Doctor
            </button>
          </div>

          {loading && !doctors.length ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <p className="text-slate-600 font-medium">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <p className="text-slate-600 font-medium">No doctors registered</p>
              <button
                onClick={() => setShowAddDoctor(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add first doctor
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Speciality</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{doctor.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{doctor.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{doctor.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{doctor.speciality}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Set Unavailable */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Set Doctor Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">Mark a doctor as unavailable and notify affected patients</p>

          <form onSubmit={handleSetUnavailable} className="space-y-5 max-w-lg">
            <div>
              <label htmlFor="doctorSelect" className="block text-sm font-semibold text-slate-700 mb-2">
                Select Doctor
              </label>
              <select
                id="doctorSelect"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              >
                <option value="">Choose a doctor...</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="unavailableDate" className="block text-sm font-semibold text-slate-700 mb-2">
                Date
              </label>
              <input
                id="unavailableDate"
                type="date"
                value={unavailableDate}
                onChange={(e) => setUnavailableDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={unavailableLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {unavailableLoading ? 'Setting unavailable...' : 'Set Unavailable'}
            </button>
          </form>
        </section>
      </div>

      {/* Add Doctor Modal */}
      {showAddDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Add Doctor</h3>
              <button
                onClick={() => setShowAddDoctor(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={addDoctorForm.name}
                  onChange={(e) => setAddDoctorForm({ ...addDoctorForm, name: e.target.value })}
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addDoctorForm.email}
                  onChange={(e) => setAddDoctorForm({ ...addDoctorForm, email: e.target.value })}
                  placeholder="doctor@clinic.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addDoctorForm.phone}
                  onChange={(e) => setAddDoctorForm({ ...addDoctorForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={addDoctorForm.password}
                  onChange={(e) => setAddDoctorForm({ ...addDoctorForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={addDoctorForm.specialty}
                  onChange={(e) => setAddDoctorForm({ ...addDoctorForm, specialty: e.target.value })}
                  placeholder="Cardiology"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Available From</label>
                  <input
                    type="time"
                    value={addDoctorForm.available_from}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, available_from: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Available To</label>
                  <input
                    type="time"
                    value={addDoctorForm.available_to}
                    onChange={(e) => setAddDoctorForm({ ...addDoctorForm, available_to: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDoctorLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addDoctorLoading ? 'Adding...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
