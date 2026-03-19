<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { apiAuthGet, apiAuthPost } from '@/services/api'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SChip from '@/components/SChip.vue'
import STextField from '@/components/STextField.vue'
import SDialog from '@/components/SDialog.vue'
import STable from '@/components/STable.vue'
import SDatePicker from '@/components/SDatePicker.vue'
import { useLoadingStore } from '@/stores/loading'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert'

const alertStore = useAlertStore()
const loadingStore = useLoadingStore()
const auth = useAuthStore()

interface AkunItem {
  id: string
  nama_lengkap: string
  nis?: string
  nuptk?: string
  kelas?: string
  mata_pelajaran?: string
  role: string
  is_verified?: boolean
  date_joined: string
}

const siswaList = ref<AkunItem[]>([])
const guruList = ref<AkunItem[]>([])
const guruBkList = ref<AkunItem[]>([])
const siswaTotal = ref(0)
const guruTotal = ref(0)
const guruBkTotal = ref(0)
const search = ref('')
const selectedDate = ref('')
const selectedDateObj = ref<Date | null>(null)
const showDatePicker = ref(false)

watch(selectedDateObj, (newVal: Date | null) => {
  if (newVal) {
    const yyyy = newVal.getFullYear()
    const mm = String(newVal.getMonth() + 1).padStart(2, '0')
    const dd = String(newVal.getDate()).padStart(2, '0')
    selectedDate.value = `${yyyy}-${mm}-${dd}`
  } else {
    selectedDate.value = ''
  }
  showDatePicker.value = false
})

const sortOrder = ref<'asc' | 'desc'>('desc')

let fetchTimeout: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(fetchTimeout)
  fetchTimeout = setTimeout(() => {
    fetchDaftar()
  }, 400)
}

const loading = ref(false)
const isLoaded = ref(false)

const isPasswordLengthValid = computed(() => createPassword.value.length >= 8)
const isPasswordAlphanumeric = computed(() => /[a-zA-Z]/.test(createPassword.value) && /[0-9]/.test(createPassword.value))
const isPasswordValid = computed(() => isPasswordLengthValid.value && isPasswordAlphanumeric.value)

const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')

const showCreateDialog = ref(false)
const showSuccessCreateDialog = ref(false)
const createdAccountMessage = ref('')
const createType = ref<'guru' | 'guru_bk'>('guru')
const createNuptk = ref('')
const createEmail = ref('')
const createUsername = ref('')
const createNama = ref('')
const createMapels = ref<string[]>([''])
const createPassword = ref('')
const createLoading = ref(false)

const showSuccessVerifyDialog = ref(false)
const verifiedSiswaName = ref('')
const showVerifyDialog = ref(false)
const verifyLoading = ref(false)
const selectedSiswa = ref<AkunItem | null>(null)

const createTitle = computed(() => createType.value === 'guru' ? 'Buat Akun Guru' : 'Buat Akun Guru BK')

const pagination = ref({
  siswa: { page: 1, pageSize: 10 },
  guru: { page: 1, pageSize: 10 },
  guruBk: { page: 1, pageSize: 10 }
})

const isVerifiedFilter = ref('false') // 'all', 'true', 'false'

const sortState = ref({
  siswa: { key: 'date_joined', order: 'desc' as 'asc' | 'desc' },
  guru: { key: 'date_joined', order: 'desc' as 'asc' | 'desc' },
  guruBk: { key: 'date_joined', order: 'desc' as 'asc' | 'desc' }
})

watch([sortOrder, search, selectedDate, isVerifiedFilter], () => {
  // Reset page to 1 when filters change
  pagination.value.siswa.page = 1
  pagination.value.guru.page = 1
  pagination.value.guruBk.page = 1
  
  sortState.value.siswa.key = 'date_joined'
  sortState.value.siswa.order = sortOrder.value
  sortState.value.guru.key = 'date_joined'
  sortState.value.guru.order = sortOrder.value
  sortState.value.guruBk.key = 'date_joined'
  sortState.value.guruBk.order = sortOrder.value
  
  debouncedFetch()
})

