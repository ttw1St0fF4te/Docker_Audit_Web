<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { initiatePasswordReset } from '../api/auth'

const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  identifier: '',
})

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await initiatePasswordReset(form)
    success.value = response.message || 'Если пользователь существует, временный пароль отправлен на почту'
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось отправить запрос на сброс пароля'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-shell">
    <article class="auth-card">
      <p class="eyebrow">Восстановление доступа</p>
      <h1>Забыли пароль?</h1>
      <p class="lead">Укажите username или email, чтобы получить временный пароль.</p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-inline stacked">
          Username или email
          <input v-model="form.identifier" type="text" placeholder="Например, ivan.petrov или ivan@mail.ru" />
        </label>

        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="success" class="inline-success">{{ success }}</p>

        <button class="primary-button" :disabled="loading" type="submit">
          {{ loading ? 'Отправка...' : 'Отправить временный пароль' }}
        </button>
      </form>

      <RouterLink class="muted-link" to="/recovery">Назад к выбору сценария</RouterLink>
    </article>
  </section>
</template>
