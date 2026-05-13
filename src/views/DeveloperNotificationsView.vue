<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getNotification,
  getScanViolations,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/developer'

const tabs = [
  { value: 'UNREAD', label: 'Новые' },
  { value: 'READ', label: 'Прочитанные' },
  { value: 'ALL', label: 'Все' },
]

const activeTab = ref('UNREAD')
const notifications = ref([])
const loading = ref(false)
const detailsLoading = ref(false)
const markAllLoading = ref(false)
const error = ref('')
const success = ref('')

const selectedNotification = ref(null)
const selectedViolationDetails = ref(null)
const selectedActionNotification = ref(null)

const scanType = computed(() => selectedNotification.value?.scanType || 'CIS')
const isCve = computed(() => scanType.value === 'CVE')

const totalLabel = computed(() => (isCve.value ? 'Всего уязвимостей' : 'Всего нарушений'))
const affectedLabel = computed(() => (isCve.value ? 'Затронуто образов' : 'Затронуто контейнеров'))
const emptyLabel = computed(() =>
  isCve.value
    ? 'Детали уязвимостей недоступны для этого scanId.'
    : 'Детальные нарушения недоступны для этого scanId.'
)

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
}

function notificationSummary(item) {
  return item.summary || item.message || '-'
}

async function loadNotifications() {
  loading.value = true
  error.value = ''

  try {
    const data = await listNotifications({
      status: activeTab.value,
      page: 0,
      size: 100,
    })
    notifications.value = data.items || []
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить уведомления'
  } finally {
    loading.value = false
  }
}

async function openDetails(item) {
  detailsLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const detailed = await getNotification(item.id)
    selectedNotification.value = detailed

    if (!detailed.isRead) {
      await markNotificationRead(detailed.id)
      await loadNotifications()
    }

    const scanData = await getScanViolations(detailed.scanId, detailed.scanType || 'CIS')
    selectedViolationDetails.value = scanData
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось открыть детали уведомления'
  } finally {
    detailsLoading.value = false
  }
}

async function markSingleRead(item) {
  error.value = ''
  success.value = ''

  try {
    await markNotificationRead(item.id)
    success.value = 'Уведомление помечено как прочитанное'
    await loadNotifications()

    if (selectedNotification.value?.id === item.id) {
      selectedNotification.value = await getNotification(item.id)
    }
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось пометить уведомление как прочитанное'
  }
}

function openActions(item) {
  selectedActionNotification.value = item
}

function closeActions() {
  selectedActionNotification.value = null
}

async function openDetailsFromActions() {
  if (!selectedActionNotification.value) {
    return
  }
  const item = selectedActionNotification.value
  closeActions()
  await openDetails(item)
}

async function markReadFromActions() {
  if (!selectedActionNotification.value) {
    return
  }
  const item = selectedActionNotification.value
  closeActions()
  await markSingleRead(item)
}

async function markAllRead() {
  markAllLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const data = await markAllNotificationsRead()
    success.value = `Прочитано уведомлений: ${data.updatedCount}`
    await loadNotifications()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось пометить все уведомления как прочитанные'
  } finally {
    markAllLoading.value = false
  }
}

function resetDetails() {
  selectedNotification.value = null
  selectedViolationDetails.value = null
}

