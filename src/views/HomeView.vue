<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SCard from '@/components/SCard.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'
import { useRevealOnScroll } from '@/components/ARevealOnScroll'

const { el: heroRevealEl, isVisible: isHeroVisible } = useRevealOnScroll()
const { el: fiturRevealEl, isVisible: isFiturVisible } = useRevealOnScroll()
const { el: tentangRevealEl, isVisible: isTentangVisible } = useRevealOnScroll()
const { el: faqRevealEl, isVisible: isFaqVisible } = useRevealOnScroll()

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isAuthenticated)

// Staggered card visibility tracking
const visibleCards = ref<boolean[]>([])
const visibleFaqs = ref<boolean[]>([])

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
    question: 'Bagaimana cara mendaftar akun di SIPORA?',
    answer: 'Siswa dapat mendaftar secara mandiri melalui halaman registrasi dengan mengisi nama lengkap, NIS, email, kelas, dan kata sandi. Untuk Guru dan Guru BK, akun akan dibuatkan secara manual oleh pihak Kemahasiswaan menggunakan NUPTK 16 digit.',
    open: false
  },
  {
    id: 2,
    question: 'Saya lupa nomor NIS saya, bagaimana cara mengetahuinya?',
    answer: 'Untuk mengetahui nomor NIS Anda, silakan cek secara mandiri pada fisik Kartu Pelajar atau lembar biodata di Buku Rapor sekolah. Jika Anda tidak memegang kedua dokumen tersebut, Anda dapat menanyakan langsung kepada Wali Kelas atau mendatangi ruang Kemahasiswaan untuk meminta informasi data induk siswa yang valid guna keperluan login atau registrasi di SIPORA.',
    open: false
  },
  {
    id: 3,
    question: 'Apa yang harus saya lakukan jika gagal melakukan login?',
    answer: 'Pastikan NISN (untuk siswa) atau NUPTK (untuk guru) dan kata sandi sudah benar. Jika lupa sandi, gunakan fitur "Lupa Password" di halaman login untuk reset password secara mandiri kemudian login dengan password baru Anda. Apabila masih bermasalah, silakan hubungi tim Kemahasiswaan untuk bantuan lebih lanjut.',
    open: false
  },
  {
    id: 4,
    question: 'Apakah saya tetap bisa membuat laporan dan mengakses fitur lain jika akun belum diverifikasi?',
    answer: 'Tentu saja. Anda tetap dapat mengakses fitur utama seperti membuat laporan atau aspirasi meskipun akun Anda sedang dalam proses verifikasi oleh tim Kemahasiswaan. Status verifikasi hanya digunakan untuk validasi data internal sekolah dan tidak akan membatasi atau membedakan kualitas pelayanan yang Anda terima di dalam sistem SIPORA.',
    open: false
  },
  {
    id: 5,
    question: 'Bagaimana cara membuat laporan bullying atau kerusakan fasilitas?',
    answer: 'Untuk membuat laporan, Anda dapat langsung mengakses menu "Laporkan Bullying" atau "Laporkan Kerusakan" yang tersedia pada dashboard SIPORA. Silakan isi formulir laporan dengan data yang akurat, termasuk deskripsi kejadian dan lampiran bukti foto jika diperlukan. Setelah laporan terkirim, pihak sekolah akan segera menerima laporan Anda untuk menindaklanjuti aduan tersebut, dan Anda dapat memantau perkembangan status penanganannya secara berkala melalui fitur tracking di portal pribadi Anda.',
    open: false
  },
  {
    id: 6,
    question: 'Apakah identitas saya aman saat melapor?',
    answer: 'Tentu saja. SIPORA memprioritaskan keamanan dan privasi pelapor. Aplikasi menyediakan fitur anonimitas sehingga identitas Anda akan disembunyikan dan sistem hanya akan menampilkan nama Anda sebagai "Pengguna Anonim" kepada pihak pengelola. Pihak sekolah juga berkomitmen penuh untuk menjaga kerahasiaan seluruh data laporan Anda guna memastikan keamanan dan kenyamanan selama proses tindak lanjut berlangsung.',
    open: false
  },
  {
    id: 7,
    question: 'Dapatkah saya membatalkan atau mengubah laporan yang sudah dikirim?',
    answer: 'Laporan hanya dapat diubah atau dibatalkan selama statusnya masih "Menunggu Konfirmasi". Jika laporan sudah diproses oleh pihak sekolah, Anda tidak dapat lagi mengubah atau membatalkannya melalui sistem.',
    open: false
  },
  {
    id: 8,
    question: 'Bagaimana cara mengetahui perkembangan laporan saya?',
    answer: 'Anda dapat memantau status laporan seperti Menunggu Konfirmasi, Diproses, Selesai, atau Ditolak secara transparan melalui menu riwayat laporan.',
    open: false
  },
  {
    id: 9,
    question: 'Bagaimana cara menjadwalkan sesi konsultasi dengan Guru BK?',
    answer: 'Untuk menjadwalkan sesi, silakan akses fitur "Konsultasi BK" pada aplikasi SIPORA dan pilih slot waktu yang telah disediakan oleh Guru BK. Setelah menentukan waktu yang sesuai, lakukan reservasi dengan mengisi formulir alasan konsultasi. Guru BK akan menerima permintaan Anda dan perkembangan permintaan tersebut dapat dipantau secara langsung di aplikasi.',
    open: false
  },
  {
    id: 10,
    question: 'Dapatkah saya mengatur ulang (reschedule) jadwal konsultasi?',
    answer: 'Reschedule hanya dapat dilakukan apabila permintaan konsultasi masih berstatus "Menunggu Konfirmasi" dan belum disetujui oleh Guru BK.',
    open: false
  },
  {
    id: 11,
    question: 'Apa itu fitur Aspirasi?',
    answer: 'Fitur ini adalah wadah bagi siswa dan guru untuk menyampaikan saran atau pendapat guna meningkatkan kualitas layanan sekolah secara terdokumentasi dan terpusat.',
    open: false
  },
  {
    id: 12,
    question: 'Apakah aspirasi bisa disampaikan secara anonim?',
    answer: 'Ya, sistem menyediakan opsi anonim sehingga identitas Anda tetap terjaga saat memberikan aspirasi.',
    open: false
  },
  {
    id: 13,
    question: 'Apakah pengisian Evaluasi Guru bersifat anonim?',
    answer: 'Ya, fitur Evaluasi Guru sepenuhnya bersifat anonim. Sistem tidak akan menampilkan identitas Anda saat memberikan umpan balik, rating, maupun komentar terhadap kinerja pengajaran dan pelayanan staf sekolah.',
    open: false
  },
  {
    id: 14,
    question: 'Kapan periode pengisian Evaluasi Guru dibuka?',
    answer: 'Fitur Evaluasi Guru dibuka secara berkala pada setiap akhir semester. Siswa akan mendapatkan notifikasi melalui portal SIPORA ketika periode pengisian telah dimulai untuk memberikan evaluasi terhadap kinerja tenaga pendidik dan staf selama satu semester berjalan.',
    open: false
  }
])

