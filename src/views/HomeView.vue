<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SCard from '@/components/SCard.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'
import { useRevealOnScroll } from '@/components/ARevealOnScroll'

const heroReveal = useRevealOnScroll()
const fiturReveal = useRevealOnScroll()
const tentangReveal = useRevealOnScroll()
const faqReveal = useRevealOnScroll()

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isAuthenticated)

const features = ref([
  { id: 1, text: 'Laporkan Bullying', icon: new URL('@/assets/laporan-bully.svg', import.meta.url).href },
  { id: 2, text: 'Laporkan Kerusakan Fasilitas Sekolah', icon: new URL('@/assets/laporan-kerusakan.svg', import.meta.url).href },
  { id: 3, text: 'Sampaikan Aspirasi', icon: new URL('@/assets/aspirasi.svg', import.meta.url).href },
  { id: 4, text: 'Konsultasi ke Guru BK', icon: new URL('@/assets/konsultasi.svg', import.meta.url).href },
  { id: 5, text: 'Evaluasi Guru', icon: new URL('@/assets/evaluasi.svg', import.meta.url).href },
])

const faqs = ref([
  {
    id: 1,
    question: 'Bagaimana cara saya melaporkan kejadian bullying secara anonim?',
    answer: 'Anda dapat melaporkan kejadian bullying secara anonim dengan memilih opsi "Samarkan Identitas" pada form pelaporan bullying.',
    open: false
  },
  {
    id: 2,
    question: 'Bagaimana cara mengatur jadwal konsultasi dengan Guru BK?',
    answer: 'Pilih jadwal yang tersedia di menu Konsultasi, lalu tunggu konfirmasi dari Guru BK terkait jadwal Anda.',
    open: false
  },
  {
    id: 3,
    question: 'Dapatkah saya mengubah atau membatalkan laporan yang sudah terkirim?',
    answer: 'Ya, Anda dapat mengedit atau membatalkan laporan bullying maupun laporan kerusakan fasilitas, namun hanya selama status laporan masih "Menunggu Konfirmasi". Jika pihak sekolah sudah mengubah status laporan menjadi "Diproses" atau status lainnya, maka laporan tersebut tidak dapat diubah atau dibatalkan lagi oleh pelapor.',
    open: false
  },
  {
    id: 4,
    question: 'Siapa saja yang dapat melihat hasil evaluasi kinerja guru yang saya berikan?',
    answer: 'Hasil evaluasi yang Anda berikan melalui fitur Evaluasi Staff dan Guru akan direkap secara otomatis oleh sistem. Pihak kemahasiswaan dapat melihat rekapitulasi seluruh hasil (rata-rata rating dan komentar), sedangkan Guru terkait hanya dapat melihat statistik nilai dan komentar Anda tanpa mengetahui identitas Anda (anonim).',
    open: false
  }
])

const toggleFaq = (index: number) => {
  const faq = faqs.value[index]
  if (faq) {
    faq.open = !faq.open
  }
}
</script>

