<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import STextField from '@/components/STextField.vue'
import SButton from '@/components/SButton.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'

const auth = useAuthStore()
const router = useRouter()

const nis = ref('')
const namaLengkap = ref('')
const email = ref('')
const kelas = ref('')
const password = ref('')
const konfirmasiPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

const isPasswordLengthValid = computed(() => password.value.length >= 8)
const isPasswordAlphanumeric = computed(() => /[a-zA-Z]/.test(password.value) && /[0-9]/.test(password.value))
const isPasswordValid = computed(() => isPasswordLengthValid.value && isPasswordAlphanumeric.value)

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

  if (!nis.value || !namaLengkap.value || !email.value || !kelas.value || !password.value || !konfirmasiPassword.value) {
    errorMsg.value = 'Harap isi semua field.'
    return
  }

  if (nis.value.length !== 4 || !/^\d+$/.test(nis.value)) {
    errorMsg.value = 'NIS harus terdiri dari 4 digit angka.'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errorMsg.value = 'Format email tidak valid.'
    return
  }

  if (password.value !== konfirmasiPassword.value) {
    errorMsg.value = 'Password dan konfirmasi password tidak cocok.'
    return
  }

  if (!isPasswordValid.value) {
    errorMsg.value = 'Password harus minimal 8 karakter dan mengandung huruf serta angka.'
    return
  }

  loading.value = true
  try {
    await auth.registerSiswa(nis.value, namaLengkap.value, email.value, kelas.value, password.value, konfirmasiPassword.value)
    await auth.login(nis.value, password.value, ['siswa'])
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
        <p class="register-tagline mb-0">Punya cerita, keluhan, atau saran tentang sekolah?</p>
        <p class="register-tagline">Buat akun untuk kirim laporan atau minta konsultasi dengan lebih mudah.</p>
        <span class="semester-badge">{{ semesterInfo }}</span>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="register-error">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 10.5h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- Row 1 -->
        <div class="form-row">
          <div class="nis-field form-col">
            <STextField
              label="Nomor Induk Siswa (NIS) SMP Desa Putera"
              placeholder="Masukkan 4 digit NIS"
              name="username"
              autocomplete="username"
              variant="text"
              v-model="nis"
              :required="true"
              maxlength="4"
              digitGuide="4"
            />
          </div>
          <div class="form-col">
            <STextField
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              name="name"
              autocomplete="name"
              variant="text"
              v-model="namaLengkap"
              :required="true"
            />
          </div>
        </div>

        <!-- Row 2: Email -->
        <div class="form-row">
          <div class="form-col">
            <STextField
              label="Email"
              placeholder="Masukkan email aktif"
              name="email"
              autocomplete="email"
              variant="text"
              input-type="email"
              v-model="email"
              :required="true"
            />
            <p class="email-hint">Digunakan untuk reset password jika lupa.</p>
          </div>
        </div>

        <!-- Row 2 -->
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

        <!-- Row 3 -->
        <div class="form-row">
          <div class="form-col">
            <STextField
              label="Password"
              placeholder="Kombinasi huruf & angka"
              name="password"
              autocomplete="new-password"
              variant="text"
              v-model="password"
              :required="true"
              input-type="password"
            />
            <div class="password-rules" v-if="password.length > 0">
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
          <div class="form-col">
            <STextField
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              name="confirm-password"
              autocomplete="new-password"
              variant="text"
              v-model="konfirmasiPassword"
              :required="true"
              input-type="password"
            />
          </div>
        </div>

        <SButton
          :label="loading ? 'Memproses...' : 'Daftar Akun'"
          variant="primary"
          type="submit"
          :disabled="loading"
          class="register-btn"
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
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.register-card {
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 20px;
  padding: 24px 16px;
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
  font-family: "Be Vietnam Pro", sans-serif;
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
  font-family: "Be Vietnam Pro", sans-serif;
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
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-col {
  flex: 1;
}

.register-btn {
  width: 100%;
  margin-top: 16px;
}

/* ── NIS field wrapper ── */
.nis-field {
  position: relative;
}

.email-hint {
  margin-top: 4px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  color: var(--color-neutral-400);
  font-style: italic;
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
  padding: 10px 12px;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
  color: var(--color-general-black, #333);
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  appearance: auto;
}

@media (min-width: 640px) {
  .kelas-select {
    padding: 12px 16px;
    font-size: 16px;
  }
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
  font-family: "Be Vietnam Pro", sans-serif;
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

/* ── Responsive ── */
@media (min-width: 768px) {
  .register-card {
    padding: 52px 32px;
  }

  .form-row {
    flex-direction: row;
    gap: 32px;
  }

  .register-form {
    gap: 32px;
  }

  .register-btn {
    margin-top: 0;
  }
}

@media (max-width: 375px) {
  .register-page {
    padding: 10px;
  }
  .register-card {
    padding: 18px 12px;
    border-radius: 16px;
  }
  .register-logo {
    height: 34px;
  }
  .register-tagline {
    font-size: 13px;
  }
  .register-form {
    gap: 12px;
  }
}
</style>