const toggleFaq = (index: number) => {
  const faq = faqs.value[index]
  if (faq) {
    faq.open = !faq.open
  }
}

// Trigger staggered card animations when fitur section is visible
onMounted(() => {
  visibleCards.value = new Array(features.value.length).fill(false)
  visibleFaqs.value = new Array(faqs.value.length).fill(false)

  // Watch fiturReveal and stagger card entrance
  const cardsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          features.value.forEach((_, i) => {
            setTimeout(() => {
              visibleCards.value[i] = true
            }, i * 100)
          })
          cardsObserver.disconnect()
        }
      })
    },
    { threshold: 0.1 }
  )

  const faqsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          faqs.value.forEach((_, i) => {
            setTimeout(() => {
              visibleFaqs.value[i] = true
            }, i * 60)
          })
          faqsObserver.disconnect()
        }
      })
    },
    { threshold: 0.05 }
  )

  // Observe the fitur and faq sections via their refs
  setTimeout(() => {
    if (fiturRevealEl.value) cardsObserver.observe(fiturRevealEl.value)
    if (faqRevealEl.value) faqsObserver.observe(faqRevealEl.value)
  }, 100)
})
</script>

<template>
  <!-- ========== LANDING (not logged in) ========== -->
  <div v-if="!isLoggedIn" class="landing">
    <!-- Floating blobs background -->
    <div class="landing-blobs" aria-hidden="true">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

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
        ref="heroRevealEl"
        :class="[
          'w-full p-8 md:p-12 border border-general-border rounded-lg bg-blue-50 relative overflow-hidden flex flex-col items-center gap-10 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-out',
          isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
        style="background-image: url('/src/assets/sekolah.svg');"
      >
        <!-- Floating decorative orbs inside hero -->
        <div class="hero-orb hero-orb-1" aria-hidden="true"></div>
        <div class="hero-orb hero-orb-2" aria-hidden="true"></div>

        <div class="w-full max-w-[800px] h-[250px] rounded-lg flex flex-col items-center justify-center p-8 z-10 gap-4">
          <img
            src="@/assets/sipora-logo.svg"
            alt="Sipora Logo"
            class="hero-logo h-48 w-auto object-contain drop-shadow-md"
          />
          <h1 class="text-heading-h2 text-blue-600 font-extrabold text-center max-w-4xl leading-snug drop-shadow-md">
            Sistem Pelaporan dan Aspirasi SMP Budi Mulia Desa Putera
          </h1>
        </div>
      </section>

      <!-- FITUR SIPORA SECTION -->
      <section
        ref="fiturRevealEl"
        :class="[
          'flex flex-col gap-8 w-full transition-all duration-700 ease-out',
          isFiturVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <h2 class="text-heading-h3 text-blue-600 font-extrabold">Fitur SIPORA</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <SCard
            v-for="(feature, index) in features"
            :key="feature.id"
            :class="[
              'feature-card flex flex-col items-center justify-center text-center p-6 h-[250px] shadow-sm hover:shadow-md transition-all relative overflow-hidden bg-white',
              visibleCards[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            ]"
            :style="{ transitionDelay: visibleCards[index] ? '0ms' : `${index * 100}ms`, transitionDuration: '500ms' }"
          >
            <div class="feature-icon-wrap h-24 mb-4 flex items-center justify-center">
              <img :src="feature.icon" :alt="feature.text" class="h-full w-auto object-contain" />
            </div>
            <p class="text-body-b5 font-semibold text-general-black">{{ feature.text }}</p>
          </SCard>
        </div>
      </section>

      <!-- TENTANG SIPORA SECTION -->
      <section
        ref="tentangRevealEl"
        :class="[
          'max-w-[1389px] border border-general-border w-full flex-col md:flex-row flex gap-10 items-stretch bg-blue-50 p-8 md:p-12 rounded-2xl transition-all duration-700 ease-out',
          isTentangVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <div class="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-general-border flex justify-center items-center h-[300px]">
          <img src="@/assets/priwitan-whistle.svg" alt="Sipora Logo" class="tentang-mascot h-56 w-auto object-contain" />
        </div>
        <div class="w-full md:w-2/3 flex flex-col gap-6 justify-center">
          <h2 class="text-heading-h2 text-blue-500 font-extrabold max-w-[933px]">Tentang Sipora</h2>
          <p class="text-body-b4 text-blue-800 leading-relaxed max-w-[933px]">
            Sipora merupakan sistem informasi pelaporan dan evaluasi sekolah yang dirancang untuk mendukung terciptanya lingkungan pendidikan yang aman, transparan, dan responsif. Aplikasi ini memfasilitasi pelaporan bullying, pengelolaan konseling, publikasi artikel kesehatan mental, serta evaluasi guru dan staff secara terintegrasi dalam satu platform.
          </p>
        </div>
      </section>

      <!-- FAQ SECTION -->
      <section
        ref="faqRevealEl"
        :class="[
          'flex flex-col gap-8 w-full mb-16 max-w-[1389px] transition-all duration-700 ease-out',
          isFaqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <h2 class="text-heading-h3 text-blue-600 font-extrabold">FAQ (Frequently Asked Questions)</h2>

        <div class="flex flex-col gap-6">
          <div
            v-for="(faq, index) in faqs"
            :key="faq.id"
            :class="[
              'flex flex-col w-full relative transition-all duration-500 ease-out',
              visibleFaqs[index] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            ]"
            :style="{ transitionDelay: `${index * 60}ms` }"
          >
            <SCard
              padding="32px 49px"
              class="cursor-pointer hover:bg-neutral-50 transition-colors z-10 w-full"
              @click="toggleFaq(index)"
            >
              <div class="flex justify-between items-center w-full gap-4">
                <h4 class="text-heading-h5 text-blue-500 flex-1">{{ faq.question }}</h4>
                <div
                  class="text-blue-500 transform transition-transform duration-300 w-[24px] h-[24px] flex items-center justify-center font-bold"
                  :class="{ 'rotate-180': faq.open }"
                >
                  <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7L10 13L4 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </SCard>

            <Transition name="faq-expand">
              <div
                v-show="faq.open"
                class="bg-neutral-50 border border-general-border rounded-b-lg p-6 pt-10 pb-8 mt-[-15px] z-0 text-body-b5 text-blue-800 leading-relaxed"
              >
                {{ faq.answer }}
              </div>
            </Transition>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────── */
