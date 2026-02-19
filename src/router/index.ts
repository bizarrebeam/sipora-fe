import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guest: true }
    }
  ]
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token')
  const isAuthenticated = !!token

  // If route is guest-only (login/register) and user is authenticated, redirect to home
  if (to.meta.guest && isAuthenticated) {
    next({ name: 'home' })
    return
  }

  // If route requires auth and user is not authenticated, redirect to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
    return
  }

  next()
})

export default router