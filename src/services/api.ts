const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
import { useAuthStore } from '@/stores/auth'
import { useNotFoundStore } from '@/stores/notFound'

/**
 * All Django responses are wrapped by CoreJSONRenderer:
 * Success: { status: "success", message: "...", data: {...} }
 * Error:   { status: "error",   message: "...", data: {...} | null }
 */

export async function getApiStatus() {
  const response = await fetch(API_BASE_URL, { 
    credentials: 'include',
    cache: 'no-store' 
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(json.message || 'Failed to connect to backend')
  }
  return json
}

// Parse the wrapped error from CoreJSONRenderer + core_exception_handler
function parseError(json: any, status: number): string {
  // CoreJSONRenderer now formats all errors as:
  // { status: "error", message: "human-readable first error", data: {...field errors} }
  if (json.status === 'error' && json.message) {
    return json.message
  }

  // Fallback: if data has field-level errors (shouldn't happen with fixed renderer)
  if (json.data && typeof json.data === 'object') {
    const messages: string[] = []
    for (const [key, value] of Object.entries(json.data)) {
      const msgs = Array.isArray(value) ? value : [value]
      for (const m of msgs) {
        messages.push(key === 'non_field_errors' || key === 'detail' ? String(m) : String(m))
      }
    }
    if (messages.length) return messages[0]!
  }

  // Last resort
  return json.detail || json.message || `Terjadi kesalahan (${status}).`
}

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
    credentials: 'include',
    cache: 'no-store'
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(parseError(json, response.status))
  }
  return json.data
}

export async function apiPost(endpoint: string, payload: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    cache: 'no-store'
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    if (response.status === 401) {
      const authStore = useAuthStore()
      authStore.setSessionExpired(true)
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }
    if (response.status === 403 || response.status === 404) {
      const notFoundStore = useNotFoundStore()
      notFoundStore.show()
      
      throw new Error('Halaman tidak ditemukan.')
    }
    throw new Error(parseError(json, response.status))
  }
  return json.data
}

// Authenticated POST request
export async function apiAuthPost(endpoint: string, payload: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    if (response.status === 401) {
      const authStore = useAuthStore()
      authStore.setSessionExpired(true)
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }
    if (response.status === 403) {
      const notFoundStore = useNotFoundStore()
      notFoundStore.show()
      
      throw new Error('Anda tidak memiliki akses.')
    }
    throw new Error(parseError(json, response.status))
  }
  return json.data
}

// Authenticated PUT request
export async function apiAuthPut(endpoint: string, payload: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    if (response.status === 401) {
      const authStore = useAuthStore()
      authStore.setSessionExpired(true)
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }
    if (response.status === 403) {
      const notFoundStore = useNotFoundStore()
      notFoundStore.show()
      
      throw new Error('Anda tidak memiliki akses.')
    }
    throw new Error(parseError(json, response.status))
  }
  return json.data
}