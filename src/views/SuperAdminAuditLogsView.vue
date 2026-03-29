<script setup>
import { onMounted, reactive, ref } from 'vue'
import { exportAuditLogsCsv, listAuditLogs, listAuditTableNames } from '../api/admin'

const loading = ref(false)
const exporting = ref(false)
const error = ref('')
const logs = ref([])
const total = ref(0)
const selectedLog = ref(null)

const tableOptions = ref([{ value: '', label: 'Все таблицы' }])

const operationOptions = [
  { value: '', label: 'Все операции' },
  { value: 'INSERT', label: 'INSERT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
]

const filters = reactive({
  page: 0,
  size: 20,
  tableName: '',
  operation: '',
  changedBy: '',
  requestId: '',
  from: '',
  to: '',
})

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toIsoFromLocal(localValue) {
  if (!localValue) {
    return ''
  }
  const normalized = localValue.length === 16 ? `${localValue}:00` : localValue
  return `${normalized}Z`
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU', { timeZone: 'UTC' })
}

function formatDate(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleDateString('ru-RU', { timeZone: 'UTC' })
}

function openDetails(item) {
  selectedLog.value = item
}

function closeDetails() {
  selectedLog.value = null
}

function validateFilters() {
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
  }

  if (filters.tableName) {
    params.tableName = filters.tableName
  }
  if (filters.operation) {
    params.operation = filters.operation
  }
  if (filters.changedBy.trim()) {
    params.changedBy = filters.changedBy.trim()
  }
  if (filters.requestId.trim()) {
    params.requestId = filters.requestId.trim()
  }
  if (filters.from) {
    params.from = toIsoFromLocal(filters.from)
  }
  if (filters.to) {
    params.to = toIsoFromLocal(filters.to)
  }

  return params
}

async function loadLogs() {
  loading.value = true
  error.value = ''

  if (!validateFilters()) {
    loading.value = false
    return
  }

  try {
    const data = await listAuditLogs(buildParams())
    logs.value = data.items || []
    total.value = Number(data.total || 0)
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить аудит-лог'
  } finally {
    loading.value = false
  }
}

async function loadTableOptions() {
  try {
    const tableNames = await listAuditTableNames()
    tableOptions.value = [{ value: '', label: 'Все таблицы' }, ...(tableNames || []).map((name) => ({ value: name, label: name }))]
  } catch {
    tableOptions.value = [{ value: '', label: 'Все таблицы' }]
  }
}

async function exportCsv() {
  if (!validateFilters()) {
    return
  }

  exporting.value = true
  error.value = ''

  try {
    await exportAuditLogsCsv({ ...buildParams(), limit: 500 })
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось экспортировать CSV'
  } finally {
    exporting.value = false
  }
}

function applyFilters() {
  filters.page = 0
  loadLogs()
}

function clearFilters() {
  filters.tableName = ''
  filters.operation = ''
  filters.changedBy = ''
  filters.requestId = ''
  filters.from = toLocalInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  filters.to = toLocalInputValue(new Date())
  filters.page = 0
  loadLogs()
}

function showByRequestId(requestId) {
  filters.requestId = String(requestId || '').trim()
  filters.page = 0
  closeDetails()
  loadLogs()
}

function nextPage() {
  if ((filters.page + 1) * filters.size < total.value) {
    filters.page += 1
    loadLogs()
  }
}

function prevPage() {
  if (filters.page > 0) {
    filters.page -= 1
    loadLogs()
  }
}

