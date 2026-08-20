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

export async function registerUser({ name, email, phone, password, role = 'patient' }) {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password, role }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed')
  }

  return data
}

export async function verifyOTP({ user_id, email_otp, phone_otp }) {
  const response = await fetch(`${API_BASE}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, email_otp, phone_otp }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'OTP verification failed')
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

export async function fetchPatientAppointments(token) {
  const response = await fetch(`${API_BASE}/patient/appointments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch appointments')
  }

  return data
}

export async function createDoctor(token, { name, email, phone, password, specialty, available_from, available_to }) {
  const response = await fetch(`${API_BASE}/admin/doctors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email, phone, password, specialty, available_from, available_to }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create doctor')
  }

  return data
}

export async function deleteDoctor(token, doctorId) {
  const response = await fetch(`${API_BASE}/admin/doctors/${doctorId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete doctor')
  }

  return data
}

export async function setDoctorUnavailable(token, doctorId, date) {
  const response = await fetch(`${API_BASE}/admin/doctors/${doctorId}/unavailable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ date }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Failed to set doctor unavailable')
  }

  return data
}

export function decodeToken(token) {
  try {
    // Simple JWT decoding (without external library)
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}
