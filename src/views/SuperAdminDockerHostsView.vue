<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createHost,
  hardDeleteHost,
  listHosts,
  restoreHost,
  softDeleteHost,
  testHostConnection,
  updateHost,
} from '../api/admin'

const loading = ref(false)
const saving = ref(false)
const testingConnection = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const createModalError = ref('')
const createModalSuccess = ref('')
const editModalError = ref('')
const hosts = ref([])
const total = ref(0)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedHostForActions = ref(null)

const filters = reactive({
  page: 0,
  size: 20,
  activeOnly: false,
  deletedOnly: false,
})

const createForm = reactive({
  name: '',
  baseUrl: '',
  hostType: 'LOCAL_SOCKET',
  tlsEnabled: false,
  authType: '',
  certPath: '',
  active: true,
})

const editForm = reactive({
  id: null,
  name: '',
  baseUrl: '',
  hostType: 'LOCAL_SOCKET',
  tlsEnabled: false,
  authType: '',
  certPath: '',
  active: true,
})

function buildParams() {
  const params = { page: filters.page, size: filters.size }

  if (filters.activeOnly) {
    params.active = true
  }
  if (filters.deletedOnly) {
    params.deleted = true
  }

  return params
}

async function loadHosts() {
  loading.value = true
  pageError.value = ''

  try {
    const data = await listHosts(buildParams())
    hosts.value = data.items || []
    total.value = Number(data.total || 0)
  } catch (requestError) {
    pageError.value = requestError.response?.data?.message || 'Не удалось загрузить Docker хосты'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  createModalError.value = ''
  createModalSuccess.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  createModalError.value = ''
  createModalSuccess.value = ''
  showCreateModal.value = false
}

function closeEditModal() {
  editModalError.value = ''
  showEditModal.value = false
}

async function submitCreate() {
  saving.value = true
  createModalError.value = ''
  createModalSuccess.value = ''
  pageSuccess.value = ''

  try {
    await createHost({
      ...createForm,
      authType: createForm.authType || null,
      certPath: createForm.certPath || null,
    })
    pageSuccess.value = 'Docker хост создан'
    createForm.name = ''
    createForm.baseUrl = ''
    createForm.hostType = 'LOCAL_SOCKET'
    createForm.tlsEnabled = false
    createForm.authType = ''
    createForm.certPath = ''
    createForm.active = true
    closeCreateModal()
    await loadHosts()
  } catch (requestError) {
    createModalError.value = requestError.response?.data?.message || 'Не удалось создать Docker хост'
  } finally {
    saving.value = false
  }
}

async function runConnectionTest() {
  testingConnection.value = true
  createModalError.value = ''
  createModalSuccess.value = ''

  try {
    const response = await testHostConnection({
      baseUrl: createForm.baseUrl,
      hostType: createForm.hostType,
    })
    createModalSuccess.value = response.message || 'Проверка подключения выполнена успешно'
  } catch (requestError) {
    createModalError.value = requestError.response?.data?.message || 'Не удалось проверить подключение'
  } finally {
    testingConnection.value = false
  }
}

function selectForEdit(host) {
  editForm.id = host.id
  editForm.name = host.name
  editForm.baseUrl = host.baseUrl
  editForm.hostType = host.hostType
  editForm.tlsEnabled = host.tlsEnabled
  editForm.authType = host.authType || ''
  editForm.certPath = host.certPath || ''
  editForm.active = host.active
  editModalError.value = ''
  showEditModal.value = true
}

function openActions(host) {
  selectedHostForActions.value = host
}

function closeActions() {
  selectedHostForActions.value = null
}

async function submitEdit() {
  if (!editForm.id) {
    return
  }

  saving.value = true
  editModalError.value = ''
  pageSuccess.value = ''

  try {
    await updateHost(editForm.id, {
      name: editForm.name,
      baseUrl: editForm.baseUrl,
      hostType: editForm.hostType,
      tlsEnabled: Boolean(editForm.tlsEnabled),
      authType: editForm.authType || null,
      certPath: editForm.certPath || null,
      active: Boolean(editForm.active),
    })
    pageSuccess.value = 'Docker хост обновлен'
    closeEditModal()
    await loadHosts()
  } catch (requestError) {
    editModalError.value = requestError.response?.data?.message || 'Не удалось обновить Docker хост'
  } finally {
    saving.value = false
  }
}

async function doSoftDelete(host) {
  closeActions()
  await executeHostAction(() => softDeleteHost(host.id), 'Docker хост помечен как удаленный')
}

async function doHardDelete(host) {
  closeActions()
  const confirmed = window.confirm(`Физически удалить Docker хост ${host.name}?`)
  if (!confirmed) {
    return
  }
  await executeHostAction(() => hardDeleteHost(host.id), 'Docker хост удален физически')
}

async function doRestore(host) {
  closeActions()
  await executeHostAction(() => restoreHost(host.id), 'Docker хост восстановлен')
}

async function executeHostAction(action, successMessage) {
  saving.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    await action()
    pageSuccess.value = successMessage
    await loadHosts()
  } catch (requestError) {
    pageError.value = requestError.response?.data?.message || 'Операция завершилась ошибкой'
  } finally {
    saving.value = false
  }
}