// Specifically watch pagination to trigger fetch
watch(() => [
  pagination.value.siswa.page, pagination.value.siswa.pageSize,
  pagination.value.guru.page, pagination.value.guru.pageSize,
  pagination.value.guruBk.page, pagination.value.guruBk.pageSize
], () => {
  fetchDaftar()
})

const activeTab = ref('siswa')

const accountTabs = computed(() => {
  return [
    { value: 'siswa', label: 'Siswa', count: siswaTotal.value },
    ...(isKemahasiswaan.value ? [
      { value: 'guru', label: 'Guru', count: guruTotal.value },
      { value: 'guruBk', label: 'Guru BK', count: guruBkTotal.value }
    ] : [])
  ]
})

function handleTabChange(tab: string) {
  activeTab.value = tab
  fetchDaftar()
}

const siswaColumns = [
  { key: 'nama_lengkap', label: 'Nama', sortable: true, tdClass: 'min-w-[200px]' },
  { key: 'nis', label: 'NIS', sortable: true },
  { key: 'kelas', label: 'Kelas', sortable: true },
  { key: 'date_joined', label: 'Terdaftar Pada', sortable: true },
  { key: 'action', label: 'Aksi', sortable: false }
]

const guruColumns = [
  { key: 'nama_lengkap', label: 'Nama', sortable: true },
  { key: 'nuptk', label: 'NUPTK', sortable: true },
  { key: 'mata_pelajaran', label: 'Mata Pelajaran', sortable: true },
  { key: 'date_joined', label: 'Terdaftar Pada', sortable: true }
]

const guruBkColumns = [
  { key: 'nama_lengkap', label: 'Nama', sortable: true },
  { key: 'nuptk', label: 'NUPTK', sortable: true },
  { key: 'mata_pelajaran', label: 'Jabatan', sortable: false },
  { key: 'date_joined', label: 'Terdaftar Pada', sortable: true }
]

function formatDate(dateString: string) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

function handleSort(type: 'siswa' | 'guru' | 'guruBk', key: string) {
  const current = sortState.value[type]
  if (current.key === key) {
    current.order = current.order === 'asc' ? 'desc' : 'asc'
  } else {
    current.key = key
    current.order = 'asc'
  }
}

function getSortedList(list: AkunItem[], type: 'siswa' | 'guru' | 'guruBk') {
  const { key, order } = sortState.value[type]
  if (!key) return list
  return [...list].sort((a: any, b: any) => {
    let valA = a[key]
    let valB = b[key]
    
    if (key === 'date_joined') {
      valA = new Date(valA).getTime()
      valB = new Date(valB).getTime()
    }
    
    if (valA < valB) return order === 'asc' ? -1 : 1
    if (valA > valB) return order === 'asc' ? 1 : -1
    return 0
  })
}

function applyDateFilter(list: AkunItem[]) {
  if (!selectedDate.value) return list
  return list.filter(item => {
    if (!item.date_joined) return false
    return item.date_joined.startsWith(selectedDate.value)
  })
}

const siswaSorted = computed(() => getSortedList(applyDateFilter(siswaList.value), 'siswa'))
const guruSorted = computed(() => getSortedList(applyDateFilter(guruList.value), 'guru'))
const guruBkSorted = computed(() => getSortedList(applyDateFilter(guruBkList.value), 'guruBk'))

const paginatedSiswaList = computed(() => siswaList.value)
const paginatedGuruList = computed(() => guruList.value)
const paginatedGuruBkList = computed(() => guruBkList.value)

