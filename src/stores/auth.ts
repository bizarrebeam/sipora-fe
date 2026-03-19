import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiPost, apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'
import { useArtikelStore } from '@/stores/artikel'
import { useAspirasiStore } from '@/stores/aspirasi'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'
import { useLaporanKerusakanStore } from '@/stores/laporanKerusakan'
import { useAlertStore } from '@/stores/alert'

interface User {
  id?: number
  role: string
  nama_lengkap: string
  nis?: string | null
  nuptk?: string | null
  username?: string
  email?: string | null
  kelas?: string | null
  mata_pelajaran?: string | null
  is_verified?: boolean
  tahun_ajaran?: string
  semester?: string
  date_joined?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isSessionExpired = ref(false)
  const isProfileLoaded = ref(false)
  const profileLastFetched = ref(0)

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

  const isVerified = computed(() => !!user.value?.is_verified)

  const verificationLabel = computed(() => {
    if (!user.value || user.value.role !== 'siswa') return ''
    return user.value.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'
  })

  function setUser(userData: User) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function clearAuth() {
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')

    // Reset all other stores
    useArtikelStore().reset()
    useAspirasiStore().reset()
    useLaporanBullyingStore().reset()
    useLaporanKerusakanStore().reset()
    useAlertStore().reset()
    useLoadingStore().reset()
    
    isProfileLoaded.value = false
    profileLastFetched.value = 0
  }

  function setSessionExpired(value: boolean) {
    isSessionExpired.value = value
    if (value) {
      clearAuth()
    }
  }

  async function login(identifier: string, password: string, allowedRoles?: string[]) {
    const loader = useLoadingStore()
    loader.show('Sedang masuk...')
    try {
      const data = await apiPost('akun/login/', { identifier, password })
      
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(data.role)) {
        throw new Error('Akun Anda tidak memiliki akses ke portal ini.')
      }

      isSessionExpired.value = false

      setUser({
        username: data.username,
        role: data.role,
        nama_lengkap: data.nama_lengkap,
        nis: data.nis,
        nuptk: data.nuptk,
        email: data.email,
        kelas: data.kelas,
        mata_pelajaran: data.mata_pelajaran,
        is_verified: data.is_verified,
      })
      return data
    } finally {
      loader.hide()
    }
  }

  async function registerSiswa(
    nis: string,
    nama_lengkap: string,
    email: string,
    kelas: string,
    password: string,
    konfirmasi_password: string,
  ) {
    const loader = useLoadingStore()
    loader.show('Mendaftarkan akun...')
    try {
      await apiPost('akun/register/', { nis, nama_lengkap, email, kelas, password, konfirmasi_password })
    } finally {
      loader.hide()
    }
  }

  async function forgotPassword(nis: string) {
    const loader = useLoadingStore()
    loader.show('Mengirim email reset...')
    try {
      return await apiPost('akun/forgot-password/', { nis })
    } finally {
      loader.hide()
    }
  }

  async function resetPassword(uid: string, token: string, password: string, konfirmasi_password: string) {
    const loader = useLoadingStore()
    loader.show('Mengubah password...')
    try {
      return await apiPost('akun/reset-password/', { uid, token, password, konfirmasi_password })
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
    const CACHE_TIME = 5 * 60 * 1000 // 5 minutes
    const isStale = Date.now() - profileLastFetched.value > CACHE_TIME

    const loader = useLoadingStore()
    if (!isProfileLoaded.value || isStale) {
      loader.show('Memuat profil...')
    }
    try {
      const data = await apiAuthGet('akun/me/')
      setUser(data)
      isProfileLoaded.value = true
      profileLastFetched.value = Date.now()
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
    isSessionExpired,
    isAuthenticated,
    namaDepan,
    roleBadge,
    isVerified,
    verificationLabel,
    login,
    registerSiswa,
    forgotPassword,
    resetPassword,
    logout,
    fetchProfile,
    editProfil,
    ubahPassword,
    clearAuth,
    setSessionExpired,
  }
})
