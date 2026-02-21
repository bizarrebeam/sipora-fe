<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiAuthGet, apiAuthPost } from '@/services/api'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import SDialog from '@/components/SDialog.vue'
import SDataTable from '@/components/SDataTable.vue'
import { toast } from 'vue-sonner'

interface AkunItem {
  id: string
  nama_lengkap: string
  nisn?: string
  nuptk?: string
  kelas?: string
  mata_pelajaran?: string
  role: string
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

const showCreateDialog = ref(false)
const createType = ref<'guru' | 'guru_bk'>('guru')
const createNuptk = ref('')
const createNama = ref('')
const createMapels = ref<string[]>([''])
const createPassword = ref('')
const createLoading = ref(false)

const createTitle = computed(() => createType.value === 'guru' ? 'Buat Akun Guru' : 'Buat Akun Guru BK')

function formatDate(dateString: string) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

const siswaTableData = computed(() => 
  siswaList.value.map(s => [s.nama_lengkap, s.nisn || '-', s.kelas || '-', formatDate(s.date_joined)])
)

const guruTableData = computed(() => 
  guruList.value.map(g => [g.nama_lengkap, g.nuptk || '-', g.mata_pelajaran || '-', formatDate(g.date_joined)])
)

const guruBkTableData = computed(() => 
  guruBkList.value.map(bk => [bk.nama_lengkap, bk.nuptk || '-', bk.mata_pelajaran || 'Bimbingan Konseling', formatDate(bk.date_joined)])
)

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
  <div class="admin-page">
    <div class="admin-container">
      <h1 class="admin-title">Manajemen Akun</h1>

      <div class="search-bar">
        <STextField
          label=""
          placeholder="Cari berdasarkan nama, NISN, atau NUPTK..."
          variant="text"
          v-model="search"
          @input="onSearchInput"
        />
      </div>

      <div v-if="loading" class="admin-loading">
        <p>Memuat data...</p>
      </div>

      <template v-else>
        <SCard class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Siswa</h3>
              <span class="section-count">{{ siswaTotal }} akun terdaftar</span>
            </div>
          </div>
          <div v-if="siswaList.length" class="table-wrapper">
            <SDataTable 
              :headers="['Nama', 'NISN', 'Kelas', 'Terdaftar Pada']" 
              :data="siswaTableData" 
            />
          </div>
          <p v-else class="empty-msg">Belum ada siswa yang terdaftar.</p>
        </SCard>

        <SCard class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Guru</h3>
              <span class="section-count">{{ guruTotal }} akun terdaftar</span>
            </div>
            <SButton label="+ Buat Akun Guru" variant="primary" @click="openCreateDialog('guru')" />
          </div>
          <div v-if="guruList.length" class="table-wrapper">
            <SDataTable 
              :headers="['Nama', 'NUPTK', 'Mata Pelajaran', 'Terdaftar Pada']" 
              :data="guruTableData" 
            />
          </div>
          <p v-else class="empty-msg">Belum ada guru yang terdaftar.</p>
        </SCard>

        <SCard class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Guru BK</h3>
              <span class="section-count">{{ guruBkTotal }} akun terdaftar</span>
            </div>
            <SButton label="+ Buat Akun Guru BK" variant="primary" @click="openCreateDialog('guru_bk')" />
          </div>
          <div v-if="guruBkList.length" class="table-wrapper">
            <SDataTable 
              :headers="['Nama', 'NUPTK', 'Jabatan', 'Terdaftar Pada']" 
              :data="guruBkTableData" 
            />
          </div>
          <p v-else class="empty-msg">Belum ada guru BK yang terdaftar.</p>
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
        <STextField label="Password" placeholder="Min. 6 karakter" variant="text" v-model="createPassword" :required="true" input-type="password" />
      </div>

      <template #actions>
        <SButton label="Batal" variant="secondary" @click="showCreateDialog = false" />
        <SButton :label="createLoading ? 'Membuat...' : 'Buat Akun'" variant="primary" :disabled="createLoading" @click="handleCreate" />
      </template>
    </SDialog>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 24px 16px;
}

.admin-container {
  max-width: 900px;
  margin: 0 auto;
}

.admin-title {
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 24px;
  color: var(--color-general-black);
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
}

.admin-loading {
  text-align: center;
  padding: 40px 0;
  color: var(--color-neutral-500);
  font-family: var(--font-plus-jakarta);
}

.section-card {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 12px;
  flex-wrap: wrap;
}

.section-title {
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 18px;
  color: var(--color-general-black);
  margin: 0;
}

.section-count {
  font-family: var(--font-plus-jakarta);
  font-weight: 500;
  font-size: 13px;
  color: var(--color-neutral-400);
}

.empty-msg {
  text-align: center;
  padding: 20px 0;
  color: var(--color-neutral-400);
  font-family: var(--font-plus-jakarta);
  font-size: 14px;
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
  font-family: var(--font-plus-jakarta);
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
  font-family: var(--font-plus-jakarta);
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

@media (min-width: 480px) {
  .admin-page {
    padding: 32px 24px;
  }
  .admin-title {
    font-size: 28px;
  }
}
</style>