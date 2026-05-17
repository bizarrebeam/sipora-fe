import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfilView from '../views/ProfilView.vue'
import ManajemenAkunView from '../views/ManajemenAkunView.vue'
import LogAktivitasView from '../views/LogAktivitasView.vue'
import LoginGuruView from '../views/LoginGuruView.vue'
import LoginBKView from '../views/LoginBKView.vue'
import LoginAdminView from '../views/LoginAdminView.vue'
import LaporanKerusakanView from '@/views/LaporanKerusakanView.vue'
import DetailLaporanKerusakanView from '@/views/DetailLaporanKerusakan.vue'
import CreateLaporanKerusakanView from '@/views/CreateLaporanKerusakanView.vue'
import LaporanBullyingView from '@/views/LaporanBullyingView.vue'
import DetailLaporanBullyingView from '@/views/DetailLaporanBullying.vue'
import CreateLaporanBullyingView from '@/views/CreateLaporanBullyingView.vue'
import EditLaporanBullyingView from '@/views/EditLaporanBullying.vue'
import EditLaporanKerusakanView from '@/views/EditLaporanKerusakanView.vue'
import AspirasiView from '@/views/AspirasiView.vue'
import EditAspirasiView from '@/views/EditAspirasiView.vue'
import CreateAspirasiView from '@/views/CreateAspirasiView.vue'
import DetailArtikelView from '@/views/DetailArtikelView.vue' 
import KelolaArtikelView from '@/views/KelolaArtikelView.vue' 
import CreateArtikelView from '@/views/CreateArtikelView.vue' 
import JadwalKonsultasiView from '@/views/JadwalKonsultasiView.vue'
import BookingKonsultasiView from '@/views/BookingKonsultasiView.vue'
import DaftarBookingView from '@/views/DaftarBookingView.vue'
import KirimEvaluasiView from '@/views/KirimEvaluasiView.vue'
import DetailAspirasiView from '@/views/DetailAspirasiView.vue'
import DashboardBullyingView from '@/views/DashboardBullyingView.vue'
import DashboardKerusakanAspirasi from '@/views/DashboardKerusakanAspirasi.vue'
import DaftarEvaluasiView from '@/views/DaftarEvaluasiView.vue'
import DetailKomentarEvaluasiView from '@/views/DetailKomentarEvaluasiView.vue'
import LaporanPeriodikView from '@/views/LaporanPeriodikView.vue'
import DashboardKonsultasiView from '@/views/DashboardKonsultasiView.vue'

