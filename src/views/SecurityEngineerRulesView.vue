<script setup>
import { onMounted, reactive, ref } from 'vue'
import { listRules, patchRuleEnabled } from '../api/securityEngineer'

const loading = ref(false)
const updatingRuleId = ref(null)
const error = ref('')
const payload = ref({ items: [], total: 0, page: 0, size: 20 })

const filters = reactive({
  page: 0,
  size: 20,
  severity: '',
  enabled: '',
})

const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function buildParams() {
  const params = {
    page: filters.page,
    size: filters.size,
  }

  if (filters.severity) {
    params.severity = filters.severity
  }

  if (filters.enabled !== '') {
    params.enabled = filters.enabled === 'true'
  }

  return params
}

async function loadRules() {
  loading.value = true
  error.value = ''

  try {
    const response = await listRules(buildParams())
    const sortedItems = [...(response.items || [])].sort((a, b) =>
      String(a.cisCode || '').localeCompare(String(b.cisCode || ''), 'en', { numeric: true, sensitivity: 'base' }),
    )
    payload.value = { ...response, items: sortedItems }
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось загрузить CIS-правила'
  } finally {
    loading.value = false
  }
}

async function toggleRule(rule) {
  updatingRuleId.value = rule.id
  error.value = ''

  try {
    await patchRuleEnabled(rule.id, !rule.enabled)
    await loadRules()
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Не удалось обновить статус правила'
  } finally {
    updatingRuleId.value = null
  }
}

function nextPage() {
  const nextOffset = (filters.page + 1) * filters.size
  if (nextOffset < payload.value.total) {
    filters.page += 1
    loadRules()
  }
}

function prevPage() {
  if (filters.page > 0) {
    filters.page -= 1
    loadRules()
  }
}

onMounted(loadRules)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Конфигурация CIS-правил</h1>
      <p class="lead">Просматривайте правила и включайте или отключайте их без перезапуска сервиса.</p>
    </div>

    <article class="surface-card">
      <div class="filters-row">
        <label class="field-inline">
          Уровень
          <select v-model="filters.severity" @change="filters.page = 0; loadRules()">
            <option value="">Все</option>
            <option v-for="item in severities" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="field-inline">
          Статус
          <select v-model="filters.enabled" @change="filters.page = 0; loadRules()">
            <option value="">Все</option>
            <option value="true">Только включенные</option>
            <option value="false">Только отключенные</option>
          </select>
        </label>

        <button class="ghost-button" type="button" :disabled="loading" @click="loadRules">
          {{ loading ? 'Обновление...' : 'Обновить список' }}
        </button>
      </div>

      <p v-if="error" class="inline-error">{{ error }}</p>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Название</th>
              <th>Уровень</th>
              <th>Рекомендация</th>
              <th>Состояние</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in payload.items" :key="rule.id">
              <td>{{ rule.cisCode }}</td>
              <td>
                <strong>{{ rule.name }}</strong>
                <p class="muted-cell">{{ rule.description }}</p>
              </td>
              <td>{{ rule.severity }}</td>
              <td class="muted-cell">{{ rule.recommendation }}</td>
              <td>
                <button
                  class="mini-button"
                  :class="rule.enabled ? 'mini-button--on' : 'mini-button--off'"
                  :disabled="updatingRuleId === rule.id"
                  @click="toggleRule(rule)"
                >
                  {{ rule.enabled ? 'Вкл' : 'Выкл' }}
                </button>
              </td>
            </tr>
            <tr v-if="!payload.items.length && !loading">
              <td colspan="5">По выбранным фильтрам правил не найдено</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="payload.total > filters.size" class="pager-row">
        <button class="ghost-button" type="button" :disabled="filters.page === 0 || loading" @click="prevPage">
          Назад
        </button>
        <span>Страница {{ filters.page + 1 }} · Всего: {{ payload.total }}</span>
        <button
          class="ghost-button"
          type="button"
          :disabled="loading || (filters.page + 1) * filters.size >= payload.total"
          @click="nextPage"
        >
          Вперед
        </button>
      </div>
    </article>
  </section>
</template>
