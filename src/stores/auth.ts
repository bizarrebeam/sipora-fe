import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiPost, apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

interface User {
  id?: number
  role: string
  nama_lengkap: string
  nisn?: string | null
  nuptk?: string | null
  username?: string
  kelas?: string | null
  mata_pelajaran?: string | null
  tahun_ajaran?: string
  semester?: string
  date_joined?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  // Load user data from localStorage on init
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('user')
    }
  }

  const namaDepan = computed(() => {
    if (!user.value?.nama_lengkap) return ''
    return user.value.nama_lengkap.split(' ')[0]
  })

  const roleBadge = computed(() => {
    if (!user.value) return ''
    const map: Record<string, string> = {
      siswa: 'Siswa',
      guru: 'Guru',
      guru_bk: 'Guru BK',
      kemahasiswaan: 'Kemahasiswaan',
    }
    return map[user.value.role] || user.value.role
  })

  function setUser(userData: User) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearAuth() {
    user.value = null
    localStorage.removeItem('access_token') // clean up old items
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  async function login(identifier: string, password: string, allowedRoles?: string[]) {
    const loader = useLoadingStore()
    loader.show('Sedang masuk...')
    try {
      const data = await apiPost('akun/login/', { identifier, password })
      
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(data.role)) {
        throw new Error('Akun Anda tidak memiliki akses ke portal ini.')
      }

      setUser({
        role: data.role,
        nama_lengkap: data.nama_lengkap,
        nisn: data.nisn,
        nuptk: data.nuptk,
        kelas: data.kelas,
        mata_pelajaran: data.mata_pelajaran,
      })
      return data
    } finally {
      loader.hide()
    }
  }

  async function registerSiswa(
    nisn: string,
    nama_lengkap: string,
    kelas: string,
    password: string,
    konfirmasi_password: string,
  ) {
    const loader = useLoadingStore()
    loader.show('Mendaftarkan akun...')
    try {
      await apiPost('akun/register/', { nisn, nama_lengkap, kelas, password, konfirmasi_password })
    } finally {
      loader.hide()
    }
  }

  async function logout() {
    const loader = useLoadingStore()
    loader.show('Keluar dari akun...')
    try {
      try {
        await apiAuthPost('akun/logout/', {})
      } catch {
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

  async function editProfil(payload: { kelas?: string; mata_pelajaran?: string }) {
    const loader = useLoadingStore()
    loader.show('Menyimpan perubahan...')
    try {
      const data = await apiAuthPut('akun/me/edit/', payload)
      setUser(data)
      return data
    } finally {
      loader.hide()
    }
  }

  async function ubahPassword(password_lama: string, password_baru: string) {
    const loader = useLoadingStore()
    loader.show('Mengubah password...')
    try {
      await apiAuthPut('akun/me/password/', { password_lama, password_baru })
    } finally {
      loader.hide()
    }
  }

  return {
    user,
    isAuthenticated,
    namaDepan,
    roleBadge,
    login,
    registerSiswa,
    logout,
    fetchProfile,
    editProfil,
    ubahPassword,
    clearAuth,
  }
})
