const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'

/**
 * All Django responses are wrapped by CoreJSONRenderer:
 * Success: { status: "success", message: "...", data: {...} }
 * Error:   { status: "error",   message: "...", data: {...} | null }
 */

export async function getApiStatus() {
  const response = await fetch(API_BASE_URL)
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(json.message || 'Failed to connect to backend')
  }
  return json
}

// Parse the wrapped error from CoreJSONRenderer + core_exception_handler
function parseError(json: any, status: number): string {
  // Core exception handler formats: { status: "error", message: "...", data: {...} }
  if (json.message && json.status === 'error') {
    // If data has field-level errors, include them
    if (json.data && typeof json.data === 'object') {
      const fieldErrors = Object.entries(json.data)
        .map(([key, value]) => {
          const msg = Array.isArray(value) ? value.join(', ') : String(value)
          return key === 'non_field_errors' ? msg : `${key}: ${msg}`
        })
        .join('; ')
      if (fieldErrors) return fieldErrors
    }
    return json.message
  }
  // Fallback
  return json.detail || json.message || `API Error: ${status}`
}

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(parseError(json, response.status))
  }
  return json.data
}

export async function apiPost(endpoint: string, payload: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(parseError(json, response.status))
  }
  // CoreJSONRenderer wraps in { status, message, data }
  return json.data
}

// Authenticated GET request
export async function apiAuthGet(endpoint: string) {
  const token = localStorage.getItem('access_token')
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    if (response.status === 401) {
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }
    throw new Error(parseError(json, response.status))
  }
  return json.data
}

// Authenticated POST request
export async function apiAuthPost(endpoint: string, payload: object) {
  const token = localStorage.getItem('access_token')
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload)
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    if (response.status === 401) {
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }
    throw new Error(parseError(json, response.status))
  }
  return json.data
}