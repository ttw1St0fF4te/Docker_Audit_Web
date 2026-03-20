<script setup>
import { onMounted, ref } from 'vue'
import { getAuditSummary, getRecentAudits } from '../api/securityEngineer'

const loading = ref(false)
const summaryLoading = ref(false)
const error = ref('')
const scans = ref([])
const selectedScanId = ref(null)
const summary = ref(null)

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ru-RU')
}

async function loadScans() {
  loading.value = true
  error.value = ''

  try {
    const response = await getRecentAudits()
    scans.value = response.items || []
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить историю сканов'
  } finally {
    loading.value = false
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
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>История сканирований</h1>
      <p class="lead">Просмотр последних запусков аудита и сводка нарушений по каждому скану.</p>
    </div>

    <p v-if="error" class="inline-error">{{ error }}</p>

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
