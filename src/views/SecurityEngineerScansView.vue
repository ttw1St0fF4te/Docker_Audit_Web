<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAuditSummary, searchAudits } from '../api/securityEngineer'

const loading = ref(false)
const summaryLoading = ref(false)
const error = ref('')
const scans = ref([])
const selectedScanId = ref(null)
const summary = ref(null)
const total = ref(0)

const filters = reactive({
  page: 0,
  size: 20,
  scanId: '',
  hostId: '',
  status: '',
  from: '',
  to: '',
  sortBy: 'startedAt',
  sortDir: 'DESC',
})

const sortByOptions = [
  { value: 'startedAt', label: 'Дата запуска' },
  { value: 'id', label: 'ID скана' },
  { value: 'status', label: 'Статус' },
  { value: 'totalViolations', label: 'Количество нарушений' },
  { value: 'hostId', label: 'Хост' },
]

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
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

function validateFilters() {
  if (filters.scanId && Number(filters.scanId) < 1) {
    error.value = 'ID скана должен быть положительным числом'
    return false
  }

  if (filters.hostId && Number(filters.hostId) < 1) {
    error.value = 'ID хоста должен быть положительным числом'
    return false
  }

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

function buildParams() {
  const params = {
    page: filters.page,
    size: filters.size,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  }

  if (filters.scanId) {
    params.scanId = Number(filters.scanId)
  }

  if (filters.hostId) {
    params.hostId = Number(filters.hostId)
  }

  if (filters.status) {
    params.status = filters.status
  }

  if (filters.from) {
    params.from = toIsoFromLocal(filters.from)
  }

  if (filters.to) {
    params.to = toIsoFromLocal(filters.to)
  }

  return params
}

async function loadScans() {
  loading.value = true
  error.value = ''

  try {
    const response = await searchAudits(buildParams())
    scans.value = response.items || []
    total.value = Number(response.total || 0)
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить историю сканов'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  if (!validateFilters()) {
    return
  }
  filters.page = 0
  loadScans()
}

function clearFilters() {
  filters.scanId = ''
  filters.hostId = ''
  filters.status = ''
  filters.from = toLocalInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  filters.to = toLocalInputValue(new Date())
  filters.sortBy = 'startedAt'
  filters.sortDir = 'DESC'
  filters.page = 0
  loadScans()
}

function nextPage() {
  if ((filters.page + 1) * filters.size < total.value) {
    filters.page += 1
    loadScans()
  }
}

function prevPage() {
  if (filters.page > 0) {
    filters.page -= 1
    loadScans()
  }
}

async function selectScan(scanId) {
  selectedScanId.value = scanId
  summaryLoading.value = true
  error.value = ''

  try {
    summary.value = await getAuditSummary(scanId)
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить сводку скана'
  } finally {
    summaryLoading.value = false
  }
}

onMounted(loadScans)

filters.to = toLocalInputValue(new Date())
filters.from = toLocalInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>История сканирований</h1>
      <p class="lead">Просмотр последних запусков аудита и сводка нарушений по каждому скану.</p>
    </div>

    <p v-if="error" class="inline-error">{{ error }}</p>

    <article class="surface-card">
      <div class="filters-row wrap">
        <label class="field-inline stacked">
          ID скана
          <input v-model="filters.scanId" type="number" min="1" placeholder="Например, 42" />
        </label>

        <label class="field-inline stacked">
          ID хоста
          <input v-model="filters.hostId" type="number" min="1" placeholder="Например, 1" />
        </label>

        <label class="field-inline stacked">
          Статус
          <select v-model="filters.status">
            <option value="">Все</option>
            <option value="RUNNING">RUNNING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
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
          Сортировать по
          <select v-model="filters.sortBy">
            <option v-for="option in sortByOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label class="field-inline stacked">
          Направление
          <select v-model="filters.sortDir">
            <option value="DESC">По убыванию</option>
            <option value="ASC">По возрастанию</option>
          </select>
        </label>

        <div class="filters-actions">
          <button class="primary-button" type="button" :disabled="loading" @click="applyFilters">
            Применить
          </button>
          <button class="ghost-button" type="button" :disabled="loading" @click="clearFilters">
            Сбросить
          </button>
        </div>
      </div>
    </article>

    <section class="content-grid single-mobile">
      <article class="surface-card">
        <div class="section-head">
          <h2>Сканы</h2>
          <button class="ghost-button" type="button" :disabled="loading" @click="loadScans">
            {{ loading ? 'Обновление...' : 'Обновить' }}
          </button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Хост</th>
                <th>Статус</th>
                <th>Нарушения</th>
                <th>Запущен</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="scan in scans" :key="scan.scanId">
                <td>#{{ scan.scanId }}</td>
                <td>{{ scan.hostId }}</td>
                <td>{{ scan.status }}</td>
                <td>{{ scan.totalViolations }}</td>
                <td>{{ formatDateTime(scan.startedAt) }}</td>
                <td>
                  <button class="mini-button" type="button" @click="selectScan(scan.scanId)">
                    Открыть сводку
                  </button>
                </td>
              </tr>
              <tr v-if="!scans.length && !loading">
                <td colspan="6">История сканов пока пуста</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pager-row">
          <button class="ghost-button" type="button" :disabled="filters.page === 0 || loading" @click="prevPage">
            Назад
          </button>
          <span>Страница {{ filters.page + 1 }} · Всего сканов: {{ total }}</span>
          <button
            class="ghost-button"
            type="button"
            :disabled="loading || (filters.page + 1) * filters.size >= total"
            @click="nextPage"
          >
            Вперед
          </button>
        </div>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>Сводка скана</h2>
          <span class="pill">{{ summaryLoading ? 'LOADING' : selectedScanId ? `#${selectedScanId}` : 'NONE' }}</span>
        </div>

        <div v-if="summary" class="summary-grid">
          <div class="summary-item">
            <span>Было проведено проверок</span>
            <strong>{{ summary.passedChecks }}</strong>
          </div>
          <div class="summary-item">
            <span>Проверок провалено</span>
            <strong>{{ summary.failedChecks }}</strong>
          </div>
          <div class="summary-item">
            <span>CRITICAL</span>
            <strong>{{ summary.criticalCount }}</strong>
          </div>
          <div class="summary-item">
            <span>HIGH</span>
            <strong>{{ summary.highCount }}</strong>
          </div>
          <div class="summary-item">
            <span>MEDIUM</span>
            <strong>{{ summary.mediumCount }}</strong>
          </div>
          <div class="summary-item">
            <span>LOW</span>
            <strong>{{ summary.lowCount }}</strong>
          </div>
        </div>

        <p v-else class="muted-block">Выберите скан из таблицы, чтобы увидеть детальную сводку.</p>
      </article>
    </section>
  </section>
</template>