async function fetchDaftar() {
  loading.value = true
  const role = activeTab.value
  const pg = pagination.value[role as keyof typeof pagination.value]
  
  try {
    const query = new URLSearchParams()
    // Convert camelCase to snake_case for API: guruBk -> guru_bk
    const apiRole = role === 'guruBk' ? 'guru_bk' : role
    query.set('role', apiRole)
    query.set('page', pg.page.toString())
    query.set('page_size', pg.pageSize.toString())
    
    if (search.value) query.set('search', search.value)
    
    if (role === 'siswa' && isVerifiedFilter.value !== 'all') {
      query.set('is_verified', isVerifiedFilter.value)
    }

    if (sortOrder.value) {
      query.set('ordering', sortOrder.value === 'desc' ? '-date_joined' : 'date_joined')
    }
    
    const data = await apiAuthGet(`akun/admin/daftar/?${query.toString()}`)
    
    if (role === 'siswa') {
      siswaList.value = data.results
      siswaTotal.value = data.count
    } else if (role === 'guru') {
      guruList.value = data.results
      guruTotal.value = data.count
    } else if (role === 'guruBk') {
      guruBkList.value = data.results
      guruBkTotal.value = data.count
    }
    
    isLoaded.value = true
  } catch (err: any) {
    alertStore.error(err.message || 'Gagal memuat daftar akun.')
  } finally {
    loading.value = false
  }
}

async function handleVerify(id: string) {
  try {
    await apiAuthPost(`akun/admin/verifikasi-siswa/${id}/`, {})
    await fetchDaftar()
  } catch (err: any) {
    alertStore.error(err.message || 'Gagal memverifikasi akun.')
  }
}

function openVerifyDialog(siswa: AkunItem) {
  selectedSiswa.value = siswa
  showVerifyDialog.value = true
}

function closeVerifyDialog() {
  showVerifyDialog.value = false
  selectedSiswa.value = null
}

const verifyMessage = computed(() => {
  if (!selectedSiswa.value) return ''
  return `Apakah Anda yakin memverifikasi bahwa siswa ${selectedSiswa.value.nama_lengkap} dengan NIS ${selectedSiswa.value.nis || '-'} adalah siswa kelas ${selectedSiswa.value.kelas || '-'} di SMP Desa Putera?`
})

async function confirmVerify() {
  if (!selectedSiswa.value) return
  verifyLoading.value = true
  const studentName = selectedSiswa.value.nama_lengkap
  try {
    await handleVerify(selectedSiswa.value.id)
    verifiedSiswaName.value = studentName
    closeVerifyDialog()
    showSuccessVerifyDialog.value = true
  } finally {
    verifyLoading.value = false
  }
}

function openCreateDialog(type: 'guru' | 'guru_bk') {
  createType.value = type
  createNuptk.value = ''
  createEmail.value = ''
  createUsername.value = ''
  createNama.value = ''
  createMapels.value = ['']
  createPassword.value = ''
  showCreateDialog.value = true
}

async function handleCreate() {
  if (createType.value === 'guru_bk' && !createUsername.value) {
    alertStore.error('Username wajib diisi untuk Guru BK.')
    return
  }
  if (!createNama.value) {
    alertStore.error('Nama lengkap wajib diisi.')
    return
  }
  if (!createEmail.value) {
    alertStore.error('Email wajib diisi.')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(createEmail.value)) {
    alertStore.error('Format email tidak valid.')
    return
  }
  if (!createPassword.value) {
    alertStore.error('Password wajib diisi.')
    return
  }
  if (!isPasswordValid.value) {
    alertStore.error('Password harus minimal 8 karakter dan mengandung huruf serta angka.')
    return
  }
  
  // NUPTK is only mandatory for 'guru', optional for 'guru_bk'
  if (createType.value === 'guru') {
    if (createNuptk.value.length !== 16 || !/^\d+$/.test(createNuptk.value)) {
      alertStore.error('NUPTK harus terdiri dari 16 digit angka.')
      return
    }
  } else if (createNuptk.value && (createNuptk.value.length !== 16 || !/^\d+$/.test(createNuptk.value))) {
    alertStore.error('Jika diisi, NUPTK harus terdiri dari 16 digit angka.')
    return
  }
  if (createType.value === 'guru') {
    const validMapels = createMapels.value.filter(m => m.trim().length > 0)
    if (validMapels.length === 0) {
      alertStore.error('Mata pelajaran wajib diisi untuk guru.')
      return
    }
  }
  if (createPassword.value.length < 6) {
    alertStore.error('Password minimal 6 karakter.')
    return
  }

  createLoading.value = true
  try {
    const payload: Record<string, any> = {
      role_type: createType.value,
      username: createType.value === 'guru_bk' ? createUsername.value : createNuptk.value,
      nuptk: createNuptk.value,
      email: createEmail.value,
      nama_lengkap: createNama.value,
      password: createPassword.value,
    }
    if (createType.value === 'guru') {
      const validMapels = createMapels.value.filter(m => m.trim().length > 0)
      payload.mata_pelajaran = validMapels.join(', ')
    }
    await apiAuthPost('akun/admin/buat/', payload)
    createdAccountMessage.value = `Akun ${createType.value === 'guru' ? 'Guru' : 'Guru BK'} ${createNama.value} berhasil dibuat.`
    showCreateDialog.value = false
    showSuccessCreateDialog.value = true
    await fetchDaftar()
  } catch (err: any) {
    alertStore.error(err.message || 'Gagal membuat akun.')
  } finally {
    createLoading.value = false
  }
}

