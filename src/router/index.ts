import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfilView from '../views/ProfilView.vue'
import ManajemenAkunView from '../views/ManajemenAkunView.vue'
import LogAktivitasView from '../views/LogAktivitasView.vue'
import LoginGuruView from '../views/LoginGuruView.vue'
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
import CreateAspirasiView from '@/views/CreateAspirasiView.vue'
import DetailArtikelView from '@/views/DetailArtikelView.vue' //untuk baca
import KelolaArtikelView from '@/views/KelolaArtikelView.vue' //halaman pertama admin
import CreateArtikelView from '@/views/CreateArtikelView.vue' //create & edit artikel

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
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
      path: '/internal/login-bk',
      name: 'loginPtk',
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
      meta: { requiresAuth: true },
    },
    {
      path: '/manajemen-akun',
      name: 'manajemenAkun',
      component: ManajemenAkunView,
      meta: { requiresAuth: true },
    },
    {
      path: '/log-aktivitas',
      name: 'logAktivitas',
      component: LogAktivitasView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laporan-kerusakan',
      name: 'laporanKerusakan',
      component: LaporanKerusakanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laporan-kerusakan/:id',
      name: 'detailLaporanKerusakan',
      component: DetailLaporanKerusakanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/create-kerusakan',
      name: 'createLaporanKerusakan',
      component: CreateLaporanKerusakanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laporan-bullying',
      name: 'laporanBullying',
      component: LaporanBullyingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laporan-bullying/:id',
      name: 'detailLaporanBullying',
      component: DetailLaporanBullyingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/create-bullying',
      name: 'createLaporanBullying',
      component: CreateLaporanBullyingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laporan-bullying/:id/edit',
      name: 'editLaporanBullying',
      component: EditLaporanBullyingView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laporan-kerusakan/:id/edit',
      name: 'editLaporanKerusakan',
      component: EditLaporanKerusakanView,
      meta: { requiresAuth: true },
    },
    {
      path: '/aspirasi',
      name: 'aspirasi',
      component: AspirasiView,
      meta: { requiresAuth: true },
    },
    {
      path: '/create-aspirasi',
      name: 'createAspirasi',
      component: CreateAspirasiView,
      meta: { requiresAuth: true },
    },
    {
      path: '/artikel/:id',
      name: 'detailArtikel',
      component: DetailArtikelView,
      // No auth required - anyone can read articles
    },
    {
      path: '/kelola-artikel',
      name: 'kelolaArtikel',
      component: KelolaArtikelView,
      // No auth required - guests can read articles, admins can manage
    },
    {
      path: '/create-artikel',
      name: 'createArtikel',
      component: CreateArtikelView,
      meta: { requiresAuth: true },
    },
    {
      path: '/edit-artikel/:id',
      name: 'editArtikel',
      component: CreateArtikelView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isUserLoggedIn = !!localStorage.getItem('user')
  if (to.meta.requiresAuth && !isUserLoggedIn) {
    next('/login')
  } else if (to.meta.guest && isUserLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
