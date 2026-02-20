<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import STextField from '@/components/STextField.vue'
import SButton from '@/components/SButton.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'

const auth = useAuthStore()
const router = useRouter()

const nisn = ref('')
const namaLengkap = ref('')
const kelas = ref('')
const password = ref('')
const konfirmasiPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

const kelasOptions = ['7A', '7B', '8A', '8B', '9A', '9B']

// Compute current semester info
const semesterInfo = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  if (month >= 7) {
    return `Semester Ganjil ${year}/${year + 1}`
  }
  return `Semester Genap ${year - 1}/${year}`
})

async function handleRegister() {
  errorMsg.value = ''

  if (!nisn.value || !namaLengkap.value || !kelas.value || !password.value || !konfirmasiPassword.value) {
    errorMsg.value = 'Harap isi semua field.'
    return
  }

  if (nisn.value.length !== 10 || !/^\d+$/.test(nisn.value)) {
    errorMsg.value = 'NISN harus terdiri dari 10 digit angka.'
    return
  }

  if (password.value !== konfirmasiPassword.value) {
    errorMsg.value = 'Password dan konfirmasi password tidak cocok.'
    return
  }

  if (password.value.length < 6) {
    errorMsg.value = 'Password minimal 6 karakter.'
    return
  }

  loading.value = true
  try {
    await auth.registerSiswa(nisn.value, namaLengkap.value, kelas.value, password.value, konfirmasiPassword.value)
    await auth.login(nisn.value, password.value)
    router.push('/')
  } catch (err: any) {
    errorMsg.value = err.message || 'Pendaftaran gagal. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <!-- Header -->
      <div class="register-header">
        <img :src="SiporaLogo" alt="SIPORA" class="register-logo" />
        <p class="register-tagline">Buat akun siswa untuk membantu SMP Desa Putera menjadi lebih baik.</p>
        <span class="semester-badge">{{ semesterInfo }}</span>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="register-error">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 10.5h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="nisn-field">
          <STextField
            label="NISN"
            placeholder="Masukkan 10 digit NISN"
            variant="text"
            v-model="nisn"
            :required="true"
          />
          <a
            href="https://nisn.data.kemdikbud.go.id/index.php/Cindex/formcaribynama/"
            target="_blank"
            rel="noopener noreferrer"
            class="nisn-help"
          >Lupa NISN?</a>
        </div>
        <STextField
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap"
          variant="text"
          v-model="namaLengkap"
          :required="true"
        />

        <!-- Kelas Select -->
        <div class="kelas-field">
          <div class="s-textfield__label-row">
            <label class="s-textfield__label">Kelas</label>
            <span class="s-textfield__required">*</span>
          </div>
          <select v-model="kelas" class="kelas-select" required>
            <option value="" disabled>Pilih kelas...</option>
            <option v-for="k in kelasOptions" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>

        <STextField
          label="Password"
          placeholder="Min. 6 karakter"
          variant="text"
          v-model="password"
          :required="true"
          input-type="password"
        />
        <STextField
          label="Konfirmasi Password"
          placeholder="Ulangi password"
          variant="text"
          v-model="konfirmasiPassword"
          :required="true"
          input-type="password"
        />
        <SButton
          :label="loading ? 'Memproses...' : 'Daftar Akun'"
          variant="primary"
          type="submit"
          :disabled="loading"
        />
      </form>

      <!-- Footer -->
      <div class="register-footer">
        <p class="footer-text">
          Sudah punya akun?
          <RouterLink to="/login" class="footer-link">Masuk di sini</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 16px;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 28px 24px;
  box-shadow:
    0 4px 24px rgba(42, 44, 135, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

/* ── Header ── */
.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.register-tagline {
  font-family: var(--font-plus-jakarta);
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-neutral-500);
}

.register-logo {
  height: 44px;
  width: auto;
  margin-bottom: 10px;
}

.semester-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 6px 14px;
  background: var(--color-blue-50);
  color: var(--color-blue-600);
  font-family: var(--font-be-vietnam);
  font-weight: 600;
  font-size: 12px;
  border-radius: 100px;
  letter-spacing: 0.3px;
}

/* ── Error ── */
.register-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-family: var(--font-plus-jakarta);
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 16px;
}

.register-error svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ── Form ── */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.register-form :deep(.s-button) {
  width: 100%;
  margin-top: 4px;
}

/* ── NISN field wrapper ── */
.nisn-field {
  position: relative;
}

.nisn-help {
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

.nisn-help:hover {
  color: var(--color-blue-600);
  text-decoration: underline;
}

/* ── Kelas Select ── */
.kelas-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-textfield__label-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.s-textfield__label {
  color: var(--color-general-black, #333);
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.s-textfield__required {
  color: var(--color-general-red, #FC6668);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
}

.kelas-select {
  display: flex;
  padding: 12px 16px;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
  color: var(--color-general-black, #333);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  appearance: auto;
}

.kelas-select:hover {
  border-color: var(--color-blue-500, #2E3094);
}

.kelas-select:focus {
  outline: none;
  border-color: var(--color-blue-500, #2E3094);
  box-shadow: 0 0 0 2px rgba(46, 48, 148, 0.15);
}

/* ── Footer ── */
.register-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
}

.footer-text {
  font-family: var(--font-plus-jakarta);
  font-size: 13px;
  color: var(--color-neutral-500);
}

.footer-link {
  color: var(--color-blue-500);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--color-blue-600);
  text-decoration: underline;
}

/* ── Responsive ── */
@media (min-width: 480px) {
  .register-card {
    padding: 36px 32px;
  }

  .register-logo {
    height: 48px;
  }

  .register-form {
    gap: 16px;
  }
}
</style>
