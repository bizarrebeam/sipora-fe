<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SDialog from '@/components/SDialog.vue'
import SiporaLogo from '@/assets/sipora-logo-light.svg'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mobileMenuOpen = ref(false)
const showLogoutModal = ref(false)

const namaDepan = computed(() => auth.namaDepan)
const roleBadge = computed(() => auth.roleBadge)

const dashboardOpen = ref(false)
const mobileDashboardOpen = ref(false)

const isDashboardRoute = computed(() => route.path.startsWith('/dashboard-'))

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
  showLogoutModal.value = false
  await auth.logout()
  router.push('/internal/login-admin')
}
</script>

<template>
  <!-- DESKTOP SIDEBAR -->
  <aside class="sidebar-desktop">
    <div class="sidebar-logo-container">
      <RouterLink to="/">
        <img :src="SiporaLogo" alt="SIPORA" class="sidebar-logo" />
      </RouterLink>
    </div>

    <div class="sidebar-scroll">
      <nav class="sidebar-nav">
        <RouterLink to="/" class="sidebar-link" active-class="sidebar-link-active">Beranda</RouterLink>

        <div class="sidebar-group">
          <button class="sidebar-link w-full flex items-center justify-between" :class="{ 'sidebar-link-active': dashboardOpen || isDashboardRoute }" @click="dashboardOpen = !dashboardOpen">
            <span>Dashboard</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200" :class="{'rotate-180': dashboardOpen}">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-show="dashboardOpen" class="sidebar-subnav">
            <RouterLink to="/dashboard-bullying" class="sidebar-sublink" active-class="sidebar-sublink-active">Dashboard Bullying</RouterLink>
            <RouterLink to="/dashboard-kerusakan-aspirasi" class="sidebar-sublink" active-class="sidebar-sublink-active">Kerusakan & Aspirasi</RouterLink>
            <RouterLink to="/dashboard-konsultasi" class="sidebar-sublink" active-class="sidebar-sublink-active">Dashboard Konsultasi</RouterLink>
          </div>
        </div>

        <RouterLink to="/manajemen-akun" class="sidebar-link" active-class="sidebar-link-active">Manajemen Akun</RouterLink>
        <RouterLink to="/log-aktivitas" class="sidebar-link" active-class="sidebar-link-active">Log Aktivitas</RouterLink>
        <RouterLink to="/laporan-bullying" class="sidebar-link" active-class="sidebar-link-active">Laporan Bullying</RouterLink>
        <RouterLink to="/laporan-kerusakan" class="sidebar-link" active-class="sidebar-link-active">Laporan Kerusakan</RouterLink>
        <RouterLink to="/daftar-evaluasi" class="sidebar-link" active-class="sidebar-link-active">Daftar Evaluasi</RouterLink>
        <RouterLink to="/aspirasi" class="sidebar-link" active-class="sidebar-link-active">Aspirasi</RouterLink>
        <RouterLink to="/artikel" class="sidebar-link" active-class="sidebar-link-active">Kelola Artikel</RouterLink>
      </nav>
    </div>

    <div class="sidebar-footer">
      <RouterLink to="/profil" class="sidebar-user-info">
        <div class="auth-user-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="auth-user-text">
          <span class="auth-name">{{ namaDepan }}</span>
          <span class="auth-badge">{{ roleBadge }}</span>
        </div>
      </RouterLink>
      <button class="sidebar-logout" @click="openLogoutModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout
      </button>
    </div>
  </aside>

  <!-- MOBILE TOP NAV (Identical logic to SNavbar but only for Admin) -->
  <nav class="sidebar-mobile-top">
    <div class="mobile-top-inner">
      <RouterLink to="/" class="navbar-logo" @click="closeMobile">
        <img :src="SiporaLogo" alt="SIPORA" class="navbar-logo-img" />
      </RouterLink>
      <button class="hamburger" :class="{ 'hamburger--active': mobileMenuOpen }" @click="toggleMobile" aria-label="Toggle menu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <div class="mobile-menu-wrapper" :class="{ 'mobile-menu-wrapper--open': mobileMenuOpen }">
      <div class="mobile-menu">
        <RouterLink to="/" class="mobile-link" @click="closeMobile">Beranda</RouterLink>
        <RouterLink to="/manajemen-akun" class="mobile-link" @click="closeMobile">Manajemen Akun</RouterLink>
        <RouterLink to="/log-aktivitas" class="mobile-link" @click="closeMobile">Log Aktivitas</RouterLink>
        
        <div class="mobile-dashboard">
          <button class="mobile-link w-full flex justify-between items-center" @click="mobileDashboardOpen = !mobileDashboardOpen">
            Dashboard
            <span class="mobile-chevron" :class="{ 'open': mobileDashboardOpen }"></span>
          </button>
          <div v-show="mobileDashboardOpen" class="mobile-sublinks">
            <RouterLink to="/dashboard-bullying" class="mobile-link" @click="closeMobile">Dashboard Bullying</RouterLink>
            <RouterLink to="/dashboard-kerusakan-aspirasi" class="mobile-link" @click="closeMobile">Kerusakan & Aspirasi</RouterLink>
            <RouterLink to="/dashboard-konsultasi" class="mobile-link" @click="closeMobile">Dashboard Konsultasi</RouterLink>
          </div>
        </div>

        <RouterLink to="/laporan-bullying" class="mobile-link" @click="closeMobile">Laporan Bullying</RouterLink>
        <RouterLink to="/laporan-kerusakan" class="mobile-link" @click="closeMobile">Laporan Kerusakan</RouterLink>
        <RouterLink to="/daftar-evaluasi" class="mobile-link" @click="closeMobile">Daftar Evaluasi</RouterLink>
        <RouterLink to="/aspirasi" class="mobile-link" @click="closeMobile">Aspirasi</RouterLink>
        <RouterLink to="/artikel" class="mobile-link" @click="closeMobile">Kelola Artikel</RouterLink>
        
        <div class="mobile-divider"></div>
        <RouterLink to="/profil" class="mobile-user-row" @click="closeMobile">
          <div class="mobile-user-info">
            <span class="mobile-user-name">{{ namaDepan }}</span>
            <span class="mobile-badge">{{ roleBadge }}</span>
          </div>
        </RouterLink>
        <RouterLink to="/profil" class="mobile-link" @click="closeMobile">Manajemen Profil</RouterLink>
        <button class="mobile-link mobile-link--logout" @click="openLogoutModal">Logout</button>
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
/* ── DESKTOP SIDEBAR ── */
.sidebar-desktop {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: var(--color-blue-600);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sidebar-logo-container {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-logo {
  height: 36px;
  width: auto;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
}

/* Custom Scrollbar for sidebar */
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-link {
  color: var(--color-blue-50);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 14.5px;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
}

.sidebar-link:hover, .sidebar-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 600;
}

.sidebar-subnav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 12px;
  margin-top: 4px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  margin-left: 16px;
}

