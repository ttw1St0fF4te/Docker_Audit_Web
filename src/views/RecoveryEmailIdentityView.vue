<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { verifyIdentityEmailChange } from '../api/auth'

const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  username: '',
  lastName: '',
  role: 'DEVELOPER',
  newEmail: '',
})

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await verifyIdentityEmailChange(form)
    success.value = response.message || 'Email успешно обновлен'
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось подтвердить проверочные данные'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-shell">
    <article class="auth-card">
      <p class="eyebrow">Восстановление доступа</p>
      <h1>Смена email по проверочным данным (B2)</h1>
      <p class="lead">Укажите username, фамилию, роль и новый email.</p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-inline stacked">
          Username
          <input v-model="form.username" type="text" placeholder="Например, ivan.petrov" />
        </label>

        <label class="field-inline stacked">
          Фамилия
          <input v-model="form.lastName" type="text" placeholder="Например, Петров" />
        </label>

        <label class="field-inline stacked">
          Роль
          <select v-model="form.role">
            <option value="DEVELOPER">DEVELOPER</option>
            <option value="SECURITY_ENGINEER">SECURITY_ENGINEER</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </label>

        <label class="field-inline stacked">
          Новый email
          <input v-model="form.newEmail" type="email" placeholder="new@mail.ru" />
        </label>

        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="success" class="inline-success">{{ success }}</p>

        <button class="primary-button" :disabled="loading" type="submit">
          {{ loading ? 'Проверка...' : 'Подтвердить данные и сменить email' }}
        </button>
      </form>

      <RouterLink class="muted-link" to="/recovery">Назад к выбору сценария</RouterLink>
    </article>
  </section>
</template>
