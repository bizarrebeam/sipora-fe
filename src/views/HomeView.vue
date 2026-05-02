<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SFlowchart from '@/components/SFlowchart.vue'
import type { FlowItem } from '@/components/SFlowchart.vue'
import SiporaLogo from '@/assets/sipora-logo.svg'
import SekolahSvg from '@/assets/sekolah.svg'
import { useRevealOnScroll } from '@/components/ARevealOnScroll'

const { el: heroRevealEl, isVisible: isHeroVisible } = useRevealOnScroll()
const { el: fiturRevealEl, isVisible: isFiturVisible } = useRevealOnScroll()
const { el: tentangRevealEl, isVisible: isTentangVisible } = useRevealOnScroll()
const { el: keamananRevealEl, isVisible: isKeamananVisible } = useRevealOnScroll()
const { el: faqRevealEl, isVisible: isFaqVisible } = useRevealOnScroll()

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isAuthenticated)

const visibleCards = ref<boolean[]>([])
const visibleFaqs = ref<boolean[]>([])

const features = ref([
  { id: 1, key: 'bullying', text: 'Laporan Bullying', desc: 'Laporkan tindakan perundungan secara aman dan rahasia', icon: new URL('@/assets/laporan-bully.svg', import.meta.url).href },
  { id: 2, key: 'kerusakan', text: 'Laporan Kerusakan', desc: 'Laporkan kerusakan fasilitas sekolah untuk ditindaklanjuti', icon: new URL('@/assets/laporan-kerusakan.svg', import.meta.url).href },
  { id: 3, key: 'aspirasi', text: 'Aspirasi', desc: 'Sampaikan saran dan masukan untuk kemajuan sekolah', icon: new URL('@/assets/aspirasi.svg', import.meta.url).href },
  { id: 4, key: 'konsultasi', text: 'Konsultasi BK', desc: 'Jadwalkan sesi konsultasi dengan Guru BK', icon: new URL('@/assets/konsultasi.svg', import.meta.url).href },
  { id: 5, key: 'evaluasi', text: 'Evaluasi Guru', desc: 'Berikan penilaian terhadap kinerja pengajaran guru', icon: new URL('@/assets/evaluasi.svg', import.meta.url).href },
])

const activeFeature = ref('bullying')
const flowchartKey = ref(0)

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 100; 
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

watch(activeFeature, () => { flowchartKey.value++ })

