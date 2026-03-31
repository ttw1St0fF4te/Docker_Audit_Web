<script setup>
import { onMounted, ref } from 'vue'
import {
  getDashboardContainerLoad,
  getDashboardContainerState,
  getDashboardSeverityBreakdown,
  getDashboardTopRiskContainers,
} from '../api/developer'
import { listHosts } from '../api/securityEngineer'

const hosts = ref([])
const selectedHostId = ref('')
const period = ref('24H')
const loading = ref(false)
const error = ref('')

const stateWidget = ref({ generatedAt: '', items: [] })
const loadWidget = ref({ generatedAt: '', limit: 10, items: [] })
const riskWidget = ref({ generatedAt: '', scanId: null, limit: 10, items: [] })
const severityWidget = ref({
  generatedAt: '',
  period: '24H',
  from: '',
  to: '',
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  totalFailed: 0,
})

function toHostIdParam() {
  if (!selectedHostId.value) {
    return undefined
  }
  return Number(selectedHostId.value)
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function formatBytes(value) {
  const bytes = Number(value || 0)
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function loadHostOptions() {
  const data = await listHosts({ includeInactive: false, includeDeleted: false, page: 0, size: 200 })
  hosts.value = data.items || []
}

async function loadDashboard() {
  loading.value = true
  error.value = ''

  const hostId = toHostIdParam()
  const results = await Promise.allSettled([
    getDashboardContainerState({ hostId }),
    getDashboardContainerLoad({ hostId, limit: 10 }),
    getDashboardTopRiskContainers({ hostId, limit: 10 }),
    getDashboardSeverityBreakdown({ hostId, period: period.value }),
  ])

  const [stateResult, loadResult, riskResult, severityResult] = results
  let failedCount = 0

  if (stateResult.status === 'fulfilled') {
    stateWidget.value = stateResult.value
  } else {
    failedCount++
  }

  if (loadResult.status === 'fulfilled') {
    loadWidget.value = loadResult.value
  } else {
    failedCount++
  }

  if (riskResult.status === 'fulfilled') {
    riskWidget.value = riskResult.value
  } else {
    failedCount++
  }

  if (severityResult.status === 'fulfilled') {
    severityWidget.value = severityResult.value
  } else {
    failedCount++
  }

  if (failedCount === results.length) {
    const firstError = results.find((result) => result.status === 'rejected')
    error.value = firstError?.reason?.response?.data?.message || 'Не удалось загрузить дэшборд разработчика'
  } else if (failedCount > 0) {
    error.value = 'Часть виджетов не удалось загрузить. Проверьте доступность Docker-хоста и ClickHouse.'
  }

  loading.value = false
}

async function refreshAll() {
  await loadDashboard()
}

onMounted(async () => {
  try {
    await loadHostOptions()
  } catch {
    hosts.value = []
  }
  await loadDashboard()
})
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Дэшборд разработчика</h1>
      <p class="lead">Операционное состояние контейнеров и приоритеты исправления уязвимостей.</p>
    </div>

    <section class="surface-card">
      <div class="filters-row wrap">
        <label class="field-inline stacked filter-item">
          Docker-хост
          <select v-model="selectedHostId" :disabled="loading">
            <option value="">Все хосты</option>
            <option v-for="host in hosts" :key="host.id" :value="String(host.id)">#{{ host.id }} · {{ host.name }}</option>
          </select>
        </label>

        <label class="field-inline stacked filter-item">
          Период breakdown
          <select v-model="period" :disabled="loading">
            <option value="24H">Последние 24ч</option>
            <option value="7D">Последние 7 дней</option>
          </select>
        </label>

        <div class="filters-actions">
          <button class="primary-button" type="button" :disabled="loading" @click="refreshAll">
            {{ loading ? 'Загрузка...' : 'Обновить дэшборд' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="inline-error dashboard-error">{{ error }}</p>
    </section>

    <section class="content-grid single-mobile">
      <article class="surface-card">
        <div class="section-head">
          <h2>Состояние контейнеров по хостам</h2>
          <span class="pill">РАНТАЙМ</span>
        </div>
        <p class="muted-block">Срез: {{ formatDateTime(stateWidget.generatedAt) }}</p>

        <div class="table-wrap">
          <table class="data-table data-table--compact">
            <thead>
              <tr>
                <th class="host-header">Хост</th>
                <th class="metric-header" title="Всего контейнеров">Всего</th>
                <th class="metric-header" title="Запущенные контейнеры">Запуск</th>
                <th class="metric-header" title="Остановленные контейнеры">Стоп</th>
                <th class="metric-header" title="Контейнеры в перезапуске">Рестарт</th>
                <th class="metric-header" title="Нездоровые контейнеры">Нездор.</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in stateWidget.items" :key="item.hostId">
                <td class="host-cell">
                  <div class="host-name">{{ item.host }}</div>
                  <small v-if="item.error" class="inline-error">{{ item.error }}</small>
                </td>
                <td class="metric-cell">{{ item.total }}</td>
                <td class="metric-cell">{{ item.running }}</td>
                <td class="metric-cell">{{ item.exited }}</td>
                <td class="metric-cell">{{ item.restarting }}</td>
                <td class="metric-cell">{{ item.unhealthy }}</td>
              </tr>
              <tr v-if="!stateWidget.items?.length">
                <td colspan="6" class="muted-cell">Нет данных по состоянию контейнеров.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>Топ контейнеров по нагрузке</h2>
          <span class="pill">НАГРУЗКА</span>
        </div>
        <p class="muted-block">Срез: {{ formatDateTime(loadWidget.generatedAt) }}</p>

        <div class="table-wrap">
          <table class="data-table data-table--compact">
            <thead>
              <tr>
                <th class="nowrap-cell">Контейнер</th>
                <th class="nowrap-cell">Хост</th>
                <th class="nowrap-cell">CPU</th>
                <th class="nowrap-cell">Память</th>
                <th class="nowrap-cell">Память %</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in loadWidget.items" :key="`${item.hostId}-${item.containerId}`">
                <td>{{ item.container }}</td>
                <td>{{ item.host }}</td>
                <td>{{ formatPercent(item.cpuPercent) }}</td>
                <td>{{ formatBytes(item.memoryUsageBytes) }} / {{ formatBytes(item.memoryLimitBytes) }}</td>
                <td>{{ formatPercent(item.memoryPercent) }}</td>
              </tr>
              <tr v-if="!loadWidget.items?.length">
                <td colspan="5" class="muted-cell">Нет данных по нагрузке контейнеров.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>Проблемные контейнеры</h2>
          <span class="pill">ПОСЛЕДНИЙ СКАН</span>
        </div>
        <p class="muted-block">
          Срез: {{ formatDateTime(riskWidget.generatedAt) }}
          <span v-if="riskWidget.scanId">· скан #{{ riskWidget.scanId }}</span>
        </p>

        <div class="table-wrap">
          <table class="data-table data-table--compact">
            <thead>
              <tr>
                <th class="nowrap-cell">Контейнер</th>
                <th class="nowrap-cell">Хост</th>
                <th class="nowrap-cell">Провалено проверок</th>
                <th class="nowrap-cell">Макс. severity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in riskWidget.items" :key="`${item.scanId}-${item.hostId}-${item.container}`">
                <td>{{ item.container }}</td>
                <td>{{ item.host }}</td>
                <td>{{ item.failedChecks }}</td>
                <td>{{ item.maxSeverity }}</td>
              </tr>
              <tr v-if="!riskWidget.items?.length">
                <td colspan="4" class="muted-cell">Нет данных по проблемным контейнерам.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>Распределение severity</h2>
          <span class="pill">{{ severityWidget.period }}</span>
        </div>
        <p class="muted-block">Период: {{ formatDateTime(severityWidget.from) }} - {{ formatDateTime(severityWidget.to) }}</p>

        <div class="summary-grid">
          <div class="summary-item">
            <span>CRITICAL</span>
            <strong>{{ severityWidget.critical }}</strong>
          </div>
          <div class="summary-item">
            <span>HIGH</span>
            <strong>{{ severityWidget.high }}</strong>
          </div>
          <div class="summary-item">
            <span>MEDIUM</span>
            <strong>{{ severityWidget.medium }}</strong>
          </div>
          <div class="summary-item">
            <span>LOW</span>
            <strong>{{ severityWidget.low }}</strong>
          </div>
        </div>

        <p class="muted-block summary-total">Всего нарушений: {{ severityWidget.totalFailed }}</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.filter-item {
  min-width: 220px;
}

.dashboard-error {
  margin-top: 10px;
}

.summary-total {
  margin-top: 10px;
}

.nowrap-cell {
  white-space: nowrap;
}

.host-header,
.host-cell {
  width: 42%;
  min-width: 240px;
}

.host-name {
  white-space: normal;
  word-break: normal;
  overflow-wrap: anywhere;
}

.metric-header,
.metric-cell {
  width: 90px;
  white-space: nowrap;
}
</style>