import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ForgotPasswordGuruView from '../views/ForgotPasswordGuruView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import { useNotFoundStore } from '@/stores/notFound'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { keepAlive: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgotPassword',
      component: ForgotPasswordView,
      meta: { guest: true },
    },
    {
      path: '/forgot-password-guru',
      name: 'forgotPasswordGuru',
      component: ForgotPasswordGuruView,
      meta: { guest: true },
    },
    {
      path: '/reset-password/:uid/:token',
      name: 'resetPassword',
      component: ResetPasswordView,
      meta: { guest: true },
    },
    {
      path: '/internal/login-bk',
      name: 'loginBK',
      component: LoginBKView,
      meta: { guest: true },
    },
    {
      path: '/internal/login-guru',
      name: 'loginGuru',
      component: LoginGuruView,
      meta: { guest: true },
    },
    {
      path: '/internal/login-admin',
      name: 'loginAdmin',
      component: LoginAdminView,
      meta: { guest: true },
    },
    {
      path: '/profil',
      name: 'profil',
      component: ProfilView,
      meta: { requiresAuth: true, keepAlive: true },
    },
    {
      path: '/manajemen-akun',
      name: 'manajemenAkun',
      component: ManajemenAkunView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru_bk'], keepAlive: true },
    },
    {
      path: '/log-aktivitas',
      name: 'logAktivitas',
      component: LogAktivitasView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan'], keepAlive: true },
    },
    {
      path: '/laporan-kerusakan',
      name: 'laporanKerusakan',
      component: LaporanKerusakanView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru', 'siswa'], keepAlive: true },
    },
    {
      path: '/laporan-kerusakan/:id',
      name: 'detailLaporanKerusakan',
      component: DetailLaporanKerusakanView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru', 'siswa'] },
    },
    {
      path: '/create-kerusakan',
      name: 'createLaporanKerusakan',
      component: CreateLaporanKerusakanView,
      meta: { requiresAuth: true, allowedRoles: ['guru', 'siswa'] },
    },
    {
      path: '/laporan-bullying',
      name: 'laporanBullying',
      component: LaporanBullyingView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru', 'guru_bk', 'kemahasiswaan'], keepAlive: true },
    },
    {
      path: '/laporan-bullying/:id',
      name: 'detailLaporanBullying',
      component: DetailLaporanBullyingView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru', 'guru_bk', 'kemahasiswaan'] },
    },
    {
      path: '/create-bullying',
      name: 'createLaporanBullying',
      component: CreateLaporanBullyingView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru'] },
    },
    {
      path: '/laporan-bullying/:id/edit',
      name: 'editLaporanBullying',
      component: EditLaporanBullyingView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru'] },
    },
    {
      path: '/laporan-kerusakan/:id/edit',
      name: 'editLaporanKerusakan',
      component: EditLaporanKerusakanView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru', 'siswa'] },
    },
    {
      path: '/aspirasi',
      name: 'aspirasi',
      component: AspirasiView,
      meta: { requiresAuth: true, keepAlive: true },
    },
    {
      path: '/jadwal-konsultasi',
      name: 'jadwalKonsultasi',
      component: JadwalKonsultasiView,
      meta: { requiresAuth: true, allowedRoles: ['guru_bk'], keepAlive: true },
    },
    {
      path: '/booking-konsultasi',
      name: 'bookingKonsultasi',
      component: BookingKonsultasiView,
      meta: { requiresAuth: true, allowedRoles: ['siswa'], keepAlive: true },
    },
    {
      path: '/daftar-booking-konsultasi',
      name: 'daftarBookingKonsultasi',
      component: DaftarBookingView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru_bk'], keepAlive: true },
    },
    {
      path: '/create-aspirasi',
      name: 'createAspirasi',
      component: CreateAspirasiView,
      meta: { requiresAuth: true },
    },
    {
      path: '/detail-aspirasi/:id',
      name: 'detailAspirasi',
      component: DetailAspirasiView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru', 'kemahasiswaan'] },
    },
    {
      path: '/aspirasi/:id/edit',
      name: 'editAspirasi',
      component: EditAspirasiView,
      meta: { requiresAuth: true, allowedRoles: ['siswa', 'guru'] },
    },
    {
      path: '/artikel/:id',
      name: 'detailArtikel',
      component: DetailArtikelView,
      // No auth required - anyone can read articles
    },
    {
      path: '/artikel',
      name: 'kelolaArtikel',
      component: KelolaArtikelView,
      meta: { keepAlive: true },
      // No auth required - guests can read articles, admins can manage
    },
    {
      path: '/create-artikel',
      name: 'createArtikel',
      component: CreateArtikelView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan'] },
    },
    {
      path: '/edit-artikel/:id',
      name: 'editArtikel',
      component: CreateArtikelView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan'] },
    },
    {
      path: '/kirim-evaluasi',
      name: 'kirimEvaluasi',
      component: KirimEvaluasiView,
      meta: { requiresAuth: true, allowedRoles: ['siswa'] },
    },
    {
      path: '/dashboard-bullying',
      name: 'dashboardBullying',
      component: DashboardBullyingView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan'], keepAlive: true },
    },
    {
      path: '/daftar-evaluasi',
      name: 'daftarEvaluasi',
      component: DaftarEvaluasiView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru'], keepAlive: true },
    },
    {
      path: '/daftar-evaluasi/komentar',
      name: 'detailKomentarEvaluasi',
      component: DetailKomentarEvaluasiView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru'] },
    },
    {
      path: '/dashboard-kerusakan-aspirasi',
      name: 'dashboardKerusakanAspirasi',
      component: DashboardKerusakanAspirasi,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan'], keepAlive: true },
    },
    {
      path: '/laporan-periodik',
      name: 'laporanPeriodik',
      component: LaporanPeriodikView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan'], keepAlive: true },
    },
    {
      path: '/dashboard-konsultasi',
      name: 'dashboardKonsultasi',
      component: DashboardKonsultasiView,
      meta: { requiresAuth: true, allowedRoles: ['guru_bk', 'kemahasiswaan'], keepAlive: true },
    },

    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: { template: '<div></div>' }
    },
  ],
})

router.beforeEach((to, from, next) => {
  const storedUser = localStorage.getItem('user')
  const isUserLoggedIn = !!storedUser
  let userRole: string | null = null

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      userRole = parsedUser?.role || null
    } catch {
      userRole = null
    }
  }

  const allowedRoles = to.meta.allowedRoles as string[] | undefined

  // Catch-all 404 handler
  if (to.name === 'notFound') {
    const notFoundStore = useNotFoundStore()
    notFoundStore.show()
    if (from.name) {
      next(false)
    } else {
      next('/')
    }
    return
  }

  if (to.meta.requiresAuth && !isUserLoggedIn) {
    next('/login')
  } else if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Show 404 popup instead of revealing the page
    const notFoundStore = useNotFoundStore()
    notFoundStore.show()
    // Stay on current page if possible, otherwise go home
    if (from.name) {
      next(false)
    } else {
      next('/')
    }
  } else if (to.meta.guest && isUserLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