const flowcharts: Record<string, FlowItem[]> = {
  bullying: [
    { kind: 'step', step: { id: 'start', label: 'Masuk ke akun', type: 'success' } },
    { kind: 'step', step: { id: 'b1', label: 'Buat laporan bullying', type: 'default' } },
    { kind: 'branches', merge: true, branches: [
      { arrowLabel: 'Anonim', steps: [{ id: 'b2a', label: 'Identitas disembunyikan', type: 'default' }] },
      { arrowLabel: 'Non-Anonim', steps: [{ id: 'b2b', label: 'Identitas terlihat', type: 'default' }] },
    ]},
    { kind: 'step', step: { id: 'b3', label: 'Isi deskripsi & unggah bukti', type: 'default' } },
    { kind: 'step', step: { id: 'b4', label: 'Kirim laporan', type: 'default' } },
    { kind: 'step', step: { id: 'b5', label: 'Status: Menunggu konfirmasi', type: 'default' } },
    { kind: 'branches', merge: false, branches: [
      { arrowLabel: 'Diverifikasi', steps: [
        { id: 'b6a', label: 'Status: Diproses', type: 'default' },
        { id: 'b6b', label: 'Status: Selesai', type: 'success' },
      ]},
      { arrowLabel: 'Dibatalkan siswa', steps: [
        { id: 'b7a', label: 'Tulis alasan pembatalan', type: 'default' },
        { id: 'b7b', label: 'Laporan dibatalkan', type: 'cancel' },
      ]},
      { arrowLabel: 'Ditolak SIPORA', steps: [
        { id: 'b8a', label: 'Terima alasan penolakan', type: 'default' },
        { id: 'b8b', label: 'Laporan ditolak', type: 'cancel' },
      ]},
    ]},
  ],
  kerusakan: [
    { kind: 'step', step: { id: 'start', label: 'Masuk ke akun', type: 'success' } },
    { kind: 'step', step: { id: 'k1', label: 'Buat laporan kerusakan', type: 'default' } },
    { kind: 'step', step: { id: 'k2', label: 'Isi deskripsi & lokasi', type: 'default' } },
    { kind: 'step', step: { id: 'k3', label: 'Unggah foto kerusakan', type: 'default' } },
    { kind: 'step', step: { id: 'k4', label: 'Kirim laporan', type: 'default' } },
    { kind: 'step', step: { id: 'k5', label: 'Status: Menunggu konfirmasi', type: 'default' } },
    { kind: 'branches', merge: false, branches: [
      { arrowLabel: 'Diverifikasi', steps: [
        { id: 'k6a', label: 'Status: Diproses', type: 'default' },
        { id: 'k6b', label: 'Status: Selesai', type: 'success' },
      ]},
      { arrowLabel: 'Dibatalkan siswa', steps: [
        { id: 'k7a', label: 'Tulis alasan pembatalan', type: 'default' },
        { id: 'k7b', label: 'Laporan dibatalkan', type: 'cancel' },
      ]},
      { arrowLabel: 'Ditolak SIPORA', steps: [
        { id: 'k8a', label: 'Terima alasan penolakan', type: 'default' },
        { id: 'k8b', label: 'Laporan ditolak', type: 'cancel' },
      ]},
    ]},
  ],
  aspirasi: [
    { kind: 'step', step: { id: 'start', label: 'Masuk ke akun', type: 'success' } },
    { kind: 'step', step: { id: 'a1', label: 'Tulis aspirasi', type: 'default' } },
    { kind: 'branches', merge: true, branches: [
      { arrowLabel: 'Anonim', steps: [{ id: 'a2a', label: 'Identitas disembunyikan', type: 'default' }] },
      { arrowLabel: 'Non-Anonim', steps: [{ id: 'a2b', label: 'Identitas terlihat', type: 'default' }] },
    ]},
    { kind: 'step', step: { id: 'a3', label: 'Kirim aspirasi', type: 'default' } },
    { kind: 'step', step: { id: 'a4', label: 'Status: Diterima', type: 'default' } },
    { kind: 'branches', merge: false, branches: [
      { arrowLabel: 'Ditindaklanjuti', steps: [
        { id: 'a5a', label: 'Aspirasi ditindaklanjuti', type: 'success' },
      ]},
      { arrowLabel: 'Dibatalkan siswa', steps: [
        { id: 'a5b', label: 'Tulis alasan pembatalan', type: 'default' },
        { id: 'a5c', label: 'Aspirasi dibatalkan', type: 'cancel' },
      ]},
    ]},
  ],
  konsultasi: [
    { kind: 'step', step: { id: 'start', label: 'Masuk ke akun', type: 'success' } },
    { kind: 'step', step: { id: 'c1', label: 'Pilih jadwal konsultasi', type: 'default' } },
    { kind: 'step', step: { id: 'c2', label: 'Isi alasan konsultasi', type: 'default' } },
    { kind: 'step', step: { id: 'c3', label: 'Kirim permintaan', type: 'default' } },
    { kind: 'step', step: { id: 'c4', label: 'Status: Menunggu', type: 'default' } },
    { kind: 'branches', merge: false, branches: [
      { arrowLabel: 'Dikonfirmasi', steps: [
        { id: 'c5a', label: 'Sesi berlangsung', type: 'default' },
        { id: 'c5b', label: 'Konsultasi selesai', type: 'success' },
      ]},
      { arrowLabel: 'Dibatalkan siswa', steps: [
        { id: 'c6a', label: 'Tulis alasan pembatalan', type: 'default' },
        { id: 'c6b', label: 'Booking dibatalkan', type: 'cancel' },
      ]},
      { arrowLabel: 'Ditolak Guru BK', steps: [
        { id: 'c7a', label: 'Terima alasan penolakan', type: 'default' },
        { id: 'c7b', label: 'Booking ditolak', type: 'cancel' },
      ]},
    ]},
  ],
  evaluasi: [
    { kind: 'step', step: { id: 'start', label: 'Masuk ke akun', type: 'success' } },
    { kind: 'step', step: { id: 'e1', label: 'Periode evaluasi semester genap/ganjil dibuka', type: 'default' } },
    { kind: 'step', step: { id: 'e2', label: 'Pilih guru', type: 'default' } },
    { kind: 'step', step: { id: 'e3', label: 'Isi rating & komentar', type: 'default' } },
    { kind: 'step', step: { id: 'e4', label: 'Kirim evaluasi anonim', type: 'default' } },
    { kind: 'step', step: { id: 'e5', label: 'Evaluasi tercatat', type: 'success' } },
  ],
}


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

