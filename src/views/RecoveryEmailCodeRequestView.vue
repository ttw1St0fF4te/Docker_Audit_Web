<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { requestEmailChangeCode } from '../api/auth'

const router = useRouter()

const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  oldEmail: '',
  newEmail: '',
})

async function submit() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await requestEmailChangeCode(form)
    success.value = response.message || 'Код отправлен на старый email'

    await router.push({
      name: 'recovery-email-code-confirm',
      query: {
        oldEmail: form.oldEmail,
        newEmail: form.newEmail,
      },
    })
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось запросить код подтверждения'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-shell">
    <article class="auth-card">
      <p class="eyebrow">Восстановление доступа</p>
      <h1>Смена email по коду (B1)</h1>
      <p class="lead">Шаг 1: укажите старый и новый email, после этого отправим код подтверждения.</p>

      <form class="login-form" @submit.prevent="submit">
        <label class="field-inline stacked">
          Текущий email
          <input v-model="form.oldEmail" type="email" placeholder="old@mail.ru" />
        </label>

        <label class="field-inline stacked">
          Новый email
          <input v-model="form.newEmail" type="email" placeholder="new@mail.ru" />
        </label>

        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="success" class="inline-success">{{ success }}</p>

        <button class="primary-button" :disabled="loading" type="submit">
          {{ loading ? 'Отправка...' : 'Запросить код' }}
        </button>
      </form>

      <RouterLink class="muted-link" to="/recovery">Назад к выбору сценария</RouterLink>
    </article>
  </section>
</template>
