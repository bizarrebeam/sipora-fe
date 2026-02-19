<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
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
  if (!identifier.value || !password.value) {
    errorMsg.value = 'Harap isi NISN dan password.'
    return
  }
  loading.value = true
  try {
    await auth.login(identifier.value, password.value)
    router.push('/')
  } catch (err: any) {
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
        <p class="login-tagline">Segera laporkan kendalamu di SMP Desa Putera!</p>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="login-error">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 10.5h.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="nisn-field">
          <STextField
            label="NISN"
            placeholder="Masukkan 10 digit NISN"
            variant="text"
            v-model="identifier"
            :required="true"
          />
          <a
            href="https://nisn.data.kemdikbud.go.id/index.php/Cindex/formcaribynama/"
            target="_blank"
            rel="noopener noreferrer"
            class="nisn-help"
          >Cek NISN-mu di sini!</a>
        </div>
        <STextField
          label="Password"
          placeholder="Masukkan password"
          variant="text"
          v-model="password"
          :required="true"
          input-type="password"
        />
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
          Belum punya akun?
          <RouterLink to="/register" class="footer-link">Daftar di sini</RouterLink>
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
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame);
  padding: 16px;
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

/* ── Header ── */
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.login-tagline {
  font-family: var(--font-plus-jakarta);
  font-weight: 400;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-neutral-500);
}

.login-logo {
  height: 44px;
  width: auto;
  margin-bottom: 12px;
}

/* ── Error ── */
.login-error {
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

.login-error svg {
  flex-shrink: 0;
  margin-top: 1px;
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

/* ── Footer ── */
.login-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
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
  .login-card {
    padding: 40px 36px;
  }

  .login-logo {
    height: 48px;
  }
}
</style>
