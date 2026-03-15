<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SChip from '@/components/SChip.vue'
import STextField from '@/components/STextField.vue'
import { toast } from 'vue-sonner'

const auth = useAuthStore()

const user = computed(() => auth.user)
const isSiswa = computed(() => user.value?.role === 'siswa')
const isGuru = computed(() => user.value?.role === 'guru')
const isGuruBk = computed(() => user.value?.role === 'guru_bk')

const kelasOptions = ['7A', '7B', '8A', '8B', '9A', '9B']

// Semester badge
const semesterInfo = computed(() => {
  if (user.value?.semester && user.value?.tahun_ajaran) {
    return `Semester ${user.value.semester} ${user.value.tahun_ajaran}`
  }
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  if (month >= 7) return `Semester Ganjil ${year}/${year + 1}`
  return `Semester Genap ${year - 1}/${year}`
})

// Edit profile
const editKelas = ref('')
const mapels = ref<string[]>([])
const editLoading = ref(false)

function addMapel() {
  mapels.value.push('')
}

function removeMapel(index: number) {
  mapels.value.splice(index, 1)
  if (mapels.value.length === 0) {
    mapels.value.push('')
  }
}

// Change password
const passwordLama = ref('')
const passwordBaru = ref('')
const passwordLoading = ref(false)

const isPasswordBaruLengthValid = computed(() => passwordBaru.value.length >= 8)
const isPasswordBaruAlphanumeric = computed(() => /[a-zA-Z]/.test(passwordBaru.value) && /[0-9]/.test(passwordBaru.value))
const isPasswordBaruValid = computed(() => isPasswordBaruLengthValid.value && isPasswordBaruAlphanumeric.value)

onMounted(async () => {
  try {
    await auth.fetchProfile()
    if (user.value?.kelas) editKelas.value = user.value.kelas
    if (user.value?.mata_pelajaran) {
      mapels.value = user.value.mata_pelajaran.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0)
    }
    if (mapels.value.length === 0) {
      mapels.value.push('')
    }
  } catch {
    // Profile could fail if token expired
  }
})

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    siswa: 'Siswa',
    guru: 'Guru',
    guru_bk: 'Guru BK',
    kemahasiswaan: 'Kemahasiswaan',
  }
  return map[user.value?.role ?? ''] || ''
})

const identifier = computed(() => {
  if (isSiswa.value) return user.value?.nis || '-'
  if (isGuru.value || isGuruBk.value) return user.value?.nuptk || '-'
  return user.value?.username || '-'
})

const identifierLabel = computed(() => {
  if (isSiswa.value) return 'Nomor Induk Siswa (NIS)'
  if (isGuru.value || isGuruBk.value) return 'NUPTK'
  return 'Username'
})

async function handleEditProfil() {
  editLoading.value = true
  try {
    const payload: Record<string, string> = {}
    if (isSiswa.value) payload.kelas = editKelas.value
    if (isGuru.value) payload.mata_pelajaran = mapels.value.map(m => m.trim()).filter(m => m.length > 0).join(', ')
    await auth.editProfil(payload)
    // Re-fetch to update user data
    await auth.fetchProfile()
    toast.success('Profil berhasil diperbarui.')
  } catch (err: any) {
    toast.error(err.message || 'Gagal menyimpan perubahan.')
  } finally {
    editLoading.value = false
  }
}

