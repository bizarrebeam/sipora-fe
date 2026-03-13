<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SDialog from '@/components/SDialog.vue'
import SiporaLogo from '@/assets/sipora-logo-light.svg'

const auth = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const showLogoutModal = ref(false)

const isLoggedIn = computed(() => auth.isAuthenticated)
const namaDepan = computed(() => auth.namaDepan)
const roleBadge = computed(() => auth.roleBadge)
const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')
const canManageAkun = computed(() => isAdmin.value || auth.user?.role === 'guru_bk')

function toggleMobile() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobile() {
  mobileMenuOpen.value = false
}

function openLogoutModal() {
  showLogoutModal.value = true
  closeMobile()
}

async function confirmLogout() {
  const role = auth.user?.role
  showLogoutModal.value = false
  await auth.logout()

  if (role === 'kemahasiswaan' || role === 'admin' || role === 'admin_sistem') {
    router.push('/internal/login-admin')
  } else if (role === 'guru' || role === 'guru_bk') {
    router.push('/internal/login-bk')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <RouterLink to="/" class="navbar-logo" @click="closeMobile">
        <img :src="SiporaLogo" alt="SIPORA" class="navbar-logo-img" />
      </RouterLink>

      <div v-if="isLoggedIn" class="navbar-links">
        <RouterLink to="/" class="nav-link">Beranda</RouterLink>
        <RouterLink v-if="canManageAkun" to="/manajemen-akun" class="nav-link">Manajemen Akun</RouterLink>
        <RouterLink v-if="isAdmin" to="/log-aktivitas" class="nav-link">Log Aktivitas</RouterLink>
        <RouterLink to="/laporan-bullying" class="nav-link">Laporan Bullying</RouterLink>
        <RouterLink to="/laporan-kerusakan" class="nav-link">Laporan Kerusakan</RouterLink>
        <RouterLink to="/aspirasi" class="nav-link">Aspirasi</RouterLink>
      </div>

      <div class="navbar-auth">
        <template v-if="isLoggedIn">
          <RouterLink to="/profil" class="auth-user-link">
            <div class="auth-user-info">
              <span class="auth-name">{{ namaDepan }}</span>
              <span class="auth-badge">{{ roleBadge }}</span>
            </div>
            <div class="auth-user-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </RouterLink>
          <button class="auth-btn auth-btn--logout" @click="openLogoutModal">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="auth-btn auth-btn--login">Login</RouterLink>
          <RouterLink to="/register" class="auth-btn auth-btn--register">Daftar</RouterLink>
        </template>
      </div>

      <button
        class="hamburger"
        :class="{ 'hamburger--active': mobileMenuOpen }"
        @click="toggleMobile"
        aria-label="Toggle menu"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <div class="mobile-menu-wrapper" :class="{ 'mobile-menu-wrapper--open': mobileMenuOpen }">
      <div class="mobile-menu">
        <template v-if="isLoggedIn">
          <RouterLink to="/" class="mobile-link" @click="closeMobile">Beranda</RouterLink>
          <RouterLink v-if="canManageAkun" to="/manajemen-akun" class="mobile-link" @click="closeMobile">Manajemen Akun</RouterLink>
          <RouterLink v-if="isAdmin" to="/log-aktivitas" class="mobile-link" @click="closeMobile">Log Aktivitas</RouterLink>
          <RouterLink to="/laporan-bullying" class="mobile-link" @click="closeMobile">Laporan Bullying</RouterLink>
          <RouterLink to="/laporan-kerusakan" class="mobile-link" @click="closeMobile">Laporan Kerusakan</RouterLink>
          <RouterLink to="/aspirasi" class="mobile-link" @click="closeMobile">Aspirasi</RouterLink>
          <div class="mobile-divider"></div>
          <RouterLink to="/profil" class="mobile-user-row" @click="closeMobile">
            <div class="mobile-user-info">
              <span class="mobile-user-name">{{ namaDepan }}</span>
              <span class="mobile-badge">{{ roleBadge }}</span>
            </div>
          </RouterLink>
          <RouterLink to="/profil" class="mobile-link" @click="closeMobile">Manajemen Profil</RouterLink>
          <button class="mobile-link mobile-link--logout" @click="openLogoutModal">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="mobile-link" @click="closeMobile">Login</RouterLink>
          <RouterLink to="/register" class="mobile-link" @click="closeMobile">Daftar</RouterLink>
        </template>
      </div>
    </div>
  </nav>

  <SDialog
    :visible="showLogoutModal"
    variant="danger"
    title="Konfirmasi Keluar"
    message="Apakah Anda yakin ingin keluar dari sistem SIPORA?"
    confirmLabel="Ya, Keluar"
    cancelLabel="Batal"
    @update:visible="showLogoutModal = $event"
    @close="showLogoutModal = false"
    @cancel="showLogoutModal = false"
    @confirm="confirmLogout"
  />
</template>

<style scoped>
/* ── Navbar Container ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-blue-600);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 48px;
  height: 64px;
}

/* ── Logo ── */
.navbar-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.navbar-logo-img {
  height: 36px;
  width: auto;
}

/* ── Desktop Nav Links ── */
.navbar-links {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-left: auto;
  margin-right: 32px;
}

.nav-link {
  color: var(--color-blue-50);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  padding: 8px 4px;
  position: relative;
  transition: color 0.2s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-blue-50);
  transition: width 0.25s ease;
}

.nav-link:hover {
  color: white;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

/* ── Desktop Auth ── */
.navbar-auth {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-user-link {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.auth-user-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.auth-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  gap: 2px;
}

.auth-name {
  color: white;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
}

.auth-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-blue-50);
  font-family: var(--font-be-vietnam);
  font-weight: 600;
  font-size: 11px;
  border-radius: 100px;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.auth-user-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.auth-btn--login {
  background: transparent;
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
}

.auth-btn--login:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
}

.auth-btn--register {
  background: white;
  color: var(--color-blue-600);
}

.auth-btn--register:hover {
  background: var(--color-blue-50);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.auth-btn--logout {
  background: transparent;
  color: var(--color-blue-100);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-btn--logout:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
  color: white;
}

/* ── Hamburger ── */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 10;
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 2.5px;
  background: white;
  border-radius: 2px;
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
              opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1);
  transform-origin: center;
}

