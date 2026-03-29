<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { confirmEmailChangeCode } from '../api/auth'

const route = useRoute()

const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  oldEmail: String(route.query.oldEmail || ''),
  newEmail: String(route.query.newEmail || ''),
  code: '',
})

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await confirmEmailChangeCode(form)
    success.value = response.message || 'Email успешно обновлен'
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось подтвердить код'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-shell">
    <article class="auth-card">
      <p class="eyebrow">Восстановление доступа</p>
      <h1>Подтверждение кода (B1)</h1>
      <p class="lead">Шаг 2: введите полученный код. Старый и новый email уже подставлены.</p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-inline stacked">
          Текущий email
          <input v-model="form.oldEmail" type="email" placeholder="old@mail.ru" />
        </label>

        <label class="field-inline stacked">
          Новый email
          <input v-model="form.newEmail" type="email" placeholder="new@mail.ru" />
        </label>

        <label class="field-inline stacked">
          Код подтверждения
          <input v-model="form.code" type="text" placeholder="Например, 123456" />
        </label>

        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="success" class="inline-success">{{ success }}</p>

        <button class="primary-button" :disabled="loading" type="submit">
          {{ loading ? 'Проверка...' : 'Подтвердить код' }}
        </button>
      </form>

      <RouterLink class="muted-link" to="/recovery/email-code/request">Назад к шагу запроса кода</RouterLink>
    </article>
  </section>
</template>
