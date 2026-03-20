<script setup>
import { onMounted, ref } from 'vue'
import { getNotificationSettings, patchNotificationSettings } from '../api/securityEngineer'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const minSeverity = ref('HIGH')
const updatedAt = ref('')

const severityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
}

async function loadSettings() {
  loading.value = true
  error.value = ''

  try {
    const data = await getNotificationSettings()
    minSeverity.value = data.minSeverity || 'HIGH'
    updatedAt.value = data.updatedAt || ''
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось получить настройки уведомлений'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  success.value = ''
  error.value = ''

  try {
    const data = await patchNotificationSettings(minSeverity.value)
    minSeverity.value = data.minSeverity || minSeverity.value
    updatedAt.value = data.updatedAt || updatedAt.value
    success.value = 'Порог severity обновлен'
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось сохранить настройки'
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Настройки уведомлений</h1>
      <p class="lead">Управление порогом severity для уведомлений разработчикам и заглушка каналов доставки.</p>
    </div>

    <section class="content-grid single-mobile">
      <article class="surface-card">
        <div class="section-head">
          <h2>Severity threshold</h2>
          <span class="pill">NOTIFY</span>
        </div>

        <label class="field-inline stacked">
          Минимальный уровень severity
          <select v-model="minSeverity">
            <option v-for="item in severityOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <p class="muted-block">
          Принцип работы: выбранный уровень и выше. Например, `MEDIUM` отправит уведомление для
          `MEDIUM`, `HIGH`, `CRITICAL`.
        </p>

        <div class="button-row">
          <button class="primary-button" type="button" :disabled="saving" @click="saveSettings">
            {{ saving ? 'Сохранение...' : 'Сохранить порог' }}
          </button>
          <button class="ghost-button" type="button" :disabled="loading" @click="loadSettings">
            {{ loading ? 'Загрузка...' : 'Перечитать' }}
          </button>
        </div>

        <p class="muted-block">Обновлено: {{ formatDateTime(updatedAt) }}</p>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="success" class="inline-success">{{ success }}</p>
      </article>

      <article class="surface-card muted-note">
        <div class="section-head">
          <h2>Каналы уведомлений</h2>
          <span class="pill">BACKLOG</span>
        </div>
        <p>Заглушка: почта, Telegram и webhooks будут добавлены в следующем этапе.</p>
        <ul class="flat-list">
          <li>Email digest для ответственных команд</li>
          <li>Telegram-алерты для CRITICAL</li>
          <li>Webhook в CI/CD или SIEM</li>
        </ul>
      </article>
    </section>
  </section>
</template>
