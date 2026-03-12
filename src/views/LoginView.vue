<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useHealthStore } from '../stores/health'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const healthStore = useHealthStore()

const form = reactive({
  username: 'engineer',
  password: 'engineer123',
})

const demoAccounts = [
  { role: 'Инженер-безопасности', username: 'engineer', password: 'engineer123' },
  { role: 'Разработчик', username: 'developer', password: 'developer123' },
  { role: 'Супер-администратор', username: 'admin', password: 'admin123' },
]

const cards = computed(() => {
  const databases = healthStore.payload?.databases || {}

  return [
    {
      key: 'service',
      title: 'Backend API',
      status: healthStore.payload?.status || healthStore.status,
      message: healthStore.payload?.service || 'docker-audit-api',
      details: healthStore.error || 'Endpoint /api/health отвечает и доступен из Vue.',
    },
    {
      key: 'postgres',
      title: 'PostgreSQL',
      status: databases.postgres?.status || 'UNKNOWN',
      message: databases.postgres?.message || 'Ожидание ответа от backend.',
      details: databases.postgres?.details || 'Проверка соединения через PostgreSQL datasource.',
    },
    {
      key: 'clickhouse',
      title: 'ClickHouse',
      status: databases.clickhouse?.status || 'UNKNOWN',
      message: databases.clickhouse?.message || 'Ожидание ответа от backend.',
      details: databases.clickhouse?.details || 'Проверка соединения через ClickHouse datasource.',
    },
  ]
})

onMounted(() => {
  healthStore.fetchHealth()
})

async function submit() {
  const response = await authStore.login(form)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : response.homePath
  await router.push(redirect)
}

function useDemoAccount(account) {
  form.username = account.username
  form.password = account.password
}
</script>

<template>
  <main class="auth-layout">
    <section class="auth-panel auth-panel--primary">
      <p class="eyebrow">Docker Security Audit</p>
      <h1>Авторизация по ролям для курсовой системы мониторинга Docker</h1>
      <p class="lead">
        На этом этапе вход ведет на role-based страницы-заглушки. Пользователи хранятся в PostgreSQL,
        а frontend получает session от Spring Boot через API.
      </p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field">
          <span>Логин</span>
          <input v-model="form.username" type="text" autocomplete="username" placeholder="Введите логин" />
        </label>

        <label class="field">
          <span>Пароль</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="Введите пароль"
          />
        </label>

        <p v-if="authStore.error" class="form-error">{{ authStore.error }}</p>

        <button class="primary-button" :disabled="authStore.loading">
          {{ authStore.loading ? 'Вход...' : 'Войти в систему' }}
        </button>
      </form>

      <div class="accounts-panel">
        <div class="accounts-head">
          <h2>Тестовые пользователи</h2>
          <span>Создаются автоматически при старте backend</span>
        </div>

        <div class="accounts-grid">
          <button
            v-for="account in demoAccounts"
            :key="account.username"
            class="account-card"
            type="button"
            @click="useDemoAccount(account)"
          >
            <strong>{{ account.role }}</strong>
            <span>Логин: {{ account.username }}</span>
            <span>Пароль: {{ account.password }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="auth-panel auth-panel--secondary">
      <div class="status-head">
        <div>
          <p class="eyebrow">Инфраструктура</p>
          <h2>Состояние окружения</h2>
        </div>
        <button class="ghost-button" :disabled="healthStore.loading" @click="healthStore.fetchHealth">
          {{ healthStore.loading ? 'Проверка...' : 'Обновить' }}
        </button>
      </div>

      <div class="status-grid">
        <article v-for="card in cards" :key="card.key" class="status-card" :data-status="card.status">
          <div class="card-head">
            <h3>{{ card.title }}</h3>
            <span class="pill">{{ card.status }}</span>
          </div>
          <p class="card-message">{{ card.message }}</p>
          <p class="card-details">{{ card.details }}</p>
        </article>
      </div>
    </section>
  </main>
</template>