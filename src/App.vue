<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navByRole = {
  SECURITY_ENGINEER: [
    { to: '/security-engineer/overview', label: 'Обзор' },
    { to: '/security-engineer/rules', label: 'CIS-правила' },
    { to: '/security-engineer/schedules', label: 'Расписания' },
    { to: '/security-engineer/scans', label: 'История сканов' },
    { to: '/security-engineer/analytics', label: 'Тренды' },
    { to: '/security-engineer/notifications', label: 'Уведомления' },
  ],
  DEVELOPER: [
    { to: '/developer/dashboard', label: 'Дэшборд' },
    { to: '/developer/notifications', label: 'Уведомления' },
  ],
  SUPER_ADMIN: [
    { to: '/super-admin/users', label: 'Пользователи' },
    { to: '/super-admin/audit-logs', label: 'Аудит-лог' },
    { to: '/super-admin/hosts', label: 'Docker хосты' },
  ],
}

const roleNavItems = computed(() => {
  const role = authStore.user?.role
  const roleItems = role ? navByRole[role] || [] : []
  return authStore.isAuthenticated ? [...roleItems, { to: '/profile', label: 'Профиль' }] : []
})

async function logout() {
  await authStore.logout()
  await router.push('/login')
}

function isRouteActive(path) {
  return route.path === path
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="site-header__inner">
        <RouterLink class="brand" to="/">
          <span class="brand__badge">C3</span>
          <span class="brand__text">
            <strong>Docker Audit</strong>
            <small>Security Console</small>
          </span>
        </RouterLink>

        <nav class="site-nav">
          <template v-if="authStore.isAuthenticated">
            <RouterLink
              v-for="item in roleNavItems"
              :key="item.to"
              :to="item.to"
              class="nav-link"
              :class="{ 'nav-link--active': isRouteActive(item.to) }"
            >
              {{ item.label }}
            </RouterLink>
            <button class="ghost-button" type="button" @click="logout">Выйти</button>
          </template>

          <template v-else>
            <RouterLink class="primary-button" to="/login">Войти</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <p>Курсовой проект: аудит Docker-инфраструктуры по CIS-проверкам.</p>
        <p>2026 · Security Engineer UI</p>
      </div>
    </footer>
  </div>
</template>
