const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
import { useAuthStore } from '@/stores/auth'
import { useNotFoundStore } from '@/stores/notFound'
import { useServerErrorStore } from '@/stores/serverError'

/**
 * Core API Service
 * 
 * Provides centralized network request methods with built-in JWT authentication,
 * centralized error deserialization, and global interception for 401/403/404 statuses.
 * 
 * Note: All successful Django REST Framework responses are expected to be wrapped natively
 * by CoreJSONRenderer: { status: "success", message: string, data: any }
 */
const SERVER_ERROR_STATUSES = [500, 502, 503, 504]

function checkServerError(status: number) {
  if (SERVER_ERROR_STATUSES.includes(status)) {
    const errorStore = useServerErrorStore()
    errorStore.show()
    // Throw to bypass further processing (like response.json())
    throw new Error(`Server Error: ${status}`)
  }
  return false
}

function handleNetworkError(error: any) {
  const errorStore = useServerErrorStore()
  
  // 1. Connection failures (fetch failures)
  const isFetchError = error instanceof TypeError || (error instanceof Error && error.message?.toLowerCase().includes('fetch'))
  
  // 2. Parsing failures (often means server returned HTML error page instead of JSON)
  const isParsingError = error instanceof SyntaxError || (error instanceof Error && error.message?.toLowerCase().includes('json'))

  if (isFetchError || isParsingError) {
    errorStore.show()
  }
  
  throw error
}

/**
 * Performs a lightweight health check to verify backend connectivity.
 * 
 * @throws {Error} If the server is unreachable or returns a 500 status.
 * @returns {Promise<any>} The parsed health check JSON response.
 */
export async function getApiStatus() {
  try {
    const response = await fetch(API_BASE_URL, { 
      credentials: 'include',
      cache: 'no-store' 
    })
    
    checkServerError(response.status)
    
    const json = await response.json()
    if (!response.ok || json.status === 'error') {
      throw new Error(json.message || 'Failed to connect to backend')
    }
    return json
  } catch (err) {
    handleNetworkError(err)
  }
}

/**
 * Extracts a human-readable string from Django's nested error responses.
 * 
 * @param json The deserialized error JSON payload.
 * @param status The HTTP status code of the failed request.
 * @returns {string} The prioritized error message.
 */
function parseError(json: any, status: number): string {
  if (json.status === 'error' && json.message) {
    return json.message
  }

  // Fallback: concatenate detail or multi-field validation keys
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

  // Final fallback layer
  return json.detail || json.message || `Terjadi kesalahan (${status}).`
}

/**
 * Executes a public (unauthenticated) GET request.
 * 
 * @param endpoint The API URI to request (relative to VITE_API_BASE_URL).
 * @throws {Error} Extracted standard error message if the response is not OK.
 * @returns {Promise<any>} The unwrapped `data` payload.
 */
export async function apiGet(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
      credentials: 'include',
      cache: 'no-store'
    })

    checkServerError(response.status)

    const json = await response.json()
    if (!response.ok || json.status === 'error') {
      throw new Error(parseError(json, response.status))
    }
    return json.data
  } catch (err) {
    handleNetworkError(err)
  }
}

/**
 * Executes a public (unauthenticated) POST request.
 * 
 * @param endpoint The API URI to request.
 * @param payload The request body to be serialized as JSON.
 * @throws {Error} Extracted standard error message if the response is not OK.
 * @returns {Promise<any>} The unwrapped `data` payload.
 */
export async function apiPost(endpoint: string, payload: object) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    checkServerError(response.status)

    const json = await response.json()
    if (!response.ok || json.status === 'error') {
      throw new Error(parseError(json, response.status))
    }
    // CoreJSONRenderer wraps in { status, message, data }
    return json.data
  } catch (err) {
    handleNetworkError(err)
  }
}

let refreshingPromise: Promise<boolean> | null = null

/**
 * Centrally manages the token refresh lifecycle.
 * Ensures only one refresh request is active at a time to prevent token race conditions.
 * 
 * @returns {Promise<boolean>} True if refresh succeeded, False otherwise.
 */
async function handleRefresh() {
  if (refreshingPromise) return refreshingPromise
  
  const authStore = useAuthStore()
  refreshingPromise = authStore.refreshSession()
  
  const result = await refreshingPromise
  refreshingPromise = null
  return result
}

/**
 * Executes an authenticated GET request, silently attaching HTTP-Only session cookies.
 * Globally intercepts 401 Unauthorized errors to attempt a 'Silent Refresh' before failing.
 * 
 * @param endpoint The protected API URI to request.
 * @throws {Error} Extracted standard error message if the response is not OK.
 * @returns {Promise<any>} The unwrapped `data` payload.
 */
export async function apiAuthGet(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      cache: 'no-store'
    })

    if (response.status === 401) {
      const refreshed = await handleRefresh()
      if (refreshed) {
        // Retry the original request exactly once
        return await apiAuthGet(endpoint)
      }
      
      const authStore = useAuthStore()
      authStore.setSessionExpired(true)
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }

    checkServerError(response.status)

    const json = await response.json()
    if (!response.ok || json.status === 'error') {
      if (response.status === 403 || response.status === 404) {
        const notFoundStore = useNotFoundStore()
        notFoundStore.show()
        throw new Error('Halaman tidak ditemukan.')
      }
      throw new Error(parseError(json, response.status))
    }
    return json.data
  } catch (err) {
    handleNetworkError(err)
  }
}

/**
 * Executes an authenticated POST request, silently attaching HTTP-Only session cookies.
 * Globally intercepts 401 Unauthorized errors to attempt a 'Silent Refresh' before failing.
 * 
 * @param endpoint The protected API URI to request.
 * @param payload The request body to be serialized as JSON.
 * @throws {Error} Extracted standard error message if the response is not OK.
 * @returns {Promise<any>} The unwrapped `data` payload.
 */
export async function apiAuthPost(endpoint: string, payload: object) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 401) {
      const refreshed = await handleRefresh()
      if (refreshed) {
        return await apiAuthPost(endpoint, payload)
      }
      
      const authStore = useAuthStore()
      authStore.setSessionExpired(true)
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }

    checkServerError(response.status)

    const json = await response.json()
    if (!response.ok || json.status === 'error') {
      if (response.status === 403) {
        const notFoundStore = useNotFoundStore()
        notFoundStore.show()
        throw new Error('Anda tidak memiliki akses.')
      }
      throw new Error(parseError(json, response.status))
    }
    return json.data
  } catch (err) {
    handleNetworkError(err)
  }
}

/**
 * Executes an authenticated PUT (update) request, silently attaching HTTP-Only session cookies.
 * Globally intercepts 401 Unauthorized errors to attempt a 'Silent Refresh' before failing.
 * 
 * @param endpoint The protected API URI to request.
 * @param payload The request body to be serialized as JSON.
 * @throws {Error} Extracted standard error message if the response is not OK.
 * @returns {Promise<any>} The unwrapped `data` payload.
 */
export async function apiAuthPut(endpoint: string, payload: object) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 401) {
      const refreshed = await handleRefresh()
      if (refreshed) {
        return await apiAuthPut(endpoint, payload)
      }
      
      const authStore = useAuthStore()
      authStore.setSessionExpired(true)
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    }

    checkServerError(response.status)

    const json = await response.json()
    if (!response.ok || json.status === 'error') {
      if (response.status === 403) {
        const notFoundStore = useNotFoundStore()
        notFoundStore.show()
        throw new Error('Anda tidak memiliki akses.')
      }
      throw new Error(parseError(json, response.status))
    }
    return json.data
  } catch (err) {
    handleNetworkError(err)
  }
}