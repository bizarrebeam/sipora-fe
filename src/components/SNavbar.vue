<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SDialog from '@/components/SDialog.vue'
import SChip from '@/components/SChip.vue'
import SiporaLogo from '@/assets/sipora-logo-light.svg'

const auth = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const showLogoutModal = ref(false)
const profileMenuOpen = ref(false)

const isLoggedIn = computed(() => auth.isAuthenticated)
const namaDepan = computed(() => auth.namaDepan)
const roleBadge = computed(() => auth.roleBadge)
const isVerified = computed(() => auth.isVerified)
const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')
const canManageAkun = computed(() => isAdmin.value || auth.user?.role === 'guru_bk')

const artikelLabel = computed(() => {
  if (!isLoggedIn.value) return 'Baca Artikel'
  return isAdmin.value ? 'Kelola Artikel' : 'Baca Artikel'
})

function toggleMobile() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobile() {
  mobileMenuOpen.value = false
}

function openLogoutModal() {
  showLogoutModal.value = true
  closeMobile()
  profileMenuOpen.value = false
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

      <div class="navbar-links">
        <RouterLink to="/" class="nav-link">Beranda</RouterLink>
        <template v-if="isLoggedIn">
          <RouterLink v-if="canManageAkun" to="/manajemen-akun" class="nav-link">Manajemen Akun</RouterLink>
          <RouterLink v-if="isAdmin" to="/log-aktivitas" class="nav-link">Log Aktivitas</RouterLink>
          <RouterLink to="/laporan-bullying" class="nav-link">Laporan Bullying</RouterLink>
          <RouterLink v-if="isAdmin || auth.user?.role === 'guru' || auth.user?.role === 'siswa'" to="/laporan-kerusakan" class="nav-link">Laporan Kerusakan</RouterLink>
          <RouterLink v-if="auth.user?.role === 'siswa'" to="/kirim-evaluasi" class="nav-link">Evaluasi Guru</RouterLink>
          <RouterLink to="/aspirasi" class="nav-link">Aspirasi</RouterLink>
        </template>
        <RouterLink to="/artikel" class="nav-link">{{ artikelLabel }}</RouterLink>
      </div>

      <div class="navbar-auth">
        <template v-if="isLoggedIn">
          <div class="auth-dropdown" @mouseenter="profileMenuOpen = true" @mouseleave="profileMenuOpen = false">
            <button class="auth-user-link" @click="profileMenuOpen = !profileMenuOpen">
              <div class="auth-user-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" class="feather-user" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="auth-user-info">
                <span class="auth-name">{{ namaDepan }}</span>
                <div class="flex items-center gap-2">
                  <span class="auth-badge">{{ roleBadge }}</span>
                  <div 
                    v-if="auth.user?.role === 'siswa' && !isVerified" 
                    class="group relative flex items-center justify-center shrink-0 cursor-help"
                  >
                    <!-- Warning Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-yellow-400 group-hover:text-yellow-300 transition-colors" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    
                    <!-- Tooltip -->
                    <div class="absolute bottom-full mb-2 left-[50%] -translate-x-[50%] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap bg-general-black text-white text-[11px] font-semibold font-['Be_Vietnam_Pro'] px-3 py-1.5 rounded shadow-lg z-50 pointer-events-none">
                      Belum Terverifikasi
                      <div class="absolute top-full left-[50%] -translate-x-[50%] border-4 border-transparent border-t-general-black"></div>
                    </div>
                  </div>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dropdown-chevron" :class="{'chevron-up': profileMenuOpen}">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <Transition name="dropdown">
              <div v-show="profileMenuOpen" class="auth-dropdown-menu">
                <RouterLink to="/profil" class="dropdown-item" @click="profileMenuOpen = false">Manajemen Profil</RouterLink>
                <button class="dropdown-item dropdown-item--logout" @click="openLogoutModal">Logout</button>
              </div>
            </Transition>
          </div>
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
        <RouterLink to="/" class="mobile-link" @click="closeMobile">Beranda</RouterLink>
        <template v-if="isLoggedIn">
          <RouterLink v-if="canManageAkun" to="/manajemen-akun" class="mobile-link" @click="closeMobile">Manajemen Akun</RouterLink>
          <RouterLink v-if="isAdmin" to="/log-aktivitas" class="mobile-link" @click="closeMobile">Log Aktivitas</RouterLink>
          <RouterLink to="/laporan-bullying" class="mobile-link" @click="closeMobile">Laporan Bullying</RouterLink>
          <RouterLink v-if="isAdmin || auth.user?.role === 'guru' || auth.user?.role === 'siswa'" to="/laporan-kerusakan" class="mobile-link" @click="closeMobile">Laporan Kerusakan</RouterLink>
          <RouterLink v-if="auth.user?.role === 'siswa'" to="/kirim-evaluasi" class="mobile-link" @click="closeMobile">Evaluasi Guru</RouterLink>
          <RouterLink to="/aspirasi" class="mobile-link" @click="closeMobile">Aspirasi</RouterLink>
        </template>
        <RouterLink to="/artikel" class="mobile-link" @click="closeMobile">{{ artikelLabel }}</RouterLink>
        <div class="mobile-divider"></div>
        <template v-if="isLoggedIn">
          <RouterLink to="/profil" class="mobile-user-row" @click="closeMobile">
            <div class="mobile-user-info">
              <span class="mobile-user-name">{{ namaDepan }}</span>
              <div class="flex items-center gap-2">
                <span class="mobile-badge">{{ roleBadge }}</span>
                <div 
                  v-if="auth.user?.role === 'siswa' && !isVerified" 
                  class="flex items-center gap-1.5 bg-yellow-400/20 px-2.5 py-1 rounded-full border border-yellow-400/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" class="text-yellow-400" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span class="text-[10px] font-bold text-yellow-400 font-['Be_Vietnam_Pro'] tracking-wide">PENDING</span>
                </div>
              </div>
            </div>
          </RouterLink>
          <RouterLink to="/profil" class="mobile-link" @click="closeMobile">Manajemen Profil</RouterLink>
          <button class="mobile-link mobile-link--logout" @click="openLogoutModal">Logout</button>
        </template>
        <template v-else>
          <div class="flex flex-col gap-2 mt-4 pb-4">
            <RouterLink to="/login" class="auth-btn auth-btn--login w-full text-center" @click="closeMobile">Login</RouterLink>
            <RouterLink to="/register" class="auth-btn auth-btn--register w-full text-center" @click="closeMobile">Daftar</RouterLink>
          </div>
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: var(--color-blue-600);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.navbar-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
}