.sidebar-sublink {
  color: var(--color-blue-100);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 13.5px;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sidebar-sublink:hover, .sidebar-sublink-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.sidebar-user-info:hover {
  background: rgba(255, 255, 255, 0.15);
}

.auth-user-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  color: var(--color-blue-600);
  flex-shrink: 0;
}

.auth-user-text {
  display: flex;
  flex-direction: column;
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

.sidebar-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.15); /* Red tint */
  color: #FCA5A5;
  border: 1px solid rgba(220, 38, 38, 0.3);
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-logout:hover {
  background: rgba(220, 38, 38, 0.3);
  color: white;
}

/* ── MOBILE TOP NAV ── */
.sidebar-mobile-top {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: var(--color-blue-600);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.mobile-top-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
}

.navbar-logo-img {
  height: 36px;
  width: auto;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
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

.mobile-menu-wrapper {
  display: grid;
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
  color: #FCA5A5;
}

.mobile-sublinks {
  display: flex;
  flex-direction: column;
  padding-left: 12px;
  gap: 6px;
}

.mobile-chevron {
  transition: transform 0.2s ease;
  width: 10px;
  height: 10px;
  border-left: 2px solid var(--color-blue-50);
  border-bottom: 2px solid var(--color-blue-50);
  transform: rotate(-45deg) translateY(2px);
  margin-top: 6px;
}

.mobile-chevron.open {
  transform: rotate(135deg) translateY(-2px);
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

@media (max-width: 1024px) {
  .sidebar-desktop {
    display: none;
  }
  .sidebar-mobile-top {
    display: block;
  }
}
@media (max-width: 375px) {
  .mobile-top-inner {
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