.landing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  background: linear-gradient(160deg, var(--color-blue-50) 0%, var(--color-general-frame) 40%, white 100%);
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
}

/* Floating background blobs */
.landing-blobs {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  animation: blobFloat linear infinite;
}

.blob-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, #93c5fd, #3b82f6);
  top: -80px;
  left: -80px;
  animation-duration: 14s;
  animation-delay: 0s;
}

.blob-2 {
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, #bfdbfe, #60a5fa);
  bottom: -60px;
  right: -40px;
  animation-duration: 18s;
  animation-delay: -6s;
}

.blob-3 {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, #dbeafe, #93c5fd);
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  animation-duration: 22s;
  animation-delay: -10s;
}

@keyframes blobFloat {
  0%, 100% { transform: translateY(0px) scale(1); }
  33%       { transform: translateY(-20px) scale(1.04); }
  66%       { transform: translateY(12px) scale(0.97); }
}

/* Landing content */
.landing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 360px;
  position: relative;
  z-index: 1;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.landing-logo {
  height: 48px;
  width: auto;
  margin-bottom: 20px;
  /* Gentle continuous float on the logo */
  animation: logoFloat 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}

.landing-tagline {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-neutral-500);
  margin-bottom: 28px;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
}

.landing-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
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

/* ─────────────────────────────────────────
   HERO (logged-in)
───────────────────────────────────────── */
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.25;
  pointer-events: none;
}

