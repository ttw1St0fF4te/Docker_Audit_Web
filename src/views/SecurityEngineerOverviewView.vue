<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getAnalyticsOverview, getRecentAudits } from '../api/securityEngineer'

const loading = ref(false)
const error = ref('')
const overview = ref(null)
const recent = ref([])
const totalScans = ref(0)

const shortcuts = [
  { to: '/security-engineer/rules', label: 'Конфигурация CIS-правил' },
  { to: '/security-engineer/schedules', label: 'Расписания и запуск аудита' },
  { to: '/security-engineer/scans', label: 'История сканирований' },
  { to: '/security-engineer/analytics', label: 'Тренды и отчеты' },
  { to: '/security-engineer/notifications', label: 'Настройки уведомлений' },
]

function toNumber(value) {
  return Number(value || 0).toLocaleString('ru-RU')
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
}

async function loadData() {
  loading.value = true
  error.value = ''

  try {
    const [overviewData, recentData] = await Promise.all([getAnalyticsOverview(), getRecentAudits()])
    overview.value = overviewData
    recent.value = recentData.items || []
    totalScans.value = Number(recentData.total || recent.value.length)
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить обзор безопасности'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <section class="page-shell">
    <div class="page-head">
      <p class="eyebrow">Инженер-безопасности</p>
      <h1>Панель управления безопасностью Docker</h1>
      <p class="lead">Управляйте проверками CIS, расписаниями, аудитами и уведомлениями в одном месте.</p>
    </div>

    <p v-if="error" class="inline-error">{{ error }}</p>

    <section class="stats-grid">
      <article class="surface-card stat-card">
        <h3>Всего сканов</h3>
        <p>{{ toNumber(totalScans) }}</p>
      </article>
      <article class="surface-card stat-card">
        <h3>Нарушений CRITICAL</h3>
        <p>{{ toNumber(overview?.criticalCount) }}</p>
      </article>
      <article class="surface-card stat-card">
        <h3>Нарушений HIGH</h3>
        <p>{{ toNumber(overview?.highCount) }}</p>
      </article>
      <article class="surface-card stat-card">
        <h3>Security Score</h3>
        <p>{{ Number(overview?.securityScore || 0).toFixed(2) }}%</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="surface-card">
        <div class="section-head">
          <h2>Быстрые действия</h2>
          <span class="pill">WORKFLOW</span>
        </div>
        <div class="shortcut-grid">
          <RouterLink v-for="item in shortcuts" :key="item.to" :to="item.to" class="shortcut-item">
            {{ item.label }}
          </RouterLink>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>Последние сканы</h2>
          <span class="pill">{{ loading ? 'LOADING' : `${recent.length} шт.` }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Хост</th>
                <th>Статус</th>
                <th>Запущен</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="scan in recent.slice(0, 6)" :key="scan.scanId">
                <td>#{{ scan.scanId }}</td>
                <td>{{ scan.hostId }}</td>
                <td>{{ scan.status }}</td>
                <td>{{ formatDateTime(scan.startedAt) }}</td>
              </tr>
              <tr v-if="!recent.length && !loading">
                <td colspan="4">Сканы пока отсутствуют</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </section>
</template>
