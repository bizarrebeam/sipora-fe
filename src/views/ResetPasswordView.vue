<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import STextField from '@/components/STextField.vue'
import SButton from '@/components/SButton.vue'

import SiporaLogo from '@/assets/sipora-logo.svg'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const uid = computed(() => route.params.uid as string)
const token = computed(() => route.params.token as string)

const password = ref('')
const konfirmasiPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const userRole = ref('')

const isPasswordLengthValid = computed(() => password.value.length >= 8)
const isPasswordAlphanumeric = computed(() => /[a-zA-Z]/.test(password.value) && /[0-9]/.test(password.value))
const isPasswordValid = computed(() => isPasswordLengthValid.value && isPasswordAlphanumeric.value)

const loginRoute = computed(() => {
  const roleMap: Record<string, string> = {
    guru: '/internal/login-guru',
    guru_bk: '/internal/login-bk',
    kemahasiswaan: '/internal/login-admin',
  }
  return roleMap[userRole.value] || '/login'
})

async function handleReset() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!password.value || !konfirmasiPassword.value) {
    errorMsg.value = 'Harap isi semua field.'
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
    const data = await auth.resetPassword(uid.value, token.value, password.value, konfirmasiPassword.value)
    if (data?.role) userRole.value = data.role
    successMsg.value = 'Password berhasil diubah! Kamu akan diarahkan ke halaman login...'
    setTimeout(() => {
      router.push(loginRoute.value)
    }, 3000)
  } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[ResetPasswordView] Request failed (handled globally):', err.message);
      return;
    }
    errorMsg.value = err.message || 'Link reset password tidak valid atau sudah kadaluarsa.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-page">
    <div class="reset-card">
      <!-- Header -->
      <div class="reset-header">
        <img :src="SiporaLogo" alt="SIPORA" class="reset-logo" />
        <h2 class="reset-title">Reset Password</h2>
        <p class="reset-desc">Buat password baru untuk akunmu.</p>
      </div>

      <!-- Success -->
      <div v-if="successMsg" class="reset-success-outline">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div>
          <p class="success-title">Password berhasil diubah!</p>
          <p class="success-hint">Kamu akan diarahkan ke halaman login...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="reset-error">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 10.5h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Form -->
      <form v-if="!successMsg" @submit.prevent="handleReset" class="reset-form" autocomplete="off">
        <STextField
          label="Password Baru"
          placeholder="Minimal 8 karakter"
          variant="text"
          v-model="password"
          :required="true"
          input-type="password"
          autocomplete="new-password"
        />
        <div class="password-rules" v-if="password.length > 0">
          <div :class="['rule-item', isPasswordLengthValid ? 'valid' : 'invalid']">
            <svg v-if="isPasswordLengthValid" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Minimal 8 karakter</span>
          </div>
          <div :class="['rule-item', isPasswordAlphanumeric ? 'valid' : 'invalid']">
            <svg v-if="isPasswordAlphanumeric" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Terdapat kombinasi huruf dan angka</span>
          </div>
        </div>
        <STextField
          label="Konfirmasi Password Baru"
          placeholder="Ulangi password baru"
          variant="text"
          v-model="konfirmasiPassword"
          :required="true"
          input-type="password"
          autocomplete="new-password"
        />
        <SButton
          :label="loading ? 'Memproses...' : 'Ubah Password'"
          variant="primary"
          type="submit"
          :disabled="loading"
        />
      </form>

      <!-- Footer -->
      <div class="reset-footer">
        <p class="footer-text">
          Kembali ke
          <RouterLink :to="loginRoute" class="footer-link">halaman login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.reset-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 20px;
  padding: 24px 16px;
  box-shadow:
    0 4px 24px rgba(42, 44, 135, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

.reset-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.reset-logo {
  height: 44px;
  width: auto;
  margin-bottom: 16px;
}

.reset-title {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--color-general-black);
  margin-bottom: 8px;
}

.reset-desc {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-neutral-500);
}

/* Success Outline */
.reset-success-outline {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #E8F5E9;
  border: 1px solid #2E7D32;
  color: #2E7D32;
  border-radius: 12px;
  margin-bottom: 20px;
}

.reset-success-outline svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.success-title {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
  line-height: 1.4;
}

.success-hint {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
}

/* Error */
.reset-error {
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

.reset-error svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Form */
.reset-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reset-form :deep(.s-button) {
  width: 100%;
  margin-top: 4px;
}

/* Password Rules */
.password-rules {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: -8px;
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
  color: #10B981;
}

.rule-item.invalid {
  color: #EF4444;
}

/* Footer */
.reset-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
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

@media (min-width: 480px) {
  .reset-card {
    padding: 40px 36px;
  }
}

@media (max-width: 375px) {
  .reset-page {
    padding: 12px;
  }
  .reset-card {
    padding: 20px 14px;
    border-radius: 16px;
  }
  .reset-logo {
    height: 36px;
  }
  .reset-title {
    font-size: 18px;
  }
}
</style>