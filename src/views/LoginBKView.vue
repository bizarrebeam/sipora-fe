<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import STextField from '@/components/STextField.vue'
import SButton from '@/components/SButton.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'

const auth = useAuthStore()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  identifier.value = identifier.value.trim()
  if (!identifier.value || !password.value) {
    errorMsg.value = 'Harap isi semua field.'
    return
  }
  loading.value = true
  try {
    // for Guru BK
    await auth.login(identifier.value, password.value, ['guru_bk'])
    router.push('/')
  } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[LoginBKView] Request failed (handled globally):', err.message);
      return;
    }
    errorMsg.value = err.message || 'Login gagal. Periksa kredensial Anda.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Header with logo -->
      <div class="login-header">
        <img :src="SiporaLogo" alt="SIPORA" class="login-logo" />
        <p class="login-tagline">Masuk untuk mengelola bimbingan konseling dan komunikasi internal sekolah.</p>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="login-error">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 10.5h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <STextField
          label="Username"
          placeholder="Ketik username Anda"
          variant="text"
          v-model="identifier"
          :required="true"
        />
        <STextField
          label="Password"
          placeholder="Ketik password Anda"
          variant="text"
          v-model="password"
          :required="true"
          input-type="password"
        />
        <div class="forgot-password-row">
          <span class="forgot-link-text">Lupa password? Hubungi Kemahasiswaan</span>
        </div>
        <SButton
          :label="loading ? 'Memproses...' : 'Masuk'"
          variant="primary"
          type="submit"
          :disabled="loading"
        />
      </form>

      <!-- Footer -->
      <div class="login-footer">
        <p class="footer-text">
          Belum punya akun? Hubungi Kemahasiswaan sekolahmu.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: var(--color-general-frame);
  padding: 16px;
  box-sizing: border-box;
}

@media (max-width: 375px) {
  .login-page {
    padding: 12px;
    overflow: hidden;
  }
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow:
    0 4px 24px rgba(42, 44, 135, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.login-tagline {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-neutral-500);
}

.login-logo {
  height: 44px;
  width: auto;
  margin-bottom: 20px;
}

.login-error {
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

/* ── Form ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-form :deep(.s-button) {
  width: 100%;
  margin-top: 4px;
}

.forgot-password-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}

.forgot-link-text {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-blue-400);
  cursor: default;
}

/* ── Footer ── */
.login-footer {
  margin-top: 24px;
}

.footer-text {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 13px;
  color: var(--color-neutral-500);
  text-align: center;
}

@media (min-width: 480px) {
  .login-card {
    padding: 40px 36px;
  }
}
</style>