function onSearchInput() {
  // handled by watcher
}

function addMapel() {
  createMapels.value.push('')
}

function removeMapel(index: number) {
  createMapels.value.splice(index, 1)
}

onMounted(() => {
  if (siswaList.value.length === 0 && guruList.value.length === 0 && guruBkList.value.length === 0) {
    fetchDaftar()
  }
})
</script>

<template>
  <div class="stf-page">
    <div class="stf-container">
      <div class="stf-header">
        <div class="stf-header-text">
          <h1 class="stf-page-title">Manajemen Akun</h1>
          <p class="stf-page-subtitle">
            Kelola data akun siswa, guru, dan admin di dalam sistem Sipora.
          </p>
        </div>
        <div v-if="isKemahasiswaan">
          <SButton 
            v-if="activeTab === 'guru'" 
            label="+ Buat Akun Guru" 
            variant="primary" 
            @click="openCreateDialog('guru')" 
          />
          <SButton 
            v-if="activeTab === 'guruBk'" 
            label="+ Buat Akun Guru BK" 
            variant="primary" 
            @click="openCreateDialog('guru_bk')" 
          />
        </div>
      </div>

      <div v-if="isKemahasiswaan" class="flex flex-wrap gap-2 mb-6">
        <button 
          v-for="tab in accountTabs" 
          :key="tab.value"
          @click="handleTabChange(tab.value)"
          class="stf-tab-btn"
          :class="activeTab === tab.value ? 'stf-tab--semua stf-tab-btn--active' : 'stf-tab-btn--inactive'"
        >
          {{ tab.label }}
          <span class="stf-tab-badge" :class="activeTab === tab.value ? 'stf-tab-badge--active' : 'stf-tab-badge--inactive'">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <div class="filters-row">
        <div class="filter-search">
          <STextField
            label=""
            placeholder="Cari berdasarkan nama, NIS, atau NUPTK..."
            variant="text"
            v-model="search"
            @input="onSearchInput"
          />
        </div>
        <div class="filter-extras">
          <div class="relative">
            <button 
              type="button"
              class="filter-input flex items-center gap-2 bg-white"
              @click="showDatePicker = !showDatePicker"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              {{ selectedDate || 'Pilih Tanggal' }}
            </button>
            <div v-if="showDatePicker" class="absolute right-0 top-[52px] z-50 shadow-xl border rounded-2xl overflow-hidden scale-90 origin-top-right">
              <SDatePicker v-model="selectedDateObj" />
            </div>
          </div>
          <div v-if="activeTab === 'siswa'" class="flex items-center gap-2">
            <span class="filter-label">Status:</span>
            <select v-model="isVerifiedFilter" class="filter-input">
              <option value="all">Semua Status</option>
              <option value="true">Terverifikasi</option>
              <option value="false">Belum Verifikasi</option>
            </select>
          </div>
          <select v-model="sortOrder" class="filter-input">
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>

      <!-- Always show content, loading mascot will overlap if needed -->
        <SCard v-if="activeTab === 'siswa'" class="section-card">
          <div class="section-header">
            <div>
              <h3 class="stf-section-title">Siswa</h3>
              <span class="section-count">{{ siswaTotal }} akun terdaftar</span>
            </div>
          </div>
          <div class="table-wrapper">
            <STable
              :columns="siswaColumns"
              :data="paginatedSiswaList"
              :total-data="siswaTotal"
              v-model:current-page="pagination.siswa.page"
              v-model:page-size="pagination.siswa.pageSize"
              :sort-key="sortState.siswa.key"
              :sort-order="sortState.siswa.order"
              :loading="loading"
              @sort="(k: string) => handleSort('siswa', k)"
              empty-message="Belum ada siswa yang terdaftar."
            >
              <template #body-cell-nis="{ row }">
                {{ row.nis || '-' }}
              </template>
              <template #body-cell-kelas="{ row }">
                {{ row.kelas || '-' }}
              </template>
              <template #body-cell-nama_lengkap="{ row }">
                <div class="flex flex-col items-start gap-1">
                  <span class="font-semibold">{{ row.nama_lengkap || '-' }}</span>
                  <SChip
                    :label="row.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'"
                    :tone="row.is_verified ? 'success' : 'warning'"
                    size="small"
                  />
                </div>
              </template>
              <template #body-cell-date_joined="{ row }">
                {{ formatDate(row.date_joined) }}
              </template>
              <template #body-cell-action="{ row }">
                <SButton
                  v-if="!row.is_verified && isKemahasiswaan"
                  label="Verifikasi"
                  variant="action"
                  size="small"
                  @click="openVerifyDialog(row)"
                >
                  <template #left-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </template>
                </SButton>
              </template>
            </STable>
          </div>
        </SCard>

        <SCard v-if="activeTab === 'guru' && isKemahasiswaan" class="section-card">
          <div class="section-header">
            <div>
              <h3 class="stf-section-title">Guru</h3>
              <span class="section-count">{{ guruTotal }} akun terdaftar</span>
            </div>
          </div>
          <div class="table-wrapper">
            <STable
              :columns="guruColumns"
              :data="paginatedGuruList"
              :total-data="guruTotal"
              v-model:current-page="pagination.guru.page"
              v-model:page-size="pagination.guru.pageSize"
              :sort-key="sortState.guru.key"
              :sort-order="sortState.guru.order"
              :loading="loading"
              @sort="(k: string) => handleSort('guru', k)"
              empty-message="Belum ada guru yang terdaftar."
            >
              <template #body-cell-nuptk="{ row }">
                {{ row.nuptk || '-' }}
              </template>
              <template #body-cell-mata_pelajaran="{ row }">
                {{ row.mata_pelajaran || '-' }}
              </template>
              <template #body-cell-date_joined="{ row }">
                {{ formatDate(row.date_joined) }}
              </template>
            </STable>
          </div>
        </SCard>

        <SCard v-if="activeTab === 'guruBk' && isKemahasiswaan" class="section-card">
          <div class="section-header">
            <div>
              <h3 class="stf-section-title">Guru BK</h3>
              <span class="section-count">{{ guruBkTotal }} akun terdaftar</span>
            </div>
          </div>
          <div class="table-wrapper">
            <STable
              :columns="guruBkColumns"
              :data="paginatedGuruBkList"
              :total-data="guruBkTotal"
              v-model:current-page="pagination.guruBk.page"
              v-model:page-size="pagination.guruBk.pageSize"
              :sort-key="sortState.guruBk.key"
              :sort-order="sortState.guruBk.order"
              :loading="loading"
              @sort="(k: string) => handleSort('guruBk', k)"
              empty-message="Belum ada guru BK yang terdaftar."
            >
              <template #body-cell-nuptk="{ row }">
                {{ row.nuptk || '-' }}
              </template>
              <template #body-cell-mata_pelajaran="{ row }">
                {{ row.mata_pelajaran || 'Bimbingan Konseling' }}
              </template>
              <template #body-cell-date_joined="{ row }">
                {{ formatDate(row.date_joined) }}
              </template>
            </STable>
          </div>
        </SCard>
    </div>

    <SDialog 
      :visible="showCreateDialog" 
      variant="primary" 
      :title="createTitle" 
      @update:visible="showCreateDialog = $event"
    >
      <form @submit.prevent="handleCreate" class="create-form">
        <STextField
          v-if="createType === 'guru_bk'"
          label="Username"
          placeholder="Ketik username (cth: gurubk_budi)"
          variant="text"
          v-model="createUsername"
          :required="true"
          maxlength="50"
          autocomplete="username"
        />
        <div class="nuptk-field">
          <STextField
            :label="createType === 'guru' ? 'NUPTK' : 'NUPTK (Opsional)'"
            :placeholder="createType === 'guru' ? 'Masukkan 16 digit NUPTK' : 'Boleh dikosongkan'"
            variant="text"
            v-model="createNuptk"
            :required="createType === 'guru'"
            maxlength="16"
            digitGuide="16"
            digitGroup="4"
            :autocomplete="createType === 'guru' ? 'username' : 'off'"
          />
          <a href="https://gtk.belajar.kemendikdasmen.go.id/akun/ptk" target="_blank" rel="noopener noreferrer" class="nuptk-help">Cek NUPTK</a>
        </div>
        <STextField label="Email" placeholder="Masukkan alamat email (cth: [REDACTED EMAIL])" variant="text" v-model="createEmail" :required="true" />
        <STextField label="Nama Lengkap" placeholder="Masukkan nama lengkap" variant="text" v-model="createNama" :required="true" />
        
        <template v-if="createType === 'guru'">
          <div class="flex flex-col gap-3">
            <div class="s-textfield__label-row">
              <label class="s-textfield__label">Mata Pelajaran <span class="text-general-red font-['Space_Grotesk'] text-[12px]">*</span></label>
            </div>
            <div v-for="(mapel, index) in createMapels" :key="index" class="flex items-end gap-3 w-full">
              <div class="flex-1">
                <STextField 
                  placeholder="Ketik di sini (cth: Matematika)" 
                  variant="text" 
                  v-model="createMapels[index]" 
                />
              </div>
              <button v-if="createMapels.length > 1" type="button" @click="removeMapel(index)" class="flex items-center justify-center shrink-0 w-11 h-11 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
            <button type="button" @click="addMapel" class="flex items-center gap-2 text-blue-500 hover:text-blue-700 body-b8 font-bold mt-1 self-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tambah mata pelajaran
            </button>
          </div>
        </template>

        <div v-if="createType === 'guru_bk'" class="auto-mapel">
          <span class="auto-label">Jabatan:</span>
          <span class="auto-value">Bimbingan Konseling</span>
          <span class="auto-note">(otomatis)</span>
        </div>
        
        <div>
          <STextField 
            label="Password" 
            placeholder="Min. 8 karakter + huruf & angka" 
            variant="text"
            v-model="createPassword" 
            :required="true" 
            input-type="password" 
            autocomplete="new-password"
          />
          <div class="password-rules" v-if="createPassword.length > 0">
            <div :class="['rule-item', isPasswordLengthValid ? 'valid' : 'invalid']">
              <svg v-if="isPasswordLengthValid" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Minimal 8 karakter</span>
            </div>
            <div :class="['rule-item', isPasswordAlphanumeric ? 'valid' : 'invalid']">
              <svg v-if="isPasswordAlphanumeric" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Terdapat kombinasi huruf dan angka</span>
            </div>
          </div>
        </div>
        <!-- Hidden submit button for form trigger -->
        <button type="submit" class="hidden"></button>
      </form>

      <template #actions>
        <SButton label="Batal" variant="secondary" @click="showCreateDialog = false" />
        <SButton :label="createLoading ? 'Membuat...' : 'Buat Akun'" variant="primary" :disabled="createLoading" @click="handleCreate" />
      </template>
    </SDialog>

    <SDialog
      :visible="showVerifyDialog"
      variant="primary"
      title="Verifikasi Siswa"
      @update:visible="showVerifyDialog = $event"
      @close="closeVerifyDialog"
      @cancel="closeVerifyDialog"
    >
      <p class="verify-dialog-message">{{ verifyMessage }}</p>

      <template #actions>
        <SButton label="Batal" variant="secondary" @click="closeVerifyDialog" />
        <SButton :label="verifyLoading ? 'Memverifikasi...' : 'Ya, Verifikasi'" variant="primary" :disabled="verifyLoading" @click="confirmVerify" />
      </template>
    </SDialog>

    <!-- Success Modal: Account Created -->
    <SDialog
      v-model:visible="showSuccessCreateDialog"
      title="Akun Berhasil Dibuat"
      :message="createdAccountMessage"
      confirmLabel="Selesai"
      cancelLabel=""
      @confirm="showSuccessCreateDialog = false"
    />

    <SDialog
      :visible="showSuccessVerifyDialog"
      variant="primary"
      title="Siswa Terverifikasi"
      :message="`Siswa ${verifiedSiswaName} berhasil diverifikasi. Akun tersebut kini dapat login dan mengakses seluruh fitur SIPORA sebagai siswa.`"
      confirmLabel="OK"
      cancelLabel=""
      @confirm="showSuccessVerifyDialog = false"
    />
  </div>