/* ── Logo ── */
.navbar-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.navbar-logo-img {
  height: 36px;
  width: auto;
}

/* ── Desktop Nav Links ── */
.navbar-links {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: var(--color-blue-50);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 13.5px;
  text-decoration: none;
  padding: 8px 4px;
  position: relative;
  transition: color 0.2s ease;
  white-space: nowrap;
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
  justify-content: flex-end;
  gap: 12px;
}

.auth-dropdown {
  position: relative;
}

.auth-user-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  padding: 4px 14px 4px 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-user-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.auth-user-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: white;
  color: var(--color-blue-600);
  flex-shrink: 0;
}

.auth-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0px;
}

.auth-name {
  color: white;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
}

.auth-badge {
  color: var(--color-blue-100);
  font-family: var(--font-be-vietnam);
  font-weight: 500;
  font-size: 11px;
  line-height: 1.2;
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

.dropdown-chevron {
  color: white;
  transition: transform 0.2s ease;
  margin-left: 2px;
  margin-right: -4px;
}

.chevron-up {
  transform: rotate(180deg);
}

.auth-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  z-index: 100;
  border: 1px solid var(--color-general-border, #E5E7EB);
}

.dropdown-item {
  display: flex;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-general-black, #1F2937);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.dropdown-item:hover {
  background: var(--color-blue-50);
  color: var(--color-blue-600);
}

.dropdown-item--logout {
  color: #DC2626;
  margin-top: 4px;
  border-top: 1px solid #f3f4f6;
}

.dropdown-item--logout:hover {
  background: #FEF2F2;
  color: #DC2626;
}

/* Transition for dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
@media (max-width: 1024px) {
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

/* ── Safe-area for mobile menu ── */
@media (max-width: 1024px) {
  .mobile-menu-wrapper--open .mobile-menu {
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
}

/* ── iPhone SE (≤ 375px) ── */
@media (max-width: 375px) {
  .navbar-inner {
    padding: 0 12px;
  }
  .mobile-link {
    font-size: 14px;
    padding: 10px 0;
  }
  .mobile-user-name {
    font-size: 13px;
  }
}
</style>