onMounted(() => {
  visibleCards.value = new Array(features.value.length).fill(false)
  visibleFaqs.value = new Array(faqs.value.length).fill(false)

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
  <!-- ========== HOMEPAGE ========== -->
  <div class="min-h-screen bg-general-frame p-8 overflow-x-hidden">
    <div class="max-w-5xl mx-auto flex flex-col gap-16 md:gap-24">

      <!-- HERO SECTION -->
      <section
        ref="heroRevealEl"
        :class="[
          'w-full p-8 border border-general-border rounded-lg bg-blue-50 relative overflow-hidden flex flex-col items-center gap-6 transition-all duration-700 ease-out',
          isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <img
          :src="SekolahSvg"
          alt=""
          aria-hidden="true"
          class="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style="opacity: 0.45; transform: scale(1.6);"
        />

        <div class="hero-orb hero-orb-1" aria-hidden="true"></div>
        <div class="hero-orb hero-orb-2" aria-hidden="true"></div>

        <div class="w-full max-w-[1200px] rounded-lg flex flex-col items-center justify-center pt-8 px-2 pb-2 z-10 gap-2 md:gap-4">
          <img
            src="@/assets/sipora-logo.svg"
            alt="Sipora Logo"
            class="hero-logo h-36 md:h-48 w-auto object-contain drop-shadow-md mb-2"
          />
          <div class="flex flex-col items-center w-full gap-1">
            <h1 class="text-[20px] sm:text-[24px] md:text-[28px] text-[#2E3094] font-extrabold text-center w-full whitespace-normal md:whitespace-nowrap overflow-visible">
              Sistem Pelaporan dan Aspirasi SMP Budi Mulia Desa Putera
            </h1>
            <p class="text-body-b4 text-gray-700 text-center w-full whitespace-normal md:whitespace-nowrap overflow-visible mt-1 px-4 md:px-0">
              Kirim laporan dan aspirasi secara aman. Diproses oleh pihak sekolah dengan alur yang dapat dipantau.
            </p>
          </div>
        </div>

        <!-- Hero Nav Buttons -->
        <div class="hero-actions mt-4 mb-4 flex flex-wrap justify-center gap-3 relative z-10">
          <SButton variant="primary" class="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base" @click="scrollToSection('tentang-sipora')">Tentang Sipora</SButton>
          <SButton variant="primary" class="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base" @click="scrollToSection('fitur-sipora')">Fitur SIPORA</SButton>
          <SButton variant="primary" class="px-6 py-2 md:px-8 md:py-3 text-sm md:text-base" @click="scrollToSection('faq')">FAQ</SButton>
        </div>
      </section>

      <!-- TENTANG SIPORA SECTION -->
      <section
        id="tentang-sipora"
        ref="tentangRevealEl"
        :class="[
          'max-w-[1389px] border border-general-border w-full flex-col md:flex-row flex gap-8 items-center bg-blue-50 py-4 px-6 md:py-6 md:px-8 rounded-2xl transition-all duration-700 ease-out',
          isTentangVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <div class="bg-white rounded-xl shadow-sm border border-general-border flex justify-center items-center shrink-0 aspect-square h-[200px] md:h-[260px] relative overflow-hidden">
          <div class="relative flex items-center justify-center w-full h-full">
            <div class="absolute w-[100px] h-[100px] md:w-[130px] md:h-[130px] rounded-full border-4 border-[#2E3094] animate-circle-ping"></div>
            <img src="@/assets/priwitan-whistle.svg" alt="Sipora Logo" class="h-[120px] md:h-[160px] w-auto object-contain animate-whistle-pop relative z-10" />
          </div>
        </div>
        <div class="flex-1 flex flex-col gap-2 justify-center">
          <h2 class="stf-page-title text-[#2E3094] mb-1 mt-0">Tentang SIPORA</h2>
          <p class="text-body-b4 text-blue-800 leading-relaxed max-w-[933px] mb-0 text-justify">
            Sipora merupakan sistem informasi pelaporan dan evaluasi sekolah yang dirancang untuk mendukung terciptanya lingkungan pendidikan yang aman, transparan, dan responsif. Aplikasi ini memfasilitasi pelaporan bullying, pengelolaan konseling, publikasi artikel kesehatan mental, serta evaluasi guru dan staff <strong>secara terintegrasi dalam satu platform.</strong>
          </p>
        </div>
      </section>

      <!-- KEAMANAN DATA SECTION -->
      <section
        ref="keamananRevealEl"
        :class="[
          'max-w-[1389px] border border-general-border w-full bg-[#ECECFA] rounded-2xl relative transition-all duration-700 ease-out',
          isKeamananVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <!-- Blob Background Wrapper -->
        <div class="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
          <svg class="absolute bottom-[-15%] right-[-15%] md:right-[-5%] w-[350px] md:w-[600px] text-[#DCE4FA] opacity-80" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M42.7,-74.5C54.5,-68.8,62.8,-55.8,70.9,-42.6C79,-29.4,87,-14.7,87.9,0.5C88.8,15.7,82.5,31.4,72.6,44.1C62.8,56.8,49.4,66.4,34.8,73.5C20.2,80.5,4.3,85.1,-11.2,84.1C-26.6,83.1,-41.7,76.5,-54.6,66.8C-67.5,57.2,-78.2,44.4,-84.4,29.3C-90.6,14.2,-92.3,-3.1,-87.3,-18.7C-82.3,-34.2,-70.6,-48,-56.9,-54.9C-43.2,-61.8,-27.6,-61.8,-13.6,-66.1C0.3,-70.4,14.3,-79,28.8,-80C33.5,-80.3,38.2,-77.3,42.7,-74.5Z" transform="translate(100 100)" />
          </svg>
        </div>

        <!-- MOBILE LAYOUT -->
        <div class="md:hidden pt-6 pb-8 px-5 relative z-10 w-full rounded-2xl" style="clip-path: inset(-200px -200px 0 -200px);">
          <h2 class="stf-page-title text-[#2E3094] mb-3 mt-0 text-left">Apakah dengan SIPORA, laporan saya aman?</h2>
          
          <div class="text-body-b4 text-blue-800 leading-relaxed text-left flex flex-col gap-3 relative z-10">
            <p>
              Tentu saja! Pembuatan akun di SIPORA bertujuan untuk memverifikasi identitas bahwa kamu adalah siswa resmi SMP Desa Putera, tetapi <strong>seluruh identitas dan laporanmu dijamin kerahasiaannya dan tidak bisa dilihat oleh siswa lain</strong>.
            </p>
            
            <div class="flex flex-col">
              <p class="mb-0">
                SIPORA memastikan bahwa data aduan, aspirasi, maupun evaluasi guru <strong>hanya diakses eksklusif oleh Guru BK dan Tim Kemahasiswaan</strong> yang bertugas menangani laporan tersebut.
              </p>
              <div class="relative w-full mt-2">
                <p class="pr-[150px] mb-0 pt-2">
                  Sekolah menjamin akan mendengar keluhan setiap siswa dengan adil, rahasia, dan tanpa diskriminasi.
                </p>
                <img 
                  src="@/assets/Siswa.svg" 
                  alt="Ilustrasi Siswa" 
                  class="absolute top-[-30px] right-[-120px] w-[280px] h-[320px] object-cover object-top pointer-events-none z-10 animate-mascot-float" 
                />
              </div>
            </div>
          </div>
        </div>

        <!-- DESKTOP LAYOUT  -->
        <div class="hidden md:flex flex-row items-stretch w-full relative z-10">
          <div class="flex-1 flex flex-col gap-2 justify-center py-12 pl-10 pr-4 z-10 relative">
            <h2 class="stf-page-title text-[#2E3094] mb-2 mt-0">Apakah dengan SIPORA, laporan saya aman?</h2>
            <div class="text-body-b4 text-blue-800 leading-relaxed max-w-[750px] mb-0 text-left flex flex-col gap-3 pr-4">
              <p>
                Tentu saja! Pembuatan akun di SIPORA bertujuan untuk memverifikasi identitas bahwa kamu adalah siswa resmi SMP Desa Putera, tetapi <strong>seluruh identitas dan laporanmu dijamin kerahasiaannya dan tidak bisa dilihat oleh siswa lain</strong>.
              </p>
              <p>
                SIPORA memastikan bahwa data aduan, aspirasi, maupun evaluasi guru <strong>hanya diakses eksklusif oleh Guru BK dan Tim Kemahasiswaan</strong> yang bertugas menangani laporan tersebut. Sekolah menjamin akan mendengar keluhan setiap siswa dengan adil, rahasia, dan tanpa diskriminasi.
              </p>
            </div>
          </div>

          <div class="relative shrink-0 flex items-end justify-end md:w-[260px] lg:w-[320px] pointer-events-none z-10 h-auto rounded-br-2xl" style="clip-path: inset(-100px 0 0 -100px round 0 0 1rem 0);">
            <img src="@/assets/Siswa.svg" alt="Ilustrasi Siswa" class="absolute bottom-[-40px] right-[-60px] z-10 w-[340px] lg:w-[400px] md:h-[calc(100%+90px)] max-w-none object-cover object-top animate-mascot-float" />
          </div>
        </div>
      </section>

      <!-- FITUR SIPORA SECTION -->
      <section
        id="fitur-sipora"
        ref="fiturRevealEl"
        :class="[
          'flex flex-col gap-6 w-full transition-all duration-700 ease-out',
          isFiturVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <div class="text-left mb-2 relative z-10">
          <h2 class="stf-page-title text-[#2E3094] mb-2">Fitur SIPORA</h2>
          <p class="stf-page-subtitle text-gray-500 max-w-2xl">Klik fitur untuk melihat alur proses dari awal hingga akhir.</p>
        </div>
        
        <div class="fitur-explorer">
          <!-- Left: Feature Selector -->
          <div class="fitur-selector">
            <button
              v-for="feature in features"
              :key="feature.id"
              :class="['fitur-selector-btn', activeFeature === feature.key && 'fitur-selector-btn--active']"
              @click="activeFeature = feature.key"
            >
              <img :src="feature.icon" :alt="feature.text" class="fitur-selector-icon" />
              <div class="fitur-selector-text">
                <span class="fitur-selector-title">{{ feature.text }}</span>
                <span class="fitur-selector-desc">{{ feature.desc }}</span>
              </div>
            </button>
          </div>

          <!-- Right: Flowchart Panel -->
          <div class="fitur-flowchart-panel">
            <Transition name="fc-fade" mode="out-in">
              <div :key="flowchartKey" class="fitur-flowchart-inner">
                <SFlowchart :flow="flowcharts[activeFeature]" />
              </div>
            </Transition>
          </div>
        </div>
      </section>

      <!-- FAQ SECTION -->
      <section
        id="faq"
        ref="faqRevealEl"
        :class="[
          'flex flex-col gap-6 w-full mb-16 max-w-[1389px] transition-all duration-700 ease-out',
          isFaqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        ]"
      >
        <div class="text-left mb-2">
          <h2 class="stf-page-title text-[#2E3094] mb-2">FAQ (Frequently Asked Questions)</h2>
          <p class="stf-page-subtitle text-gray-500">Temukan jawaban untuk pertanyaan yang sering diajukan.</p>
        </div>

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
              class="cursor-pointer hover:bg-neutral-50 transition-colors z-10 w-full"
              style="padding: 20px 24px;"
              @click="toggleFaq(index)"
            >
              <div class="flex justify-between items-center w-full gap-4">
                <h4 class="text-base md:text-heading-h5 text-blue-500 flex-1">{{ faq.question }}</h4>
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

            <div class="faq-accordion-grid" :class="{'faq-accordion-grid--open': faq.open}">
              <div class="faq-accordion-inner">
                <div
                  class="bg-neutral-50 border border-general-border rounded-b-lg p-6 pt-10 pb-8 mt-[-15px] z-0 text-body-b5 text-blue-800 leading-relaxed"
                >
                  {{ faq.answer }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────
   HERO 
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
  animation: logoFloat 4s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}

/* ─────────────────────────────────────────
   FITUR EXPLORER (2-panel layout)
───────────────────────────────────────── */
.fitur-explorer {
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;
}

/* Left: Feature selector list */
.fitur-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 260px;
  max-width: 300px;
  flex-shrink: 0;
}