onMounted(() => {
  filters.to = toLocalInputValue(new Date())
  filters.from = toLocalInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  loadTableOptions()
  loadLogs()
})
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Аудит-лог</h1>
      <p class="lead">Просмотр изменений в таблицах с фильтрами и экспортом в CSV.</p>
    </div>

    <p v-if="error" class="inline-error">{{ error }}</p>

    <article class="surface-card">
      <div class="filters-row wrap">
        <label class="field-inline stacked">
          Таблица
          <select v-model="filters.tableName">
            <option v-for="option in tableOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label class="field-inline stacked">
          Операция
          <select v-model="filters.operation">
            <option v-for="option in operationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>

        <label class="field-inline stacked">
          Кто изменил
          <input v-model="filters.changedBy" type="text" placeholder="Например, admin" />
        </label>

        <label class="field-inline stacked">
          Период с
          <input v-model="filters.from" type="datetime-local" />
        </label>

        <label class="field-inline stacked">
          Период по
          <input v-model="filters.to" type="datetime-local" />
        </label>

        <div class="filters-actions">
          <button class="primary-button" type="button" :disabled="loading" @click="applyFilters">Применить</button>
          <button class="ghost-button" type="button" :disabled="loading" @click="clearFilters">Сбросить</button>
          <button class="ghost-button" type="button" :disabled="exporting" @click="exportCsv">
            {{ exporting ? 'Экспорт...' : 'Экспорт CSV' }}
          </button>
        </div>
      </div>

      <div v-if="filters.requestId" class="active-filter-line">
        <span class="pill">Фильтр request_id: {{ filters.requestId }}</span>
        <button class="ghost-button" type="button" @click="filters.requestId = ''; applyFilters()">Снять фильтр request_id</button>
      </div>
    </article>

    <article class="surface-card">
      <div class="section-head">
        <h2>Записи аудита</h2>
        <span class="pill">{{ loading ? 'LOADING' : `Всего: ${total}` }}</span>
      </div>

      <div class="table-wrap">
        <table class="data-table data-table--compact">
          <thead>
            <tr>
              <th>ID</th>
              <th>Таблица</th>
              <th>Операция</th>
              <th>Кто изменил</th>
              <th>Дата изменения</th>
              <th>Дата</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in logs" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.tableName }}</td>
              <td>{{ item.operation }}</td>
              <td>{{ item.changedBy }}</td>
              <td>{{ formatDateTime(item.changedAt) }}</td>
              <td>{{ formatDate(item.changedAt) }}</td>
              <td>
                <button class="mini-button" type="button" @click="openDetails(item)">Детали</button>
              </td>
            </tr>
            <tr v-if="!logs.length && !loading">
              <td colspan="7">Записи не найдены</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager-row">
        <button class="ghost-button" type="button" :disabled="filters.page === 0 || loading" @click="prevPage">Назад</button>
        <span>Страница {{ filters.page + 1 }}</span>
        <button class="ghost-button" type="button" :disabled="loading || (filters.page + 1) * filters.size >= total" @click="nextPage">Вперед</button>
      </div>
    </article>

    <div v-if="selectedLog" class="modal-backdrop" @click.self="closeDetails">
      <article class="modal-card modal-card--wide">
        <div class="section-head">
          <h2>Детали записи аудита</h2>
          <button class="ghost-button" type="button" @click="closeDetails">Закрыть</button>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <span>Таблица</span>
            <strong>{{ selectedLog.tableName || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span>Операция</span>
            <strong>{{ selectedLog.operation || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span>Кто изменил</span>
            <strong>{{ selectedLog.changedBy || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span>request_id</span>
            <strong>{{ selectedLog.requestId || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span>record_pk</span>
            <strong>{{ selectedLog.recordPk || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span>Дата изменения</span>
            <strong>{{ formatDateTime(selectedLog.changedAt) }}</strong>
          </div>
        </div>

        <div class="button-row top-gap">
          <button
            class="ghost-button"
            type="button"
            :disabled="!selectedLog.requestId"
            @click="showByRequestId(selectedLog.requestId)"
          >
            Показать записи с этим request_id
          </button>
        </div>

        <div class="audit-json-grid">
          <section class="surface-card">
            <h3>before_json</h3>
            <pre class="json-block">{{ selectedLog.beforeJson || '-' }}</pre>
          </section>
          <section class="surface-card">
            <h3>after_json</h3>
            <pre class="json-block">{{ selectedLog.afterJson || '-' }}</pre>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>
