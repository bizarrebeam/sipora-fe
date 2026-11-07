<script setup lang="ts">
import { computed } from 'vue'
import SiporaLogo from '@/assets/sipora-logo-light.svg'
import SchoolLogo from '@/assets/Logo.svg'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <!-- Left Section -->
      <div class="footer-left">
        <div class="footer-brand">
          <img :src="SiporaLogo" alt="SIPORA" class="footer-logo" />
          <p class="footer-desc">Sistem Pelaporan dan Aspirasi SMP Desa Putera</p>
        </div>
        <p class="footer-copyright">&copy; {{ currentYear }} SMP Desa Putera</p>
      </div>

      <!-- Middle Section -->
      <div class="footer-mid">
        <div class="footer-contact-row">
          <div class="contact-icon">
            <!-- Email Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <div class="footer-contact-item">
            <p class="font-bold">Mengalami kendala pada SIPORA?</p>
            <p>Laporkan temuanmu pada <a href="mailto:[REDACTED]" class="footer-link">[REDACTED]</a></p>
          </div>
        </div>

        <div class="footer-contact-row">
          <div class="contact-icon">
            <!-- WA/Phone Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
          <div class="footer-contact-item">
            <p class="font-bold">Hubungi bantuan konseling segera pada</p>
            <p>Hubungi administrator sekolah untuk bantuan.</p>
          </div>
        </div>
      </div>

      <!-- Right Section -->
      <div class="footer-right">
        <div class="school-info">
          <img :src="SchoolLogo" alt="SMP Desa Putera" class="school-logo-img" />
          <div class="school-values">
            <span>Kebersamaan</span>
            <span>Kemandirian</span>
            <span>Keunggulan</span>
          </div>
        </div>
        
        <div class="social-links">
          <a href="https://www.instagram.com/smpdesaputera/" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://www.smpdesaputera.com" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Website">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: var(--color-blue-600);
  color: var(--color-blue-50);
  padding: 40px 0;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 32px;
}

/* Left Section */
.footer-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-logo {
  height: 36px;
  width: auto;
  align-self: flex-start;
}

.footer-desc {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  color: white; 
  max-width: 250px;
}

.footer-copyright {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--color-blue-200);
  margin-top: 24px;
}

/* Middle Section */
.footer-mid {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
}

.footer-contact-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  flex-shrink: 0;
}

.footer-contact-item {
  font-family: var(--font-sans);
  font-size: 13.5px;
  line-height: 1.5;
  color: white;
  margin-top: 2px;
}

.font-bold {
  font-weight: 600;
  color: var(--color-blue-100); 
  margin-bottom: 4px;
}

.footer-link {
  color: white;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.4);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.2s;
}

.footer-link:hover {
  text-decoration-color: white;
}

/* Right Section */
.footer-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 24px;
}

.school-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.school-logo-img {
  height: 80px; 
  width: auto;
}

.school-values {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 600;
  color: white;
  line-height: 1.2;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transition: background-color 0.2s, transform 0.2s;
}

.social-icon:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .footer-left {
    gap: 20px;
  }
  
  .footer-desc {
    max-width: 100%;
  }

  .footer-right {
    align-items: flex-start;
  }
  
  .footer-copyright {
    margin-top: 0;
  }
}
</style>