.hero-orb-1 {
  width: 250px;
  height: 250px;
  background: #3b82f6;
  top: -60px;
  right: -40px;
  animation: orbFloat1 8s ease-in-out infinite;
}

.hero-orb-2 {
  width: 180px;
  height: 180px;
  background: #60a5fa;
  bottom: -40px;
  left: 10%;
  animation: orbFloat2 10s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(-16px, 20px) scale(1.06); }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(12px, -18px) scale(1.04); }
}

/* Floating animation for the SIPORA logo in hero */
.hero-logo {
  animation: logoFloat 5s ease-in-out infinite;
}

/* ─────────────────────────────────────────
   FEATURE CARDS
───────────────────────────────────────── */
.feature-card {
  transition-property: opacity, transform, box-shadow;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Icon levitates on card hover */
.feature-card:hover .feature-icon-wrap {
  animation: iconHoverFloat 1.8s ease-in-out infinite;
}

@keyframes iconHoverFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}

/* ─────────────────────────────────────────
   TENTANG MASCOT
───────────────────────────────────────── */
/* Mascot gently bobs */
.tentang-mascot {
  animation: mascotFloat 4s ease-in-out infinite;
}

@keyframes mascotFloat {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50%       { transform: translateY(-10px) rotate(1deg); }
}

/* ─────────────────────────────────────────
   FAQ ACCORDION TRANSITION
───────────────────────────────────────── */
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s ease,
              transform 0.3s ease;
  overflow: hidden;
  max-height: 600px;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-6px);
}

/* ─────────────────────────────────────────
   SHARED KEYFRAMES
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────── */
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