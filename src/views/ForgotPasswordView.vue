<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import STextField from '@/components/STextField.vue'
import SButton from '@/components/SButton.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'

const auth = useAuthStore()

const nis = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const maskedEmail = ref('')
const loading = ref(false)

async function handleForgot() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!nis.value) {
    errorMsg.value = 'Harap masukkan NIS.'
    return
  }

  if (nis.value.length !== 4 || !/^\d+$/.test(nis.value)) {
    errorMsg.value = 'NIS harus terdiri dari 4 digit angka.'
    return
  }

  loading.value = true
  try {
    const data = await auth.forgotPassword(nis.value)
    maskedEmail.value = data.masked_email
    successMsg.value = `Email reset password sudah dikirimkan ke ${data.masked_email}`
  } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[ForgotPasswordView] Request failed (handled globally):', err.message);
      return;
    }
    errorMsg.value = err.message || 'Gagal mengirim email reset. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-page">
    <div class="forgot-card">
      <!-- Header -->
      <div class="forgot-header">
        <img :src="SiporaLogo" alt="SIPORA" class="forgot-logo" />
        <h2 class="forgot-title">Lupa Password</h2>
        <p class="forgot-desc">Masukkan NIS kamu, dan kami akan mengirimkan link reset password ke email yang terdaftar.</p>
      </div>

      <!-- Success Message -->
      <div v-if="successMsg" class="forgot-success-outline">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div>
          <p class="success-title">Email reset password sudah dikirimkan ke {{ maskedEmail }}</p>
          <p class="success-hint">Periksa folder inbox atau spam email kamu.</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="forgot-error">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 10.5h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Form -->
      <form v-if="!successMsg" @submit.prevent="handleForgot" class="forgot-form">
        <STextField
          label="Nomor Induk Siswa (NIS)"
          placeholder="Masukkan 4 digit NIS"
          variant="text"
          v-model="nis"
          :required="true"
          maxlength="4"
          digitGuide="4"
        />
        <SButton
          :label="loading ? 'Mengirim...' : 'Kirim Link Reset'"
          variant="primary"
          type="submit"
          :disabled="loading"
        />
      </form>

      <!-- Footer -->
      <div class="forgot-footer">
        <p class="footer-text">
          Kembali ke
          <RouterLink to="/login" class="footer-link">halaman login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

.forgot-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 20px;
  padding: 24px 16px;
  box-shadow:
    0 4px 24px rgba(42, 44, 135, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
}

.forgot-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.forgot-logo {
  height: 44px;
  width: auto;
  margin-bottom: 16px;
}

.forgot-title {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: var(--color-general-black);
  margin-bottom: 8px;
}

.forgot-desc {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-neutral-500);
}

/* Success Outline Style */
.forgot-success-outline {
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

.forgot-success-outline svg {
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
.forgot-error {
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

.forgot-error svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Form */
.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.forgot-form :deep(.s-button) {
  width: 100%;
  margin-top: 4px;
}

/* Footer */
.forgot-footer {
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
  .forgot-card {
    padding: 40px 36px;
  }
}

@media (max-width: 375px) {
  .forgot-page {
    padding: 12px;
  }
  .forgot-card {
    padding: 20px 14px;
    border-radius: 16px;
  }
  .forgot-logo {
    height: 36px;
  }
  .forgot-title {
    font-size: 18px;
  }
  .forgot-desc {
    font-size: 13px;
  }
}
</style>
