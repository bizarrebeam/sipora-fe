<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SChip from '@/components/SChip.vue'
import STextField from '@/components/STextField.vue'
import SDialog from '@/components/SDialog.vue'
import { useAlertStore } from '@/stores/alert'

const auth = useAuthStore()
const alertStore = useAlertStore()

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
const mapels = ref<{nama_mata_pelajaran: string, kelas_diajar: string[]}[]>([{nama_mata_pelajaran: '', kelas_diajar: []}])
const editLoading = ref(false)
const showSuccessUpdateDialog = ref(false)
const showSemesterNotification = ref(false)

function addMapel() {
  mapels.value.push({ nama_mata_pelajaran: '', kelas_diajar: [] })
}

function removeMapel(index: number) {
  mapels.value.splice(index, 1)
  if (mapels.value.length === 0) {
    mapels.value.push({ nama_mata_pelajaran: '', kelas_diajar: [] })
  }
}

// Change password
const passwordLama = ref('')
const passwordBaru = ref('')
const passwordLoading = ref(false)
const showSuccessPasswordDialog = ref(false)

const isPasswordBaruLengthValid = computed(() => passwordBaru.value.length >= 8)
const isPasswordBaruAlphanumeric = computed(() => /[a-zA-Z]/.test(passwordBaru.value) && /[0-9]/.test(passwordBaru.value))
const isPasswordBaruValid = computed(() => isPasswordBaruLengthValid.value && isPasswordBaruAlphanumeric.value)

onMounted(async () => {
  try {
    await auth.fetchProfile()
    if (user.value?.kelas) editKelas.value = user.value.kelas
    
    if (isGuru.value) {
      const u = user.value as any
      if (u?.riwayat_mengajar && u.riwayat_mengajar.length > 0) {
        // Filter mapped subjects for current active semester only to show in Edit View
        const currentHistory = u.riwayat_mengajar.filter((r: any) => 
          r.semester === u?.semester && r.tahun_ajaran === u?.tahun_ajaran
        )
        if (currentHistory.length > 0) {
          mapels.value = JSON.parse(JSON.stringify(currentHistory))
        } else {
          showSemesterNotification.value = true
        }
      } else {
        showSemesterNotification.value = true
      }
    }
  } catch {
    // Note: error object omitted, assuming could be ServerHandledError

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
    const payload: any = {}
    if (isSiswa.value) {
      if (!editKelas.value) {
        alertStore.error("Silakan pilih kelas terlebih dahulu.")
        editLoading.value = false
        return
      }
      payload.kelas = editKelas.value
    }
    if (isGuru.value) {
      // Robust check for blank names or missing classes
      const hasInvalid = mapels.value.some(m => !m.nama_mata_pelajaran || m.nama_mata_pelajaran.trim().length === 0)
      if (hasInvalid) {
        alertStore.error("Nama mata pelajaran tidak boleh kosong atau hanya berisi spasi.")
        editLoading.value = false
        return
      }
      
      const hasNoClass = mapels.value.some(m => !m.kelas_diajar || m.kelas_diajar.length === 0)
      if (hasNoClass) {
        alertStore.error("Tiap mata pelajaran harus memiliki setidaknya 1 kelas diajar.")
        editLoading.value = false
        return
      }

      payload.riwayat_mengajar = mapels.value.map(m => ({
        nama_mata_pelajaran: m.nama_mata_pelajaran.trim(),
        kelas_diajar: m.kelas_diajar
      }))
    }
    await auth.editProfil(payload)
    // Re-fetch to update user data
    await auth.fetchProfile()
    showSuccessUpdateDialog.value = true
  } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[ProfilView] Request failed (handled globally):', err.message);
      return;
    }
    alertStore.error(err.message || 'Gagal menyimpan perubahan.')
  } finally {
    editLoading.value = false
  }
}

async function handleUbahPassword() {
  if (!passwordLama.value || !passwordBaru.value) {
    alertStore.error('Harap isi semua field password.')
    return
  }
  if (!isPasswordBaruValid.value) {
    alertStore.error('Password baru harus minimal 8 karakter dan kombinasi huruf serta angka.')
    return
  }
  passwordLoading.value = true
  try {
    await auth.ubahPassword(passwordLama.value, passwordBaru.value)
    passwordLama.value = ''
    passwordBaru.value = ''
    showSuccessPasswordDialog.value = true
  } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[ProfilView] Request failed (handled globally):', err.message);
      return;
    }
    alertStore.error(err.message || 'Gagal mengubah password.')
  } finally {
    passwordLoading.value = false
  }
}