</template>

<style scoped>
.search-bar {
  margin-bottom: 20px;
}

.admin-loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: stretch;
}
.filter-search { flex: 1; min-width: 0; }
.filter-extras {
  display: flex;
  gap: 12px;
}
.filter-input {
  border: 1px solid var(--color-general-border);
  border-radius: 8px;
  padding: 10px 40px 10px 14px;
  height: 48px;
  font-size: 14px;
  color: var(--color-general-black);
  background: white;
  transition: border-color 0.2s;
  min-width: 140px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}
.filter-input:focus {
  outline: none;
  border-color: var(--color-blue-500);
  box-shadow: 0 0 0 3px rgba(46,48,148,.08);
}

.section-card {
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 12px;
}

.table-wrapper {
  overflow-x: auto;
  width: 100%;
  margin-top: 8px;
}

.section-count {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--color-neutral-400);
}

.verify-dialog-message {
  color: var(--color-general-black);
  font-family: var(--font-be-vietnam);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  margin: 0;
  text-align: center;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  text-align: left;
}

.nuptk-field {
  position: relative;
}

.nuptk-help {
  position: absolute;
  top: 0;
  right: 0;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-blue-400);
  text-decoration: none;
  line-height: 24px;
  transition: color 0.2s;
}

.nuptk-help:hover {
  color: var(--color-blue-600);
  text-decoration: underline;
}

