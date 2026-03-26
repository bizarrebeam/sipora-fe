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
import CreateAspirasiView from '@/views/CreateAspirasiView.vue'
import DetailArtikelView from '@/views/DetailArtikelView.vue' //untuk baca
import KelolaArtikelView from '@/views/KelolaArtikelView.vue' //halaman pertama admin
import CreateArtikelView from '@/views/CreateArtikelView.vue' //create & edit artikel

import ForgotPasswordView from '../views/ForgotPasswordView.vue'
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
      beforeEnter: async (to, from, next) => {
        try {
          const { useLaporanKerusakanStore } = await import('@/stores/laporanKerusakan')
          await useLaporanKerusakanStore().fetchLaporanDetail(to.params.id as string)
          next()
        } catch (e: any) {
          const { useNotFoundStore } = await import('@/stores/notFound')
          if (useNotFoundStore().visible) {
            if (from.name) {
              next(false)
            } else {
              next('/')
            }
          } else {
            next()
          }
        }
      }
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
      beforeEnter: async (to, from, next) => {
        try {
          const { useLaporanBullyingStore } = await import('@/stores/laporanBullying')
          await useLaporanBullyingStore().ambilDetail(to.params.id as string)
          next()
        } catch (e: any) {
          const { useNotFoundStore } = await import('@/stores/notFound')
          if (useNotFoundStore().visible) {
            if (from.name) {
              next(false)
            } else {
              next('/')
            }
          } else {
            next()
          }
        }
      }
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
      beforeEnter: async (to, from, next) => {
        try {
          const { useLaporanBullyingStore } = await import('@/stores/laporanBullying')
          await useLaporanBullyingStore().ambilDetail(to.params.id as string)
          next()
        } catch (e: any) {
          const { useNotFoundStore } = await import('@/stores/notFound')
          if (useNotFoundStore().visible) {
            if (from.name) {
              next(false)
            } else {
              next('/')
            }
          } else {
            next()
          }
        }
      }
    },
    {
      path: '/laporan-kerusakan/:id/edit',
      name: 'editLaporanKerusakan',
      component: EditLaporanKerusakanView,
      meta: { requiresAuth: true, allowedRoles: ['kemahasiswaan', 'guru', 'siswa'] },
      beforeEnter: async (to, from, next) => {
        try {
          const { useLaporanKerusakanStore } = await import('@/stores/laporanKerusakan')
          await useLaporanKerusakanStore().fetchLaporanDetail(to.params.id as string)
          next()
        } catch (e: any) {
          const { useNotFoundStore } = await import('@/stores/notFound')
          if (useNotFoundStore().visible) {
            if (from.name) {
              next(false)
            } else {
              next('/')
            }
          } else {
            next()
          }
        }
      }
    },
    {
      path: '/aspirasi',
      name: 'aspirasi',
      component: AspirasiView,
      meta: { requiresAuth: true, keepAlive: true },
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
    // Catch-all 404 route
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      redirect: (to) => {
        // Will be handled in beforeEach to show popup
        return { path: '/', query: { notFound: '1' } }
      },
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

  // Handle catch-all 404 redirect
  if (to.query.notFound === '1') {
    const notFoundStore = useNotFoundStore()
    notFoundStore.show()
    next({ path: '/', replace: true })
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
