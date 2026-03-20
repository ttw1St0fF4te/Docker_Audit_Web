<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../api/http'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const workspace = ref(null)
const loading = ref(false)
const error = ref('')

const roleBadge = computed(() => authStore.user?.roleLabel || 'Авторизованный пользователь')

async function loadWorkspace() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await http.get(route.meta.endpoint)
    workspace.value = data
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить рабочее пространство'
  } finally {
    loading.value = false
  }
}

async function logout() {
  await authStore.logout()
  await router.push('/login')
}

watch(() => route.fullPath, loadWorkspace)

onMounted(loadWorkspace)
</script>

<template>
  <section class="page-shell">
    <header class="surface-card workspace-hero">
      <div>
        <p class="eyebrow">{{ roleBadge }}</p>
        <h1>{{ workspace?.title || 'Загрузка рабочего пространства...' }}</h1>
        <p class="lead">
          {{ workspace?.summary || 'Подключаем backend-заглушку для выбранной роли и проверяем доступ.' }}
        </p>
      </div>

      <div class="workspace-usercard">
        <span class="usercard-label">Текущий пользователь</span>
        <strong>{{ authStore.user?.fullName }}</strong>
        <span>{{ authStore.user?.username }}</span>
        <button class="ghost-button" type="button" @click="logout">Выйти</button>
      </div>
    </header>

    <section v-if="error" class="surface-card workspace-panel workspace-panel--error">
      <h2>Доступ не получен</h2>
      <p>{{ error }}</p>
    </section>

    <section v-else class="workspace-grid">
      <article class="surface-card workspace-panel">
        <div class="panel-head">
          <h2>Доступные функции</h2>
          <span class="pill">{{ loading ? 'LOADING' : workspace?.role || authStore.user?.role }}</span>
        </div>
        <ul class="feature-list">
          <li v-for="item in workspace?.capabilities || []" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="surface-card workspace-panel">
        <div class="panel-head">
          <h2>Следующие шаги разработки</h2>
          <span class="pill">ROADMAP</span>
        </div>
        <ol class="step-list">
          <li v-for="item in workspace?.nextSteps || []" :key="item">{{ item }}</li>
        </ol>
      </article>
    </section>
  </section>
</template>