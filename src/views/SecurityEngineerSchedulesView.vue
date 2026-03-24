<script setup>
import { onMounted, reactive, ref } from 'vue'
import { listHosts, listSchedules, runManualAudit, upsertSchedule } from '../api/securityEngineer'

const loading = ref(false)
const saving = ref(false)
const runningAudit = ref(false)
const error = ref('')
const success = ref('')
const fieldError = ref('')
const hosts = ref([])
const schedules = ref([])

const form = reactive({
  hostId: '',
  everyValue: 30,
  everyUnit: 'MINUTES',
  active: true,
})

const scheduleUnits = [
  { value: 'MINUTES', label: 'минут' },
  { value: 'HOURS', label: 'часов' },
  { value: 'DAYS', label: 'дней' },
]

function buildCronExpression() {
  const every = Number(form.everyValue)
  if (!Number.isInteger(every) || every < 1) {
    throw new Error('Интервал должен быть целым числом от 1')
  }

  if (form.everyUnit === 'MINUTES') {
    if (every > 59) {
      throw new Error('Для минут интервал должен быть от 1 до 59')
    }
    return `0 */${every} * * * *`
  }

  if (form.everyUnit === 'HOURS') {
    if (every > 24) {
      throw new Error('Для часов интервал должен быть от 1 до 24')
    }
    return `0 0 */${every} * * *`
  }

  if (every > 31) {
    throw new Error('Для дней интервал должен быть от 1 до 31')
  }
  return `0 0 0 */${every} * *`
}

function validateForm() {
  if (!form.hostId) {
    fieldError.value = 'Выберите Docker-хост'
    return false
  }

  const every = Number(form.everyValue)
  if (!Number.isInteger(every) || every < 1) {
    fieldError.value = 'Введите целое число от 1 в поле интервала'
    return false
  }

  if (form.everyUnit === 'MINUTES' && every > 59) {
    fieldError.value = 'Для минут допустим интервал от 1 до 59'
    return false
  }

  if (form.everyUnit === 'HOURS' && every > 24) {
    fieldError.value = 'Для часов допустим интервал от 1 до 24'
    return false
  }

  if (form.everyUnit === 'DAYS' && every > 31) {
    fieldError.value = 'Для дней допустим интервал от 1 до 31'
    return false
  }

  fieldError.value = ''
  return true
}

function describeCron(cronExpression) {
  if (!cronExpression) {
    return '-'
  }

  const normalized = cronExpression.trim().replaceAll(/\s+/g, ' ')
  const minuteMatch = normalized.match(/^0 \*\/(\d{1,2}) \* \* \* \*$/)
  if (minuteMatch) {
    return `Каждые ${minuteMatch[1]} мин.`
  }
  const hourMatch = normalized.match(/^0 0 \*\/(\d{1,2}) \* \* \*$/)
  if (hourMatch) {
    return `Каждые ${hourMatch[1]} ч.`
  }
  const dayMatch = normalized.match(/^0 0 0 \*\/(\d{1,2}) \* \*$/)
  if (dayMatch) {
    return `Каждые ${dayMatch[1]} дн.`
  }

  return normalized
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
    const [hostsData, schedulesData] = await Promise.all([
      listHosts({ page: 0, size: 200 }),
      listSchedules({ page: 0, size: 200 }),
    ])
    hosts.value = hostsData.items || []
    schedules.value = schedulesData.items || []

    if (!form.hostId && hosts.value.length) {
      form.hostId = String(hosts.value[0].id)
    }
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить расписания'
  } finally {
    loading.value = false
  }
}

async function submitSchedule() {
  if (!validateForm()) {
    return
  }

  saving.value = true
  success.value = ''
  error.value = ''

  try {
    const cronExpression = buildCronExpression()
    await upsertSchedule({
      hostId: Number(form.hostId),
      cronExpression,
      active: form.active,
    })
    success.value = 'Расписание сохранено'
    await loadData()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || requestError.message || 'Не удалось сохранить расписание'
  } finally {
    saving.value = false
  }
}

async function startAudit() {
  if (!form.hostId) {
    error.value = 'Выберите Docker-хост для запуска аудита'
    return
  }

  runningAudit.value = true
  success.value = ''
  error.value = ''

  try {
    const response = await runManualAudit(Number(form.hostId))
    success.value = `Скан #${response.scanId} запущен (${response.status})`
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось запустить аудит'
  } finally {
    runningAudit.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Расписания аудита и ручной запуск</h1>
      <p class="lead">Настройка интервала по хостам и запуск аудита вручную из того же экрана.</p>
    </div>

    <section class="content-grid single-mobile">
      <article class="surface-card">
        <div class="section-head">
          <h2>Настройки расписания</h2>
          <span class="pill">SCHEDULER</span>
        </div>

        <form class="form-grid" @submit.prevent="submitSchedule">
          <label class="field-inline stacked">
            Docker-хост
            <select v-model="form.hostId">
              <option value="" disabled>Выберите хост</option>
              <option v-for="host in hosts" :key="host.id" :value="String(host.id)">
                #{{ host.id }} · {{ host.name }}
              </option>
            </select>
          </label>

          <label class="field-inline stacked">
            Как часто запускать аудит
            <div class="schedule-interval-row">
              <input v-model.number="form.everyValue" type="number" min="1" @input="validateForm" />
              <select v-model="form.everyUnit">
                <option v-for="unit in scheduleUnits" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
              </select>
            </div>
          </label>

          <label class="check-row">
            <input v-model="form.active" type="checkbox" />
            Расписание активно
          </label>

          <div class="button-row">
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Сохранение...' : 'Сохранить расписание' }}
            </button>
            <button class="ghost-button" :disabled="runningAudit" type="button" @click="startAudit">
              {{ runningAudit ? 'Запуск...' : 'Запустить аудит вручную' }}
            </button>
          </div>
        </form>

        <p v-if="error" class="inline-error">{{ error }}</p>
        <p v-if="fieldError" class="inline-error">{{ fieldError }}</p>
        <p v-if="success" class="inline-success">{{ success }}</p>
        <p class="muted-block">Ручной запуск выполняется только для выбранного Docker host.</p>
      </article>

      <article class="surface-card">
        <div class="section-head">
          <h2>Текущие расписания</h2>
          <button class="ghost-button" type="button" :disabled="loading" @click="loadData">
            {{ loading ? 'Обновление...' : 'Обновить' }}
          </button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Хост</th>
                <th>Интервал</th>
                <th>Активно</th>
                <th>Последний запуск</th>
                <th>Следующий запуск</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in schedules" :key="item.id">
                <td>#{{ item.id }}</td>
                <td>{{ item.hostId }}</td>
                <td>{{ describeCron(item.cronExpression) }}</td>
                <td>{{ item.active ? 'Да' : 'Нет' }}</td>
                <td>{{ formatDateTime(item.lastRun) }}</td>
                <td>{{ formatDateTime(item.nextRun) }}</td>
              </tr>
              <tr v-if="!schedules.length && !loading">
                <td colspan="6">Расписаний пока нет</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </section>
</template>
