<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  generateAnalyticsReport,
  getAnalyticsOverview,
  getCveAnalyticsOverview,
  getCveSecurityScoreTrend,
  getCveSeverityTrend,
  getCveTopHosts,
  getCveTopRules,
  getSecurityScoreTrend,
  getSeverityTrend,
  getTopHosts,
  getTopRules,
  listHosts,
} from '../api/securityEngineer'

const loading = ref(false)
const error = ref('')
const reportLoading = ref(false)
const reportResult = ref('')

const filters = reactive({
  from: '',
  to: '',
  bucket: 'day',
  hostId: '',
})

const selectedScanType = ref('CIS')
const appliedScanType = ref('CIS')
const scanTypes = [
  { value: 'CIS', label: 'CIS (нарушения конфигураций)' },
  { value: 'CVE', label: 'CVE (уязвимости образов)' },
]

const topLimit = 10
const hosts = ref([])

const reportScopes = [
  { value: 'ALL', label: 'Общий отчет (все дашборды)' },
  { value: 'OVERVIEW', label: 'Сводная аналитика' },
  { value: 'SEVERITY_TREND', label: 'Динамика нарушений по severity' },
  { value: 'SECURITY_SCORE_TREND', label: 'Динамика индекса защищенности' },
  { value: 'TOP_HOSTS', label: 'Топ проблемных хостов' },
  { value: 'TOP_RULES', label: 'Топ провальных правил' },
]

const overview = ref(null)
const severityTrend = ref([])
const scoreTrend = ref([])
const topHosts = ref([])
const topRules = ref([])

const isCve = computed(() => appliedScanType.value === 'CVE')
const reportsAvailable = computed(() => true)
const overviewTotalLabel = computed(() => (isCve.value ? 'Всего уязвимостей' : 'Всего непройденных проверок'))
const topRulesTitle = computed(() => (isCve.value ? 'Топ-10 уязвимостей' : 'Топ-10 провальных правил'))
const trendTitle = computed(() => (isCve.value ? 'Динамика уязвимостей по severity' : 'Динамика нарушений по уровням severity'))
const scoreTitle = computed(() => (isCve.value ? 'Динамика CVE-индекса риска' : 'Динамика индекса защищенности'))

const maxSeverityTotal = computed(() => {
  const totals = severityTrend.value.map((item) => Number(item.totalFailed || 0))
  return Math.max(1, ...totals)
})

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
}

function trendWidth(value) {
  return `${Math.round((Number(value || 0) / maxSeverityTotal.value) * 100)}%`
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toIsoFromLocal(localValue) {
  if (!localValue) {
    return ''
  }
  return new Date(localValue).toISOString()
}

function validateDateRange() {
  if (filters.from && filters.to) {
    const fromMs = new Date(filters.from).getTime()
    const toMs = new Date(filters.to).getTime()
    if (!Number.isNaN(fromMs) && !Number.isNaN(toMs) && fromMs >= toMs) {
      error.value = 'Период задан некорректно: дата "с" должна быть раньше даты "по"'
      return false
    }
  }
  return true
}

function buildParams(includeLimit = false) {
  const params = {}

  if (filters.from) {
    params.from = toIsoFromLocal(filters.from)
  }

  if (filters.to) {
    params.to = toIsoFromLocal(filters.to)
  }

  if (filters.bucket) {
    params.bucket = filters.bucket
  }

  if (filters.hostId) {
    params.hostId = Number(filters.hostId)
  }

  if (includeLimit) {
    params.limit = topLimit
  }

  return params
}

async function loadAnalytics() {
  if (!validateDateRange()) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const hostsData = await listHosts({ page: 0, size: 200, active: true })
    hosts.value = hostsData.items || []

    const analyticsApi = selectedScanType.value === 'CVE'
      ? {
          overview: getCveAnalyticsOverview,
          severity: getCveSeverityTrend,
          score: getCveSecurityScoreTrend,
          topHosts: getCveTopHosts,
          topRules: getCveTopRules,
        }
      : {
          overview: getAnalyticsOverview,
          severity: getSeverityTrend,
          score: getSecurityScoreTrend,
          topHosts: getTopHosts,
          topRules: getTopRules,
        }

    const [overviewData, severityData, scoreData, topHostsData, rulesData] = await Promise.all([
      analyticsApi.overview(buildParams()),
      analyticsApi.severity(buildParams()),
      analyticsApi.score(buildParams()),
      analyticsApi.topHosts(buildParams(true)),
      analyticsApi.topRules(buildParams(true)),
    ])

    overview.value = overviewData
    severityTrend.value = severityData.items || []
    scoreTrend.value = scoreData.items || []
    topHosts.value = topHostsData.items || []
    topRules.value = rulesData.items || []
    appliedScanType.value = selectedScanType.value
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить аналитику'
  } finally {
    loading.value = false
  }
}

async function generateReport(scope, format) {
  if (!validateDateRange()) {
    return
  }

  reportLoading.value = true
  reportResult.value = ''
  error.value = ''

  try {
    const response = await generateAnalyticsReport({
      scope,
      format,
      scanType: appliedScanType.value,
      from: buildParams().from,
      to: buildParams().to,
      bucket: buildParams().bucket,
      hostId: buildParams().hostId,
    })
    reportResult.value = `Отчет скачан: ${response.fileName}`
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось сформировать отчет'
  } finally {
    reportLoading.value = false
  }
}

onMounted(loadAnalytics)

