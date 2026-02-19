<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SiporaLogo from '@/assets/sipora-logo-light.svg'

const auth = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

const isLoggedIn = computed(() => auth.isAuthenticated)
const userName = computed(() => auth.user?.nama_lengkap ?? '')

function toggleMobile() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobile() {
  mobileMenuOpen.value = false
}

async function handleLogout() {
  await auth.logout()
  closeMobile()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <!-- Logo -->
      <RouterLink to="/" class="navbar-logo" @click="closeMobile">
        <img :src="SiporaLogo" alt="SIPORA" class="navbar-logo-img" />
      </RouterLink>

      <!-- Desktop Nav Links -->
      <div class="navbar-links">
        <RouterLink to="/" class="nav-link">Beranda</RouterLink>
      </div>

      <!-- Desktop Auth Area -->
      <div class="navbar-auth">
        <template v-if="isLoggedIn">
          <span class="auth-name">{{ userName }}</span>
          <button class="auth-btn auth-btn--logout" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="auth-btn auth-btn--login">Login</RouterLink>
          <RouterLink to="/register" class="auth-btn auth-btn--register">Daftar</RouterLink>
        </template>
      </div>

      <!-- Mobile Hamburger -->
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

    <!-- Mobile Menu (CSS grid-row animation for smooth height) -->
    <div class="mobile-menu-wrapper" :class="{ 'mobile-menu-wrapper--open': mobileMenuOpen }">
      <div class="mobile-menu">
        <RouterLink to="/" class="mobile-link" @click="closeMobile">Beranda</RouterLink>
        <div class="mobile-divider"></div>
        <template v-if="isLoggedIn">
          <span class="mobile-user">{{ userName }}</span>
          <button class="mobile-link mobile-link--logout" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="mobile-link" @click="closeMobile">Login</RouterLink>
          <RouterLink to="/register" class="mobile-link" @click="closeMobile">Daftar</RouterLink>
        </template>
      </div>
    </div>
  </nav>
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
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
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
}

.nav-link {
  color: var(--color-blue-50);
  font-family: var(--font-plus-jakarta);
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

.auth-name {
  color: var(--color-blue-100);
  font-family: var(--font-plus-jakarta);
  font-weight: 500;
  font-size: 14px;
  margin-right: 4px;
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-plus-jakarta);
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
  font-family: var(--font-plus-jakarta);
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

/* ── Mobile Menu (grid-row trick for smooth height animation) ── */
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
  font-family: var(--font-plus-jakarta);
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

.mobile-user {
  color: var(--color-blue-100);
  font-family: var(--font-plus-jakarta);
  font-weight: 500;
  font-size: 14px;
  padding: 8px 0;
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