onMounted(loadNotifications)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Уведомления разработчика</h1>
      <p class="lead">Полученные уведомления по сканам и детали нарушений с рекомендациями.</p>
    </div>

    <section class="surface-card">
      <div class="filters-row wrap">
        <div class="button-row wrap-inline">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="ghost-button"
            type="button"
            :disabled="loading"
            :class="{ 'ghost-button--active': activeTab === tab.value }"
            @click="activeTab = tab.value; loadNotifications()"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="button-row wrap-inline">
          <button class="ghost-button" type="button" :disabled="loading" @click="loadNotifications">
            {{ loading ? 'Загрузка...' : 'Обновить' }}
          </button>
          <button class="primary-button" type="button" :disabled="markAllLoading" @click="markAllRead">
            {{ markAllLoading ? 'Применение...' : 'Прочитать все' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="inline-error panel-message">{{ error }}</p>
      <p v-if="success" class="inline-success panel-message">{{ success }}</p>

      <div class="table-wrap">
        <table class="data-table data-table--compact">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Создано</th>
              <th>Заголовок</th>
              <th>Summary</th>
              <th>Уровень</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in notifications" :key="item.id">
              <td class="nowrap-cell">#{{ item.id }}</td>
              <td class="nowrap-cell"><span class="pill">{{ item.scanType || 'CIS' }}</span></td>
              <td>{{ formatDateTime(item.createdAt) }}</td>
              <td>{{ item.title }}</td>
              <td>{{ notificationSummary(item) }}</td>
              <td class="nowrap-cell">{{ item.severity }}</td>
              <td class="nowrap-cell">{{ item.isRead ? 'Прочитано' : 'Новое' }}</td>
              <td class="nowrap-cell">
                <button class="ghost-button" type="button" :disabled="detailsLoading" @click="openActions(item)">
                  ...
                </button>
              </td>
            </tr>
            <tr v-if="!notifications.length">
              <td colspan="8" class="muted-cell">Для выбранного фильтра уведомлений нет.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="selectedActionNotification" class="modal-backdrop" @click.self="closeActions">
      <article class="modal-card modal-card--actions">
        <div class="section-head">
          <h2>Действия с уведомлением #{{ selectedActionNotification.id }}</h2>
          <button class="ghost-button" type="button" @click="closeActions">Закрыть</button>
        </div>

        <div class="row-actions-list row-actions-list--modal">
          <button class="ghost-button" type="button" :disabled="detailsLoading" @click="openDetailsFromActions">
            Открыть детали
          </button>
          <button
            v-if="!selectedActionNotification.isRead"
            class="ghost-button"
            type="button"
            :disabled="detailsLoading"
            @click="markReadFromActions"
          >
            Пометить как прочитанное
          </button>
        </div>
      </article>
    </div>

    <section v-if="selectedNotification" class="surface-card">
      <div class="section-head">
        <h2>Детали уведомления #{{ selectedNotification.id }}</h2>
        <button class="ghost-button" type="button" @click="resetDetails">Скрыть</button>
      </div>

      <p class="muted-block">
        scanId: #{{ selectedNotification.scanId }} · Тип: {{ selectedNotification.scanType || 'CIS' }} · createdAt: {{ formatDateTime(selectedNotification.createdAt) }}
      </p>
      <p class="muted-block">{{ notificationSummary(selectedNotification) }}</p>

      <div v-if="detailsLoading" class="muted-block">Загрузка деталей...</div>

      <template v-else-if="selectedViolationDetails">
        <div class="summary-grid">
          <div class="summary-item">
            <span>{{ totalLabel }}</span>
            <strong>{{ selectedViolationDetails.summary?.totalViolations || 0 }}</strong>
          </div>
          <div class="summary-item">
            <span>{{ affectedLabel }}</span>
            <strong>{{ selectedViolationDetails.summary?.affectedContainers || 0 }}</strong>
          </div>
          <div class="summary-item">
            <span>CRITICAL</span>
            <strong>{{ selectedViolationDetails.summary?.criticalCount || 0 }}</strong>
          </div>
          <div class="summary-item">
            <span>HIGH</span>
            <strong>{{ selectedViolationDetails.summary?.highCount || 0 }}</strong>
          </div>
        </div>

        <p v-if="!selectedViolationDetails.detailsAvailable" class="inline-error details-fallback">
          {{ selectedViolationDetails.detailsMessage }}
        </p>

        <div class="table-wrap">
          <table class="data-table data-table--compact details-table">
            <thead>
              <tr>
                <th class="col-time">Время</th>
                <th class="col-host">Хост</th>
                <th class="col-container">{{ isCve ? 'Образ' : 'Контейнер' }}</th>
                <th class="col-rule">{{ isCve ? 'Уязвимость' : 'Rule' }}</th>
                <th class="col-severity">Severity</th>
                <th class="col-advisory">{{ isCve ? 'Advisory' : 'Рекомендация' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(violation, idx) in selectedViolationDetails.violations || []"
                :key="`${violation.hostId}-${violation.container}-${violation.ruleCode}-${idx}`"
              >
                <td class="col-time">{{ formatDateTime(violation.timestamp) }}</td>
                <td class="col-host">{{ violation.hostId }}</td>
                <td class="col-container">{{ violation.container }}</td>
                <td class="col-rule">{{ violation.ruleCode }} · {{ violation.ruleTitle }}</td>
                <td class="col-severity">{{ violation.severity }}</td>
                <td class="col-advisory">{{ violation.recommendation }}</td>
              </tr>
              <tr v-if="!(selectedViolationDetails.violations || []).length">
                <td colspan="6" class="muted-cell">{{ emptyLabel }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </section>
</template>

<style scoped>
.panel-message {
  margin-top: 10px;
}

.compact-actions {
  gap: 6px;
}

.details-fallback {
  margin-top: 12px;
  margin-bottom: 6px;
}

.ghost-button--active {
  border-color: #178d82;
  background: rgba(23, 141, 130, 0.12);
}

.nowrap-cell {
  white-space: nowrap;
}

.details-table th {
  white-space: nowrap;
}

.details-table td {
  vertical-align: top;
}

.details-table .col-time,
.details-table .col-host,
.details-table .col-severity {
  white-space: nowrap;
}

.details-table .col-host {
  text-align: center;
  min-width: 40px;
}

.details-table .col-severity {
  text-align: center;
  min-width: 70px;
}

.details-table .col-rule,
.details-table .col-advisory {
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 180px;
  max-width: 400px;
}

.details-table .col-container {
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 100px;
  max-width: 200px;
}
</style>