function applyFilters() {
  filters.page = 0
  loadHosts()
}

function clearFilters() {
  filters.activeOnly = false
  filters.deletedOnly = false
  filters.page = 0
  loadHosts()
}

function nextPage() {
  if ((filters.page + 1) * filters.size < total.value) {
    filters.page += 1
    loadHosts()
  }
}

function prevPage() {
  if (filters.page > 0) {
    filters.page -= 1
    loadHosts()
  }
}

onMounted(loadHosts)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Docker хосты</h1>
      <p class="lead">Управление endpoint-ами Docker и их состоянием.</p>
    </div>

    <p v-if="pageError" class="inline-error">{{ pageError }}</p>
    <p v-if="pageSuccess" class="inline-success">{{ pageSuccess }}</p>

    <article class="surface-card">
      <div class="filters-row wrap">
        <label class="check-row filter-check">
          <input v-model="filters.activeOnly" type="checkbox" />
          Только активные
        </label>

        <label class="check-row filter-check">
          <input v-model="filters.deletedOnly" type="checkbox" />
          Только удаленные
        </label>

        <div class="filters-actions">
          <button class="primary-button" type="button" :disabled="loading" @click="applyFilters">Применить</button>
          <button class="ghost-button" type="button" :disabled="loading" @click="clearFilters">Сбросить</button>
        </div>
      </div>
    </article>

    <article class="surface-card">
      <div class="section-head">
        <h2>Список Docker хостов</h2>
        <div class="section-head-actions">
          <span class="pill">{{ loading ? 'LOADING' : `Всего: ${total}` }}</span>
          <button class="ghost-button" type="button" @click="openCreateModal">Добавить новый хост</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table data-table--compact">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Endpoint</th>
              <th>Тип</th>
              <th>TLS</th>
              <th>Активен</th>
              <th>Удален</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="host in hosts" :key="host.id">
              <td>#{{ host.id }}</td>
              <td>{{ host.name }}</td>
              <td>{{ host.baseUrl }}</td>
              <td>{{ host.hostType }}</td>
              <td>{{ host.tlsEnabled ? 'Да' : 'Нет' }}</td>
              <td>{{ host.active ? 'Да' : 'Нет' }}</td>
              <td>{{ host.deleted ? 'Да' : 'Нет' }}</td>
              <td>
                <button class="row-actions-trigger" type="button" @click="openActions(host)">...</button>
              </td>
            </tr>
            <tr v-if="!hosts.length && !loading">
              <td colspan="8">Docker хосты не найдены</td>
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

    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <article class="modal-card">
        <div class="section-head">
          <h2>Создание Docker хоста</h2>
          <button class="ghost-button" type="button" @click="closeCreateModal">Закрыть</button>
        </div>
        <p v-if="createModalError" class="inline-error">{{ createModalError }}</p>
        <p v-if="createModalSuccess" class="inline-success">{{ createModalSuccess }}</p>
        <form class="form-grid" @submit.prevent="submitCreate">
          <label class="field-inline stacked">Название<input v-model="createForm.name" type="text" placeholder="Локальный Docker" /></label>
          <label class="field-inline stacked">Endpoint<input v-model="createForm.baseUrl" type="text" placeholder="tcp://127.0.0.1:2375" /></label>
          <label class="field-inline stacked">Тип хоста
            <select v-model="createForm.hostType">
              <option value="LOCAL_SOCKET">LOCAL_SOCKET</option>
              <option value="REMOTE_TCP">REMOTE_TCP</option>
            </select>
          </label>
          <label class="field-inline stacked">TLS
            <select v-model="createForm.tlsEnabled">
              <option :value="true">Включен</option>
              <option :value="false">Выключен</option>
            </select>
          </label>
          <label class="field-inline stacked">Тип авторизации<input v-model="createForm.authType" type="text" placeholder="NONE / BASIC / MTLS" /></label>
          <label class="field-inline stacked">Путь к сертификату<input v-model="createForm.certPath" type="text" placeholder="/etc/docker/certs/client.pem" /></label>
          <label class="field-inline stacked">Активность
            <select v-model="createForm.active">
              <option :value="true">Активен</option>
              <option :value="false">Неактивен</option>
            </select>
          </label>
          <button class="ghost-button" :disabled="testingConnection || saving" type="button" @click="runConnectionTest">
            {{ testingConnection ? 'Проверка...' : 'Проверить соединение' }}
          </button>
          <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Сохранение...' : 'Создать хост' }}</button>
        </form>
      </article>
    </div>

    <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <article class="modal-card">
        <div class="section-head">
          <h2>Редактирование Docker хоста</h2>
          <button class="ghost-button" type="button" @click="closeEditModal">Закрыть</button>
        </div>
        <p v-if="editModalError" class="inline-error">{{ editModalError }}</p>
        <form class="form-grid" @submit.prevent="submitEdit">
          <p class="muted-block">ID: {{ editForm.id || '-' }}</p>
          <label class="field-inline stacked">Название<input v-model="editForm.name" type="text" placeholder="Локальный Docker" /></label>
          <label class="field-inline stacked">Endpoint<input v-model="editForm.baseUrl" type="text" placeholder="tcp://127.0.0.1:2375" /></label>
          <label class="field-inline stacked">Тип хоста
            <select v-model="editForm.hostType">
              <option value="LOCAL_SOCKET">LOCAL_SOCKET</option>
              <option value="REMOTE_TCP">REMOTE_TCP</option>
            </select>
          </label>
          <label class="field-inline stacked">TLS
            <select v-model="editForm.tlsEnabled">
              <option :value="true">Включен</option>
              <option :value="false">Выключен</option>
            </select>
          </label>
          <label class="field-inline stacked">Тип авторизации<input v-model="editForm.authType" type="text" placeholder="NONE / BASIC / MTLS" /></label>
          <label class="field-inline stacked">Путь к сертификату<input v-model="editForm.certPath" type="text" placeholder="/etc/docker/certs/client.pem" /></label>
          <label class="field-inline stacked">Активность
            <select v-model="editForm.active">
              <option :value="true">Активен</option>
              <option :value="false">Неактивен</option>
            </select>
          </label>
          <button class="primary-button" :disabled="saving || !editForm.id" type="submit">{{ saving ? 'Сохранение...' : 'Сохранить изменения' }}</button>
        </form>
      </article>
    </div>

    <div v-if="selectedHostForActions" class="modal-backdrop" @click.self="closeActions">
      <article class="modal-card modal-card--actions">
        <div class="section-head">
          <h2>Действия с Docker хостом</h2>
          <button class="ghost-button" type="button" @click="closeActions">Закрыть</button>
        </div>
        <p class="muted-block">{{ selectedHostForActions.name }} · {{ selectedHostForActions.baseUrl }}</p>
        <div class="row-actions-list row-actions-list--modal">
          <button class="mini-button" type="button" @click="selectForEdit(selectedHostForActions); closeActions()">Редактировать</button>
          <button class="mini-button" type="button" :disabled="!selectedHostForActions.deleted" @click="doRestore(selectedHostForActions)">Восстановить</button>
          <button class="mini-button" type="button" :disabled="selectedHostForActions.deleted" @click="doSoftDelete(selectedHostForActions)">Мягкое удаление</button>
          <button class="mini-button danger" type="button" @click="doHardDelete(selectedHostForActions)">Физическое удаление</button>
        </div>
      </article>
    </div>
  </section>
</template>