filters.to = toLocalInputValue(new Date())
filters.from = toLocalInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Тренды безопасности</h1>
      <p class="lead">Аналитика из ClickHouse: динамика уровней severity, защитного индекса, проблемные хосты и правила.</p>
    </div>

    <article class="surface-card">
      <div class="filters-row wrap">
        <label class="field-inline stacked">
          Тип сканирования
          <select v-model="selectedScanType">
            <option v-for="type in scanTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </label>

        <label class="field-inline stacked">
          Период с
          <input v-model="filters.from" type="datetime-local" />
        </label>

        <label class="field-inline stacked">
          Период по
          <input v-model="filters.to" type="datetime-local" />
        </label>

        <label class="field-inline stacked">
          Шаг группировки
          <select v-model="filters.bucket">
            <option value="hour">Час</option>
            <option value="day">День</option>
          </select>
        </label>

        <label class="field-inline stacked">
          Docker-хост
          <select v-model="filters.hostId">
            <option value="">Все хосты</option>
            <option v-for="host in hosts" :key="host.id" :value="String(host.id)">
              #{{ host.id }} · {{ host.name }}
            </option>
          </select>
        </label>

        <div class="filters-actions">
          <button class="primary-button" type="button" :disabled="loading" @click="loadAnalytics">
            {{ loading ? 'Загрузка...' : 'Применить фильтры' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="inline-error">{{ error }}</p>
    </article>

    <section class="stats-grid">
      <article class="surface-card stat-card">
        <h3>Индекс защищенности</h3>
        <p>{{ Number(overview?.securityScore || 0).toFixed(2) }}%</p>
      </article>
      <article class="surface-card stat-card">
        <h3>{{ overviewTotalLabel }}</h3>
        <p>{{ Number(overview?.totalFailed || 0).toLocaleString('ru-RU') }}</p>
      </article>
      <article class="surface-card stat-card">
        <h3>Нарушений CRITICAL</h3>
        <p>{{ Number(overview?.criticalCount || 0).toLocaleString('ru-RU') }}</p>
      </article>
      <article class="surface-card stat-card">
        <h3>Нарушений HIGH</h3>
        <p>{{ Number(overview?.highCount || 0).toLocaleString('ru-RU') }}</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="surface-card">
        <div class="section-head">
          <h2>{{ trendTitle }}</h2>
          <span class="pill">{{ severityTrend.length }} точек</span>
        </div>

        <div class="trend-list">
          <div v-for="point in severityTrend" :key="point.bucketStart" class="trend-row">
            <div class="trend-meta">
              <span>{{ formatDateTime(point.bucketStart) }}</span>
              <strong>{{ point.totalFailed }}</strong>
            </div>
            <div class="trend-bar">
              <div class="trend-bar__fill" :style="{ width: trendWidth(point.totalFailed) }"></div>
            </div>
          </div>
          <p v-if="!severityTrend.length" class="muted-block">Недостаточно данных для построения графика.</p>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>{{ scoreTitle }}</h2>
          <span class="pill">{{ scoreTrend.length }} точек</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Период</th>
                <th>Индекс</th>
                <th>Проверок</th>
                <th>Непройдено</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in scoreTrend" :key="item.bucketStart">
                <td>{{ formatDateTime(item.bucketStart) }}</td>
                <td>{{ Number(item.securityScore || 0).toFixed(2) }}%</td>
                <td>{{ item.totalChecks }}</td>
                <td>{{ item.totalFailed }}</td>
              </tr>
              <tr v-if="!scoreTrend.length">
                <td colspan="4">Данные отсутствуют</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="surface-card">
        <div class="section-head">
          <h2>Топ-10 проблемных хостов</h2>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Хост</th>
                <th>Сканов</th>
                <th>Непройдено</th>
                <th>Индекс</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in topHosts" :key="`${item.hostId}-${item.hostName}`">
                <td>#{{ item.hostId }} · {{ item.hostName }}</td>
                <td>{{ item.scans }}</td>
                <td>{{ item.totalFailed }}</td>
                <td>{{ Number(item.securityScore || 0).toFixed(2) }}%</td>
              </tr>
              <tr v-if="!topHosts.length">
                <td colspan="4">Нет данных</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>{{ topRulesTitle }}</h2>
        </div>
        <p class="muted-block">
          Детализация строится по ClickHouse и доступна примерно за последние 30 дней.
        </p>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ isCve ? 'Уязвимость' : 'Правило' }}</th>
                <th>{{ isCve ? 'Найдено' : 'Непройдено' }}</th>
                <th>Сканов</th>
                <th>Контейнеров</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in topRules" :key="item.ruleCode">
                <td>{{ item.ruleCode }} · {{ item.ruleName }}</td>
                <td>{{ item.failedCount }}</td>
                <td>{{ item.affectedScans }}</td>
                <td>{{ item.affectedContainers }}</td>
              </tr>
              <tr v-if="!topRules.length">
                <td colspan="4">Нет данных</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <article class="surface-card muted-note">
      <h2>Отчеты</h2>
      <p>Сформируйте общий отчет или отчет по выбранному дашборду в формате PDF/CSV.</p>
      <p class="muted-block">Отчеты формируются по выбранному типу сканирования (CIS или CVE).</p>
      <div class="report-grid">
        <div v-for="scope in reportScopes" :key="scope.value" class="report-row">
          <span>{{ scope.label }}</span>
          <div class="report-actions">
            <button
              class="ghost-button"
              type="button"
              :disabled="reportLoading || !reportsAvailable"
              @click="generateReport(scope.value, 'CSV')"
            >
              CSV
            </button>
            <button
              class="primary-button"
              type="button"
              :disabled="reportLoading || !reportsAvailable"
              @click="generateReport(scope.value, 'PDF')"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      <p v-if="reportResult" class="inline-success">{{ reportResult }}</p>
    </article>
  </section>
</template>
