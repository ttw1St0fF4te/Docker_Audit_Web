<script setup>
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
})

async function submit() {
  const response = await authStore.login(form)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : response.homePath
  await router.push(redirect)
}
</script>

<template>
  <section class="auth-shell">
    <article class="auth-card">
      <p class="eyebrow">Docker Audit Platform</p>
      <h1>Вход в систему</h1>
      <p class="lead">Авторизуйтесь, чтобы открыть рабочее пространство вашей роли.</p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-inline stacked">
          Логин
          <input v-model="form.username" type="text" autocomplete="username" placeholder="username" />
        </label>

        <label class="field-inline stacked">
          Пароль
          <input v-model="form.password" type="password" autocomplete="current-password" placeholder="password" />
        </label>

        <p v-if="authStore.error" class="inline-error">{{ authStore.error }}</p>

        <button class="primary-button" :disabled="authStore.loading" type="submit">
          {{ authStore.loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </article>
  </section>
</template>