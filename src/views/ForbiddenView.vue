<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleAcknowledge() {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <section class="page-shell forbidden-shell">
    <article class="surface-card workspace-panel workspace-panel--error">
      <p class="eyebrow">403</p>
      <h1>Для этой страницы нужна другая роль</h1>
      <p class="lead">
        Текущая сессия авторизована, но роль пользователя не подходит для запрошенного раздела.
      </p>
      <button class="primary-button" type="button" @click="handleAcknowledge">Выйти и перейти ко входу</button>
    </article>
  </section>
</template>