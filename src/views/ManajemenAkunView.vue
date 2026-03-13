<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiAuthGet, apiAuthPost } from '@/services/api'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SChip from '@/components/SChip.vue'
import STextField from '@/components/STextField.vue'
import SDialog from '@/components/SDialog.vue'
import STable from '@/components/STable.vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'

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
const loading = ref(false)

const isPasswordLengthValid = computed(() => createPassword.value.length >= 8)
const isPasswordAlphanumeric = computed(() => /[a-zA-Z]/.test(createPassword.value) && /[0-9]/.test(createPassword.value))
const isPasswordValid = computed(() => isPasswordLengthValid.value && isPasswordAlphanumeric.value)

const auth = useAuthStore()
const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')

const showCreateDialog = ref(false)
const createType = ref<'guru' | 'guru_bk'>('guru')
const createNuptk = ref('')
const createNama = ref('')
const createMapels = ref<string[]>([''])
const createPassword = ref('')
const createLoading = ref(false)
const showVerifyDialog = ref(false)
const verifyLoading = ref(false)
const selectedSiswa = ref<AkunItem | null>(null)

const createTitle = computed(() => createType.value === 'guru' ? 'Buat Akun Guru' : 'Buat Akun Guru BK')

const pagination = ref({
  siswa: { page: 1, pageSize: 20 },
  guru: { page: 1, pageSize: 20 },
  guruBk: { page: 1, pageSize: 20 }
})

const sortState = ref({
  siswa: { key: '', order: 'desc' as 'asc' | 'desc' },
  guru: { key: '', order: 'desc' as 'asc' | 'desc' },
  guruBk: { key: '', order: 'desc' as 'asc' | 'desc' }
})

const activeTab = ref('siswa')

const accountTabs = computed(() => {
  const tabs = [{ value: 'siswa', label: 'Siswa', count: siswaTotal.value }]
  if (isKemahasiswaan.value) {
    tabs.push(
      { value: 'guru', label: 'Guru', count: guruTotal.value },
      { value: 'guru_bk', label: 'Guru BK', count: guruBkTotal.value }
    )
  }
  return tabs
})

function handleTabChange(tab: string) {
  activeTab.value = tab
}

const siswaColumns = [
  { key: 'nama_lengkap', label: 'Nama', sortable: true },
  { key: 'nis', label: 'NIS', sortable: true },
  { key: 'kelas', label: 'Kelas', sortable: true },
  { key: 'is_verified', label: 'Status Verifikasi', sortable: true },
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
    if (valA < valB) return order === 'asc' ? -1 : 1
    if (valA > valB) return order === 'asc' ? 1 : -1
    return 0
  })
}

const siswaSorted = computed(() => getSortedList(siswaList.value, 'siswa'))
const guruSorted = computed(() => getSortedList(guruList.value, 'guru'))
const guruBkSorted = computed(() => getSortedList(guruBkList.value, 'guruBk'))

const paginatedSiswaList = computed(() => {
  const start = (pagination.value.siswa.page - 1) * pagination.value.siswa.pageSize
  return siswaSorted.value.slice(start, start + pagination.value.siswa.pageSize)
})

const paginatedGuruList = computed(() => {
  const start = (pagination.value.guru.page - 1) * pagination.value.guru.pageSize
  return guruSorted.value.slice(start, start + pagination.value.guru.pageSize)
})

const paginatedGuruBkList = computed(() => {
  const start = (pagination.value.guruBk.page - 1) * pagination.value.guruBk.pageSize
  return guruBkSorted.value.slice(start, start + pagination.value.guruBk.pageSize)
})

async function fetchDaftar() {
  loading.value = true
  try {
    const params = search.value ? `?search=${encodeURIComponent(search.value)}` : ''
    const data = await apiAuthGet(`akun/admin/daftar/${params}`)
    siswaList.value = data.siswa.data
    siswaTotal.value = data.siswa.total
    guruList.value = data.guru.data
    guruTotal.value = data.guru.total
    guruBkList.value = data.guru_bk.data
    guruBkTotal.value = data.guru_bk.total
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat daftar akun.')
  } finally {
    loading.value = false
  }
}