.hamburger--active .hamburger-line:nth-child(1) {
  transform: translateY(7.5px) rotate(45deg);
}

.hamburger--active .hamburger-line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger--active .hamburger-line:nth-child(3) {
  transform: translateY(-7.5px) rotate(-45deg);
}

/* ── Mobile Menu ── */
.mobile-menu-wrapper {
  display: none;
  grid-template-rows: 0fr;
  overflow: hidden;
  transition: grid-template-rows 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.mobile-menu-wrapper--open {
  grid-template-rows: 1fr;
}

.mobile-menu {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  background: var(--color-blue-700);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.35s cubic-bezier(0.23, 1, 0.32, 1) 0.05s,
              transform 0.35s cubic-bezier(0.23, 1, 0.32, 1) 0.05s,
              padding 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.mobile-menu-wrapper--open .mobile-menu {
  padding: 16px 24px 24px;
  opacity: 1;
  transform: translateY(0);
}

.mobile-link {
  display: block;
  color: var(--color-blue-50);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  padding: 12px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s ease;
}

.mobile-link:hover {
  color: white;
}

.mobile-link--logout {
  color: var(--color-blue-200);
}

.mobile-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  text-decoration: none;
}

.mobile-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.mobile-user-name {
  color: white;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 15px;
}

.mobile-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-blue-50);
  font-family: var(--font-be-vietnam);
  font-weight: 600;
  font-size: 11px;
  border-radius: 100px;
}

.mobile-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .navbar-links,
  .navbar-auth {
    display: none;
  }

  .hamburger {
    display: flex;
  }

  .mobile-menu-wrapper {
    display: grid;
  }
}
</style>