<script setup>
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: String(route.query.identifier || authStore.pendingActivationIdentifier || ''),
  temporaryPassword: '',
  newPassword: '',
})

async function submit() {
  const response = await authStore.activatePassword(form)
  await router.push(response.homePath || authStore.homePath)
}
</script>

<template>
  <section class="auth-shell">
    <article class="auth-card">
      <p class="eyebrow">Первичный вход</p>
      <h1>Активация пароля</h1>
      <p class="lead">Введите временный пароль из письма и установите постоянный пароль.</p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-inline stacked">
          Username или email
          <input v-model="form.username" type="text" autocomplete="username" placeholder="username или email" />
        </label>

        <label class="field-inline stacked">
          Временный пароль
          <input v-model="form.temporaryPassword" type="password" autocomplete="one-time-code" placeholder="Введите временный пароль из письма" />
        </label>

        <label class="field-inline stacked">
          Новый пароль
          <input v-model="form.newPassword" type="password" autocomplete="new-password" placeholder="Введите новый пароль" />
        </label>

        <p v-if="authStore.error" class="inline-error">{{ authStore.error }}</p>

        <button class="primary-button" :disabled="authStore.loading" type="submit">
          {{ authStore.loading ? 'Сохранение...' : 'Активировать пароль' }}
        </button>
      </form>
    </article>
  </section>
</template>