async function handleVerify(id: string) {
  try {
    await apiAuthPost(`akun/admin/verifikasi-siswa/${id}/`, {})
    toast.success('Akun siswa berhasil diverifikasi.')
    await fetchDaftar()
  } catch (err: any) {
    toast.error(err.message || 'Gagal memverifikasi akun.')
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
  try {
    await handleVerify(selectedSiswa.value.id)
    closeVerifyDialog()
  } finally {
    verifyLoading.value = false
  }
}

function openCreateDialog(type: 'guru' | 'guru_bk') {
  createType.value = type
  createNuptk.value = ''
  createNama.value = ''
  createMapels.value = ['']
  createPassword.value = ''
  showCreateDialog.value = true
}

async function handleCreate() {
  if (!createNuptk.value || !createNama.value || !createPassword.value) {
    toast.error('Harap isi semua field wajib.')
    return
  }
  if (!isPasswordValid.value) {
    toast.error('Password harus minimal 8 karakter dan mengandung huruf serta angka.')
    return
  }
  if (createNuptk.value.length !== 16 || !/^\d+$/.test(createNuptk.value)) {
    toast.error('NUPTK harus terdiri dari 16 digit angka.')
    return
  }
  if (createType.value === 'guru') {
    const validMapels = createMapels.value.filter(m => m.trim().length > 0)
    if (validMapels.length === 0) {
      toast.error('Mata pelajaran wajib diisi untuk guru.')
      return
    }
  }
  if (createPassword.value.length < 6) {
    toast.error('Password minimal 6 karakter.')
    return
  }

  createLoading.value = true
  try {
    const payload: Record<string, string> = {
      role_type: createType.value,
      nuptk: createNuptk.value,
      nama_lengkap: createNama.value,
      password: createPassword.value,
    }
    if (createType.value === 'guru') {
      const validMapels = createMapels.value.filter(m => m.trim().length > 0)
      payload.mata_pelajaran = validMapels.join(', ')
    }
    await apiAuthPost('akun/admin/buat/', payload)
    toast.success(`Akun ${createType.value === 'guru' ? 'Guru' : 'Guru BK'} berhasil dibuat.`)
    showCreateDialog.value = false
    await fetchDaftar()
  } catch (err: any) {
    toast.error(err.message || 'Gagal membuat akun.')
  } finally {
    createLoading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchDaftar(), 400)
}

function addMapel() {
  createMapels.value.push('')
}

function removeMapel(index: number) {
  createMapels.value.splice(index, 1)
}

onMounted(fetchDaftar)
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
            v-if="activeTab === 'guru_bk'" 
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

      <div class="search-bar">
        <STextField
          label=""
          placeholder="Cari berdasarkan nama, NIS, atau NUPTK..."
          variant="text"
          v-model="search"
          @input="onSearchInput"
        />
      </div>

      <div v-if="loading" class="admin-loading">
        <p>Memuat data...</p>
      </div>

      <template v-else>
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
              @sort="(k) => handleSort('siswa', k)"
              empty-message="Belum ada siswa yang terdaftar."
            >
              <template #body-cell-nis="{ row }">
                {{ row.nis || '-' }}
              </template>
              <template #body-cell-kelas="{ row }">
                {{ row.kelas || '-' }}
              </template>
              <template #body-cell-is_verified="{ row }">
                <SChip
                  :label="row.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'"
                  :tone="row.is_verified ? 'success' : 'warning'"
                  variant="light"
                  size="small"
                />
              </template>
              <template #body-cell-date_joined="{ row }">
                {{ formatDate(row.date_joined) }}
              </template>
              <template #body-cell-action="{ row }">
                <SButton
                  v-if="!row.is_verified && isKemahasiswaan"
                  label="Verifikasi"
                  variant="secondary"
                  @click="openVerifyDialog(row)"
                />
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
              @sort="(k) => handleSort('guru', k)"
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

        <SCard v-if="activeTab === 'guru_bk' && isKemahasiswaan" class="section-card">
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
              @sort="(k) => handleSort('guruBk', k)"
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
      </template>
    </div>

    <SDialog 
      :visible="showCreateDialog" 
      variant="primary" 
      :title="createTitle" 
      @update:visible="showCreateDialog = $event"
      @close="showCreateDialog = false"
    >
      <div class="create-form">
        <div class="nuptk-field">
          <STextField
            label="NUPTK"
            placeholder="Masukkan 16 digit NUPTK"
            variant="text"
            v-model="createNuptk"
            :required="true"
            maxlength="16"
            digitGuide="16"
          />
          <a href="https://gtk.belajar.kemendikdasmen.go.id/akun/ptk" target="_blank" rel="noopener noreferrer" class="nuptk-help">Cek NUPTK</a>
        </div>
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
      </div>

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
  </div>
</template>

<style scoped>
.search-bar {
  margin-bottom: 20px;
}

.admin-loading {
  text-align: center;
  padding: 40px 0;
  color: var(--color-neutral-500);
  font-family: "Be Vietnam Pro", sans-serif;
}

.section-card {
  margin-bottom: 16px;
}

.section-header {
  margin-bottom: 12px;
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

@media (min-width: 480px) {
  .admin-page {
    padding: 32px 24px;
  }
  .admin-title {
    font-size: 28px;
  }
}
</style>