const groupedRiwayat = computed(() => {
  const u = user.value as any
  if (!u?.riwayat_mengajar) return []
  const groups: Record<string, { semester: string, tahun_ajaran: string, items: any[] }> = {}
  
  u.riwayat_mengajar.forEach((item: any) => {
    const key = `${item.semester}-${item.tahun_ajaran}`
    if (!groups[key]) {
      groups[key] = {
        semester: item.semester,
        tahun_ajaran: item.tahun_ajaran,
        items: []
      }
    }
    groups[key].items.push(item)
  })
  
  return Object.values(groups).sort((a, b) => {
    if (a.tahun_ajaran !== b.tahun_ajaran) return b.tahun_ajaran.localeCompare(a.tahun_ajaran)
    return b.semester.localeCompare(a.semester)
  })
})
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
              <span class="badge badge--semester font-medium">{{ semesterInfo }}</span>
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
          <div v-if="isGuruBk" class="info-item">
            <span class="info-label">JABATAN</span>
            <span class="info-value">Bimbingan Konseling</span>
          </div>
          <div v-if="isGuru" class="info-item">
            <span class="info-label">Mata Pelajaran Semester Saat Ini</span>
            <span v-if="!(user as any)?.riwayat_mengajar || mapels.filter(m => m.nama_mata_pelajaran && m.kelas_diajar.length > 0).length === 0" class="info-value italic text-neutral-400">Belum di set</span>
            <span v-else class="info-value">
              {{ mapels.filter(m => m.nama_mata_pelajaran && m.kelas_diajar.length > 0).map(m => m.nama_mata_pelajaran).join(', ') }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Terdaftar Pada</span>
            <span class="info-value">{{ user?.date_joined ? new Date(user.date_joined).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-' }}</span>
          </div>
        </div>
      </SCard>

      <!-- Riwayat Mengajar (Guru Only) -->
      <SCard v-if="isGuru" class="profil-card" gap="gap-0">
        <div class="flex flex-col gap-1.5 mb-3">
          <h3 class="stf-section-title !mb-0">Riwayat Mengajar</h3>
          <p class="text-[13px] text-neutral-500 font-['Be_Vietnam_Pro'] m-0 p-0">Rekam jejak mata pelajaran yang Anda ampu di setiap semester.</p>
        </div>
        
        <div v-if="!user?.riwayat_mengajar || user.riwayat_mengajar.length === 0" class="text-sm text-neutral-400 italic py-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200 font-['Be_Vietnam_Pro']">
          Belum ada data riwayat mengajar yang tercatat.
        </div>
        
        <div v-else class="flex flex-col gap-6 font-['Be_Vietnam_Pro']">
          <div 
            v-for="(group, gIdx) in groupedRiwayat" 
            :key="gIdx"
            class="flex flex-col gap-4"
          >
            <!-- Semester Header -->
            <div class="flex items-center gap-3">
              <div class="h-px flex-1 bg-neutral-200"></div>
              <span class="text-[12px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {{ group.semester }} {{ group.tahun_ajaran }}
              </span>
              <div class="h-px flex-1 bg-neutral-200"></div>
            </div>

            <!-- Subjects in this semester -->
            <div class="grid grid-cols-1 gap-3">
              <div 
                v-for="(mapel, mIdx) in group.items" 
                :key="mIdx"
                class="flex flex-col gap-3 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors"
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-[15px] text-neutral-800">{{ mapel.nama_mata_pelajaran }}</span>
                  <span v-if="mapel.semester === user?.semester && mapel.tahun_ajaran === user?.tahun_ajaran" class="text-[10px] font-bold uppercase py-0.5 px-2 bg-green-100 text-green-700 rounded border border-green-200">Aktif</span>
                </div>
                
                <div class="flex flex-wrap gap-1.5 font-['Be_Vietnam_Pro']">
                  <span 
                    v-for="k in mapel.kelas_diajar" 
                    :key="k"
                    class="text-[12px] font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg"
                  >
                    Kelas {{ k }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SCard>

      <!-- Edit Profile (Siswa: kelas, Guru: mapel) -->
      <SCard v-if="isSiswa || isGuru" class="profil-card" gap="gap-0">
        <div class="flex flex-col gap-5">
          <h3 class="stf-section-title !mb-0">Ubah Detail Profil</h3>

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
          <div v-if="isGuru" class="edit-field !mb-0">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label class="s-textfield__label">Mata Pelajaran</label>
                <div class="flex flex-col gap-4">
                  <div v-for="(mapel, index) in mapels" :key="index" class="flex flex-col gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div class="flex items-end gap-2">
                      <STextField
                        placeholder="Ketik di sini (cth: Matematika)"
                        variant="text"
                        v-model="mapel.nama_mata_pelajaran"
                        class="flex-1"
                      />
                      <button v-if="mapels.length > 1" type="button" @click="removeMapel(index)" class="flex size-[42px] shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                    <div class="flex flex-col gap-2">
                      <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Kelas Diajar <span class="text-general-red">*</span></span>
                      <div class="flex flex-wrap gap-2">
                        <label v-for="k in kelasOptions" :key="k" class="flex items-center gap-2 px-3 py-1.5 border border-general-border rounded-lg cursor-pointer transition-colors text-sm" :class="mapel.kelas_diajar.includes(k) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-neutral-50'">
                          <input type="checkbox" :value="k" v-model="mapel.kelas_diajar" class="hidden">
                          <span class="font-['Be_Vietnam_Pro'] font-medium select-none">{{ k }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" @click="addMapel" class="text-blue-500 hover:text-blue-600 font-['Be_Vietnam_Pro'] font-semibold text-[13px] text-left self-start border border-blue-200 bg-white px-4 py-2 rounded-lg transition-colors hover:border-blue-300">
                <span class="mr-1">+</span> Tambah mata pelajaran
              </button>
            </div>
          </div>

          <div class="edit-actions !mt-0">
            <SButton
              :label="editLoading ? 'Menyimpan...' : 'Simpan Perubahan'"
              variant="primary"
              :disabled="editLoading"
              @click="handleEditProfil"
            />
          </div>
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

    <!-- Success Modal: Profil Updated -->
    <SDialog
      v-model:visible="showSuccessUpdateDialog"
      title="Profil Diperbarui"
      message="Perubahan profil Anda telah berhasil disimpan."
      confirmLabel="Tutup"
      @confirm="showSuccessUpdateDialog = false"
    />

    <!-- Notification Modal: Update Mapel on New Semester -->
    <SDialog
      v-model:visible="showSemesterNotification"
      title="Semester Baru Dimulai"
      variant="primary"
      :message="`Selamat datang kembali di ${semesterInfo}. Anda belum menyetel mata pelajaran dan kelas yang diajarkan pada semester ini. Silakan atur sekarang di Ubah Detail Profil.`"
      confirmLabel="Atur Sekarang"
      cancelLabel=""
      @confirm="showSemesterNotification = false"
    />

    <!-- Success Modal: Password Changed -->
    <SDialog
      v-model:visible="showSuccessPasswordDialog"
      title="Password Diubah"
      message="Password akun Anda telah berhasil diperbarui."
      confirmLabel="Selesai"
      cancelLabel=""
      @confirm="showSuccessPasswordDialog = false"
    />
  </div>
</template>

<style scoped>
.profil-page {
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
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

/* ── Mobile (≤ 600px) ── */
@media (max-width: 600px) {
  .profil-page {
    padding: 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  }
  .profil-title {
    font-size: 20px;
    margin-bottom: 14px;
  }
  .info-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  .info-avatar {
    width: 44px;
    height: 44px;
    font-size: 18px;
    border-radius: 10px;
  }
  .info-nama {
    font-size: 15px;
  }
}

/* ── Tiny (iPhone SE ≤ 375px) ── */
@media (max-width: 375px) {
  .profil-page {
    padding: 12px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
  .profil-title {
    font-size: 18px;
  }
  .info-avatar {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
  .kelas-select {
    font-size: 14px;
    padding: 10px 12px;
  }
}
</style>