<template>
  <!-- ========== LANDING (not logged in) ========== -->
  <div v-if="!isLoggedIn" class="landing">
    <div class="landing-content">
      <img :src="SiporaLogo" alt="SIPORA" class="landing-logo" />
      <p class="landing-tagline">
        Dukung SMP Desa Putera menjadi lebih baik<br />melalui laporanmu.
      </p>
      <div class="landing-actions">
        <RouterLink to="/login" class="landing-btn landing-btn--login">
          Masuk
        </RouterLink>
        <RouterLink to="/register" class="landing-btn landing-btn--register">
          Daftar Akun
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- ========== HOMEPAGE (logged in) ========== -->
  <div v-else class="min-h-screen bg-general-frame p-8">
    <div class="max-w-5xl mx-auto flex flex-col gap-16 md:gap-24">
      
      <!-- HERO SECTION -->
      <section 
        ref="heroReveal.el"
  :class="[
    'w-full p-8 md:p-12 border border-general-border rounded-lg bg-blue-50 relative overflow-hidden flex flex-col items-center gap-10 bg-cover bg-center bg-no-repeat transition-all duration-500 ease-out',
    heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
  ]"
        style="background-image: url('/src/assets/sekolah.svg');"
      >
       <div class="w-full max-w-[800px] h-[250px] rounded-lg flex flex-col items-center justify-center p-8 z-10 gap-4">
        <img
          src="@/assets/sipora-logo.svg"
          alt="Sipora Logo"
          class="h-48 w-auto object-contain drop-shadow-md"
        />

        <h1 class="text-heading-h2 text-blue-600 font-extrabold text-center max-w-4xl leading-snug drop-shadow-md">
          Sistem Pelaporan dan Aspirasi SMP Budi Mulia Desa Putera
        </h1>
      </div>
      </section>

      <!-- FITUR SIPORA SECTION -->
      <section 
        ref="fiturReveal.el"
        :class="[
          'flex flex-col gap-8 w-full transition-all duration-500 ease-out delay-75',
          fiturReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        ]"
      >
        <h2 class="text-heading-h3 text-blue-600 font-extrabold">Fitur SIPORA</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <SCard 
            v-for="feature in features" 
            :key="feature.id" 
            class="flex flex-col items-center justify-center text-center p-6 h-[250px] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white"
          >
             <div class="h-24 mb-4 flex items-center justify-center">
               <img :src="feature.icon" :alt="feature.text" class="h-full w-auto object-contain" />
             </div>
             <p class="text-body-b5 font-semibold text-general-black">{{ feature.text }}</p>
          </SCard>
        </div>
      </section>

      <!-- TENTANG SIPORA SECTION -->
      <section 
        ref="tentangReveal.el"
        :class="[
          'max-w-[1389px] border border-general-border w-full flex-col md:flex-row flex gap-10 items-stretch bg-blue-50 p-8 md:p-12 rounded-2xl transition-all duration-500 ease-out delay-100',
          tentangReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        ]"
      >
         <div class="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-general-border flex justify-center items-center h-[300px]">
           <img src="@/assets/priwitan-whistle.svg" alt="Sipora Logo" class="h-56 w-auto object-contain" />
         </div>
         <div class="w-full md:w-2/3 flex flex-col gap-6 justify-center">
           <h2 class="text-heading-h2 text-blue-500 font-extrabold max-w-[933px]">Tentang Sipora</h2>
           <p class="text-body-b4 text-blue-800 leading-relaxed max-w-[933px]">
             Sipora merupakan sistem informasi pelaporan dan evaluasi sekolah yang dirancang untuk mendukung terciptanya lingkungan pendidikan yang aman, transparan, dan responsif. Aplikasi ini memfasilitasi pelaporan bullying, pengelolaan konseling, publikasi artikel kesehatan mental, serta evaluasi guru dan staff secara terintegrasi dalam satu platform.
           </p>
         </div>
      </section>

      <!-- FAQ SECTION TODO: Kiki -->
      <section 
        ref="faqReveal.el"
        :class="[
          'flex flex-col gap-8 w-full mb-16 max-w-[1389px] transition-all duration-500 ease-out delay-150',
          faqReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        ]"
      >
        <h2 class="text-heading-h3 text-blue-600 font-extrabold">FAQ (Frequently Asked Questions)</h2>
        
        <div class="flex flex-col gap-6">
          <div v-for="(faq, index) in faqs" :key="faq.id" class="flex flex-col w-full relative">
            <SCard 
              padding="32px 49px"
              class="cursor-pointer hover:bg-neutral-50 transition-colors z-10 w-full"
              @click="toggleFaq(index)"
            >
              <div class="flex justify-between items-center w-full gap-4">
                <h4 class="text-heading-h5 text-blue-500 flex-1">{{ faq.question }}</h4>
                <div class="text-blue-500 transform transition-transform duration-300 w-[24px] h-[24px] flex items-center justify-center font-bold" :class="{ 'rotate-180': faq.open }">
                  <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7L10 13L4 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </SCard>
            
            <div 
              v-show="faq.open" 
              class="bg-neutral-50 border border-general-border rounded-b-lg p-6 pt-10 pb-8 mt-[-15px] z-0 text-body-b5 text-blue-800 leading-relaxed"
            >
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* ── Landing Page Styles ── */
.landing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  background: linear-gradient(160deg, var(--color-blue-50) 0%, var(--color-general-frame) 40%, white 100%);
  padding: 32px 24px;
}

.landing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 360px;
  animation: fadeUp 0.6s ease-out;
}

.landing-logo {
  height: 48px;
  width: auto;
  margin-bottom: 20px;
}

.landing-tagline {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-neutral-500);
  margin-bottom: 28px;
}

.landing-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.landing-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-be-vietnam);
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
}

.landing-btn--login {
  background: var(--color-blue-500);
  color: white;
  box-shadow: 0 4px 16px rgba(46, 48, 148, 0.25);
}

.landing-btn--login:hover {
  background: var(--color-blue-600);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(46, 48, 148, 0.35);
}

.landing-btn--register {
  background: white;
  color: var(--color-blue-600);
  border: 1.5px solid var(--color-blue-300);
}

.landing-btn--register:hover {
  background: var(--color-blue-50);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(46, 48, 148, 0.1);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 480px) {
  .landing-logo {
    height: 60px;
  }

  .landing-tagline {
    font-size: 15px;
  }

  .landing-actions {
    flex-direction: row;
    justify-content: center;
    width: auto;
  }
}
</style>