.fitur-selector-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1.5px solid #d9d9d9;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  flex: 1;
}

.fitur-selector-btn:not(.fitur-selector-btn--active):hover {
  background: #eaeaf4;
  border-color: #bebfde;
}

.fitur-selector-btn--active {
  background: #2e3094;
  border-color: #2e3094;
}

.fitur-selector-btn--active .fitur-selector-title,
.fitur-selector-btn--active .fitur-selector-desc {
  color: white;
}
.fitur-selector-btn--active .fitur-selector-desc {
  opacity: 0.75;
}

.fitur-selector-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  flex-shrink: 0;
}

.fitur-selector-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fitur-selector-title {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  line-height: 1.3;
}

.fitur-selector-desc {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #7a7a7a;
  line-height: 1.4;
}

/* Right: Flowchart panel */
.fitur-flowchart-panel {
  flex: 1;
  min-width: 0;
  background: white;
  border: 1.5px solid #d9d9d9;
  border-radius: 16px;
  padding: 32px 24px;
  display: flex;
  height: 600px;
  overflow-y: auto;
  overflow-x: auto;
}

.fitur-flowchart-inner {
  margin: auto;
  width: 100%;
  padding-bottom: 24px;
}

/* Flowchart fade transition */
.fc-fade-enter-active,
.fc-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fc-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fc-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Mobile */
@media (max-width: 768px) {
  .fitur-explorer {
    flex-direction: column;
  }

  .fitur-selector {
    flex-direction: row;
    overflow-x: auto;
    max-width: 100%;
    min-width: unset;
    gap: 6px;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }

  .fitur-selector-btn {
    flex-shrink: 0;
    flex: 0 0 auto;
    padding: 10px 14px;
    gap: 10px;
    border-radius: 12px;
  }

  .fitur-selector-icon {
    width: 28px;
    height: 28px;
  }

  .fitur-selector-desc {
    display: none;
  }

  .fitur-selector-title {
    font-size: 12px;
    white-space: nowrap;
  }

  .fitur-flowchart-panel {
    padding: 20px 12px;
  }
}

