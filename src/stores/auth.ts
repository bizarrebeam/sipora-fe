import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiPost, apiAuthGet, apiAuthPost } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

interface User {
  role: string
  nama_lengkap: string
  nisn?: string
  username?: string
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  // Load user data from localStorage on init
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('user')
    }
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  function setUser(userData: User) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  async function login(identifier: string, password: string) {
    const loader = useLoadingStore()
    loader.show('Sedang masuk...')
    try {
      const data = await apiPost('akun/login/', { identifier, password })
      setTokens(data.access, data.refresh)
      setUser({ role: data.role, nama_lengkap: data.nama_lengkap })
      return data
    } finally {
      loader.hide()
    }
  }

  async function register(nisn: string, nama_lengkap: string, password: string, konfirmasi_password: string) {
    const loader = useLoadingStore()
    loader.show('Mendaftarkan akun...')
    try {
      await apiPost('akun/register/', { nisn, nama_lengkap, password, konfirmasi_password })
    } finally {
      loader.hide()
    }
  }

  async function logout() {
    const loader = useLoadingStore()
    loader.show('Keluar dari akun...')
    try {
      if (refreshToken.value) {
        try {
          await apiAuthPost('akun/logout/', { refresh: refreshToken.value })
        } catch {
          // Token may already be blacklisted or expired
        }
      }
      clearAuth()
    } finally {
      loader.hide()
    }
  }

  async function fetchProfile() {
    const loader = useLoadingStore()
    loader.show('Memuat profil...')
    try {
      const data = await apiAuthGet('akun/me/')
      setUser(data)
      return data
    } finally {
      loader.hide()
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    clearAuth
  }
})
