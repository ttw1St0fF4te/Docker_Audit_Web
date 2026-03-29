<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile, initiateProfilePasswordReset, updateProfile } from '../api/profile'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  roleLabel: '',
})

async function loadProfile() {
  loading.value = true
  error.value = ''

  try {
    const data = await getProfile()
    form.username = data.username || ''
    form.firstName = data.firstName || ''
    form.lastName = data.lastName || ''
    form.email = data.email || ''
    form.role = data.role || ''
    form.roleLabel = data.roleLabel || ''
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить профиль'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    const data = await updateProfile({
      username: form.username,
      firstName: form.firstName,
      lastName: form.lastName,
    })

    form.username = data.username || form.username
    form.firstName = data.firstName || form.firstName
    form.lastName = data.lastName || form.lastName
    form.email = data.email || form.email
    form.role = data.role || form.role
    form.roleLabel = data.roleLabel || form.roleLabel

    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        username: form.username,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
      }
    }

    success.value = 'Профиль успешно обновлен'
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось обновить профиль'
  } finally {
    saving.value = false
  }
}

async function resetPasswordFromProfile() {
  const confirmed = window.confirm('Инициировать сброс пароля? Текущая сессия будет завершена.')
  if (!confirmed) {
    return
  }

  resetting.value = true
  error.value = ''

  try {
    const identifier = form.username
    const response = await initiateProfilePasswordReset()
    await authStore.logout()
    await router.push({ path: response.redirectPath || '/activate-password', query: { identifier } })
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось инициировать сброс пароля'
  } finally {
    resetting.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Профиль пользователя</h1>
      <p class="lead">Управление базовыми данными учетной записи.</p>
    </div>

    <p v-if="error" class="inline-error">{{ error }}</p>
    <p v-if="success" class="inline-success">{{ success }}</p>

    <article class="surface-card">
      <form class="form-grid" @submit.prevent="saveProfile">
        <label class="field-inline stacked">
          Username
          <input v-model="form.username" type="text" :disabled="loading" placeholder="ivan.petrov" />
        </label>

        <label class="field-inline stacked">
          Имя
          <input v-model="form.firstName" type="text" :disabled="loading" placeholder="Иван" />
        </label>

        <label class="field-inline stacked">
          Фамилия
          <input v-model="form.lastName" type="text" :disabled="loading" placeholder="Петров" />
        </label>

        <label class="field-inline stacked">
          Email
          <input :value="form.email" type="email" disabled />
        </label>

        <label class="field-inline stacked">
          Роль
          <input :value="form.roleLabel || form.role" type="text" disabled />
        </label>

        <div class="button-row">
          <button class="primary-button" :disabled="saving || loading" type="submit">
            {{ saving ? 'Сохранение...' : 'Сохранить профиль' }}
          </button>
          <button class="ghost-button" :disabled="loading" type="button" @click="loadProfile">
            {{ loading ? 'Загрузка...' : 'Обновить данные' }}
          </button>
        </div>
      </form>
    </article>

    <article class="surface-card muted-note">
      <h2>Сброс пароля</h2>
      <p>После инициации сброса текущая сессия завершается, временный пароль отправляется на email.</p>
      <div class="profile-reset-actions">
        <button class="ghost-button" :disabled="resetting" type="button" @click="resetPasswordFromProfile">
          {{ resetting ? 'Выполняется...' : 'Инициировать сброс пароля' }}
        </button>
      </div>
    </article>
  </section>
</template>