/* ─────────────────────────────────────────
   MASCOT FLOAT ANIMATION
───────────────────────────────────────── */
.animate-mascot-float {
  animation: mascotFloat 4s ease-in-out infinite;
}

@keyframes mascotFloat {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50%       { transform: translateY(-10px) rotate(1deg); }
}

/* ─────────────────────────────────────────
   FAQ ACCORDION TRANSITION
───────────────────────────────────────── */
.faq-accordion-grid {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease, transform 0.35s ease;
  opacity: 0;
  transform: translateY(-6px);
}

.faq-accordion-grid--open {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

.faq-accordion-inner {
  overflow: hidden;
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
   WHISTLE POP, FLOAT & PING ANIMATION
───────────────────────────────────────── */
@keyframes whistlePopFloat {
  /* Pop In */
  0%   { transform: scale(0) translateY(0); opacity: 0; }
  5%   { transform: scale(1.2) translateY(0); opacity: 1; }
  10%  { transform: scale(1) translateY(0); opacity: 1; }
  
  /* Float Phase (Bobbing up and down) */
  25%  { transform: scale(1) translateY(-10px) rotate(2deg); opacity: 1; }
  40%  { transform: scale(1) translateY(0px) rotate(-1deg); opacity: 1; }
  55%  { transform: scale(1) translateY(-10px) rotate(2deg); opacity: 1; }
  70%  { transform: scale(1) translateY(0px) rotate(-1deg); opacity: 1; }
  
  /* Prepare to Pop Out */
  75%  { transform: scale(1) translateY(0px); opacity: 1; }
  
  /* Pop Out */
  80%  { transform: scale(1.2) translateY(0px); opacity: 1; }
  85%  { transform: scale(0) translateY(0px); opacity: 0; }
  
  /* Hidden Delay */
  100% { transform: scale(0) translateY(0px); opacity: 0; }
}

@keyframes circlePing {
  0%   { transform: scale(0.5); opacity: 0; }
  5%   { transform: scale(1); opacity: 1; }
  25%  { transform: scale(2.5); opacity: 0; }
  100% { transform: scale(2.5); opacity: 0; }
}

.animate-whistle-pop {
  animation: whistlePopFloat 8s infinite ease-in-out;
}

.animate-circle-ping {
  animation: circlePing 8s infinite ease-out;
}
</style>