async function handleUbahPassword() {
  if (!passwordLama.value || !passwordBaru.value) {
    toast.error('Harap isi semua field password.')
    return
  }
  if (!isPasswordBaruValid.value) {
    toast.error('Password baru harus minimal 8 karakter dan kombinasi huruf serta angka.')
    return
  }
  passwordLoading.value = true
  try {
    await auth.ubahPassword(passwordLama.value, passwordBaru.value)
    passwordLama.value = ''
    passwordBaru.value = ''
    toast.success('Password berhasil diubah.')
  } catch (err: any) {
    toast.error(err.message || 'Gagal mengubah password.')
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="stf-page">
    <div class="profil-container">
      <h1 class="stf-page-title">Manajemen Profil</h1>

      <!-- Verification Notice -->
      <div v-if="isSiswa && !user?.is_verified" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <p class="text-sm font-medium text-yellow-800 font-['Be_Vietnam_Pro'] leading-relaxed m-0">
          Akun kamu sedang diverifikasi oleh Kemahasiswaan SMP Desa Putera. Selama proses ini, kamu tetap bisa menggunakan fitur SIPORA.
        </p>
      </div>

      <!-- Profile Info Card -->
      <SCard class="profil-card">
        <div class="info-header">
          <div class="info-avatar">{{ user?.nama_lengkap?.charAt(0)?.toUpperCase() }}</div>
          <div class="info-main">
            <h2 class="info-nama">{{ user?.nama_lengkap }}</h2>
            <div class="info-badges">
              <span class="badge badge--role">{{ roleLabel }}</span>
              <span class="badge badge--semester">{{ semesterInfo }}</span>
              <SChip
                v-if="isSiswa"
                :label="user?.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'"
                :tone="user?.is_verified ? 'success' : 'warning'"
                variant="light"
                size="small"
              />
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">{{ identifierLabel }}</span>
            <span class="info-value">{{ identifier }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Nama Lengkap</span>
            <span class="info-value">{{ user?.nama_lengkap }}</span>
          </div>
          <div v-if="isSiswa" class="info-item">
            <span class="info-label">Kelas</span>
            <span class="info-value">{{ user?.kelas || '-' }}</span>
          </div>
          <div v-if="isGuru || isGuruBk" class="info-item">
            <span class="info-label">Mata Pelajaran</span>
            <span class="info-value">{{ user?.mata_pelajaran || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Terdaftar Pada</span>
            <span class="info-value">{{ user?.date_joined ? new Date(user.date_joined).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-' }}</span>
          </div>
        </div>
      </SCard>

      <!-- Edit Profile (Siswa: kelas, Guru: mapel) -->
      <SCard v-if="isSiswa || isGuru" class="profil-card">
        <h3 class="stf-section-title">Ubah Detail Profil</h3>

        <!-- Siswa: kelas dropdown -->
        <div v-if="isSiswa" class="edit-field">
          <div class="s-textfield__label-row">
            <label class="s-textfield__label">Kelas</label>
          </div>
          <select v-model="editKelas" class="kelas-select">
            <option value="" disabled>Pilih kelas...</option>
            <option v-for="k in kelasOptions" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>

        <!-- Guru: mapel text -->
        <div v-if="isGuru" class="edit-field">
          <div class="s-textfield__label-row">
            <label class="s-textfield__label">Mata Pelajaran</label>
          </div>
          <div class="flex flex-col gap-3 mt-2">
            <div v-for="(mapel, index) in mapels" :key="index" class="flex items-center gap-2">
              <STextField
                placeholder="cth: Matematika"
                variant="text"
                v-model="mapels[index]"
              />
              <button v-if="mapels.length > 1" type="button" @click="removeMapel(index)" class="flex size-11 shrink-0 items-center justify-center rounded-lg border border-general-red text-general-red hover:bg-red-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <button type="button" @click="addMapel" class="text-blue-500 hover:text-blue-600 font-['Be_Vietnam_Pro'] font-semibold text-sm text-left self-start mt-1">
              + Tambah mata pelajaran
            </button>
          </div>
        </div>

        <div class="edit-actions">
          <SButton
            :label="editLoading ? 'Menyimpan...' : 'Simpan Perubahan'"
            variant="primary"
            :disabled="editLoading"
            @click="handleEditProfil"
          />
        </div>
      </SCard>

      <!-- Change Password -->
      <SCard class="profil-card">
        <h3 class="stf-section-title">Ganti Password</h3>
        <div class="password-form">
          <STextField
            label="Password Lama"
            placeholder="Masukkan password lama"
            variant="text"
            v-model="passwordLama"
            input-type="password"
          />
          <STextField
            label="Password Baru"
            placeholder="Kombinasi huruf & angka"
            variant="text"
            v-model="passwordBaru"
            input-type="password"
          />
          <div class="password-rules" v-if="passwordBaru.length > 0">
            <div :class="['rule-item', isPasswordBaruLengthValid ? 'valid' : 'invalid']">
              <svg v-if="isPasswordBaruLengthValid" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Minimal 8 karakter</span>
            </div>
            <div :class="['rule-item', isPasswordBaruAlphanumeric ? 'valid' : 'invalid']">
              <svg v-if="isPasswordBaruAlphanumeric" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Terdapat kombinasi huruf dan angka</span>
            </div>
          </div>
          <div class="edit-actions">
            <SButton
              :label="passwordLoading ? 'Mengubah...' : 'Ubah Password'"
              variant="primary"
              :disabled="passwordLoading"
              @click="handleUbahPassword"
            />
          </div>
        </div>
      </SCard>
    </div>
  </div>
</template>

<style scoped>
.profil-page {
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 24px 16px;
}

.profil-container {
  max-width: 600px;
  margin: 0 auto;
}

.profil-title {
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 24px;
  color: var(--color-general-black);
  margin-bottom: 20px;
}

.profil-card {
  margin-bottom: 16px;
}

/* ── Info Header ── */
.info-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.info-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--color-blue-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 22px;
  flex-shrink: 0;
}

.info-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-nama {
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 18px;
  color: var(--color-general-black);
  margin: 0;
}

.info-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  font-family: var(--font-be-vietnam);
  font-weight: 600;
  font-size: 11px;
  border-radius: 100px;
  letter-spacing: 0.3px;
}

.badge--role {
  background: var(--color-blue-50);
  color: var(--color-blue-600);
}

.badge--semester {
  background: var(--color-blue-50);
  color: var(--color-blue-600);
}

.badge--verify-true {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.badge--verify-false {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

/* ── Info Grid ── */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: var(--color-neutral-400);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 15px;
  color: var(--color-general-black);
}

/* ── Sections ── */
.section-title {
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 16px;
  color: var(--color-general-black);
  margin: 0 0 16px 0;
}

.edit-field {
  margin-bottom: 12px;
}

.s-textfield__label-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 8px;
}

.s-textfield__label {
  color: var(--color-general-black, #333);
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.kelas-select {
  display: flex;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
  color: var(--color-general-black, #333);
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  appearance: auto;
  box-sizing: border-box;
}

.kelas-select:hover {
  border-color: var(--color-blue-500, #2E3094);
}

.kelas-select:focus {
  outline: none;
  border-color: var(--color-blue-500, #2E3094);
  box-shadow: 0 0 0 2px rgba(46, 48, 148, 0.15);
}

.edit-actions {
  margin-top: 16px;
}

.edit-actions :deep(.s-button) {
  width: 100%;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Password Rules ── */
.password-rules {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: -6px;
  margin-bottom: 2px;
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

.rule-item.valid { color: #10B981; }
.rule-item.invalid { color: #EF4444; }

/* ── Responsive ── */
@media (min-width: 480px) {
  .profil-page {
    padding: 32px 24px;
  }

  .profil-title {
    font-size: 28px;
  }
}
</style>
