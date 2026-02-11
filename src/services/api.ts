const API_BASE_URL = '/api/'

export async function getApiStatus() {
  const response = await fetch(API_BASE_URL)
  if (!response.ok) {
    throw new Error('Failed to connect to backend')
  }
  return response.json()
}

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  return response.json()
}

export async function apiPost(endpoint: string, data: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  return response.json()
}