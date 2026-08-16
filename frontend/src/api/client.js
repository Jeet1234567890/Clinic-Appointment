const API_BASE = 'http://localhost:5000/api'

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Login failed')
  }

  return data
}

export async function registerUser({ name, email, password, role = 'patient' }) {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed')
  }

  return data
}

export async function fetchDoctors() {
  const response = await fetch(`${API_BASE}/doctors`)
  if (!response.ok) {
    throw new Error('Failed to fetch doctors')
  }
  return response.json()
}

export async function bookAppointment({ doctorId, patientId, date, time }) {
  const response = await fetch(`${API_BASE}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctor_id: doctorId,
      patient_id: patientId,
      date,
      time,
    }),
  })

  return {
    ok: response.ok,
    status: response.status,
    data: response.status !== 204 ? await response.json().catch(() => null) : null,
  }
}