.auto-mapel {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: var(--color-general-frame);
  border-radius: 8px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 14px;
}

.auto-label {
  font-weight: 600;
  color: var(--color-general-black);
}

.auto-value {
  color: var(--color-general-black);
}

.auto-note {
  color: var(--color-neutral-400);
  font-size: 12px;
  font-style: italic;
}

/* ── Password Rules ── */
.password-rules {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--color-general-frame);
  border-radius: 8px;
  border: 1px solid var(--color-general-border);
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s;
}

.rule-item.valid {
  color: #10B981; /* green-500 */
}

.rule-item.invalid {
  color: #EF4444; /* red-500 */
}

.filter-label {
  font-family: var(--font-be-vietnam);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-500);
  white-space: nowrap;
}

@media (min-width: 480px) {
  .admin-page {
    padding: 32px 24px;
  }
  .admin-title {
    font-size: 28px;
  }
}

/* ── Mobile (≤ 768px) ── */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 24px;
  }
  .filter-search {
    width: 100%;
  }
  .filter-extras {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .filter-input {
    width: 100%;
    min-width: 0;
    white-space: nowrap;
    justify-content: center;
    padding-left: 10px;
    padding-right: 32px; /* For the select arrow */
  }
  /* If in the grid and it's the 3rd item (Sort in Siswa tab) */
  .filter-extras > *:nth-child(3) {
    grid-column: span 2;
  }
  .filter-label {
    display: none;
  }
@media (max-width: 375px) {
  .filter-input {
    font-size: 13px;
  }
}
  .stf-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* ── Small Mobile (≤ 480px) ── */
@media (max-width: 480px) {
  /* Keep grid 2 columns if possible, standard pattern */
}

/* ── iPhone SE (≤ 375px) ── */
@media (max-width: 375px) {
  .stf-page-title {
    font-size: 18px;
  }
  .stf-page-subtitle {
    font-size: 13px;
  }
  .stf-tab-btn {
    font-size: 11px;
    padding: 5px 10px;
  }
}
</style>