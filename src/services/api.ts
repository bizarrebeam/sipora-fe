const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'

export async function getApiStatus() {
  const response = await fetch(API_BASE_URL)
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(json.message || 'Failed to connect to backend')
  }
  return json
}

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(json.message || `API Error: ${response.status}`)
  }
  return json.data
}

export async function apiPost(endpoint: string, payload: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
  const json = await response.json()
  if (!response.ok || json.status === 'error') {
    throw new Error(json.message || `API Error: ${response.status}`)
  }
  return json.data
}