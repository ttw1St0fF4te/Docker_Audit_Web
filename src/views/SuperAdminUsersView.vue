<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  createUser,
  deleteUser,
  initiateUserPasswordReset,
  listUsers,
  restoreUser,
  updateUser,
} from '../api/admin'

const loading = ref(false)
const saving = ref(false)
const pageError = ref('')
const pageSuccess = ref('')
const createModalError = ref('')
const editModalError = ref('')
const users = ref([])
const total = ref(0)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUserForActions = ref(null)

const filters = reactive({
  page: 0,
  size: 20,
  search: '',
  role: '',
  enabledOnly: false,
  deletedOnly: false,
})

const createForm = reactive({
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  role: 'DEVELOPER',
})

const editForm = reactive({
  id: null,
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  role: 'DEVELOPER',
})

function buildParams() {
  const params = {
    page: filters.page,
    size: filters.size,
  }

  if (filters.search.trim()) {
    params.search = filters.search.trim()
  }
  if (filters.role) {
    params.role = filters.role
  }
  if (filters.enabledOnly) {
    params.enabled = true
  }
  if (filters.deletedOnly) {
    params.deleted = true
  }

  return params
}

async function loadUsers() {
  loading.value = true
  pageError.value = ''

  try {
    const data = await listUsers(buildParams())
    users.value = data.items || []
    total.value = Number(data.total || 0)
  } catch (requestError) {
    pageError.value = requestError.response?.data?.message || 'Не удалось загрузить пользователей'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  createModalError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  createModalError.value = ''
  showCreateModal.value = false
}

function closeEditModal() {
  editModalError.value = ''
  showEditModal.value = false
}

async function submitCreate() {
  saving.value = true
  createModalError.value = ''
  pageSuccess.value = ''

  try {
    const data = await createUser(createForm)
    pageSuccess.value = data.message || 'Пользователь создан'
    createForm.email = ''
    createForm.username = ''
    createForm.firstName = ''
    createForm.lastName = ''
    createForm.role = 'DEVELOPER'
    closeCreateModal()
    await loadUsers()
  } catch (requestError) {
    createModalError.value = requestError.response?.data?.message || 'Не удалось создать пользователя'
  } finally {
    saving.value = false
  }
}

function selectForEdit(user) {
  editForm.id = user.id
  editForm.email = user.email
  editForm.username = user.username
  editForm.firstName = user.firstName
  editForm.lastName = user.lastName
  editForm.role = user.role
  editModalError.value = ''
  showEditModal.value = true
}

function openActions(user) {
  selectedUserForActions.value = user
}

function closeActions() {
  selectedUserForActions.value = null
}

async function submitEdit() {
  if (!editForm.id) {
    return
  }

  saving.value = true
  editModalError.value = ''
  pageSuccess.value = ''

  try {
    await updateUser(editForm.id, {
      email: editForm.email,
      username: editForm.username,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      role: editForm.role,
    })
    pageSuccess.value = 'Пользователь обновлен'
    closeEditModal()
    await loadUsers()
  } catch (requestError) {
    editModalError.value = requestError.response?.data?.message || 'Не удалось обновить пользователя'
  } finally {
    saving.value = false
  }
}

async function doSoftDelete(user) {
  closeActions()
  await executeUserAction(() => deleteUser(user.id, false), 'Пользователь помечен как удаленный')
}

async function doHardDelete(user) {
  closeActions()
  const confirmed = window.confirm(`Физически удалить пользователя ${user.username}?`)
  if (!confirmed) {
    return
  }
  await executeUserAction(() => deleteUser(user.id, true), 'Пользователь удален физически')
}

async function doRestore(user) {
  closeActions()
  await executeUserAction(() => restoreUser(user.id), 'Пользователь восстановлен')
}

async function doInitiateReset(user) {
  closeActions()
  await executeUserAction(
    () => initiateUserPasswordReset(user.id),
    'Временный пароль отправлен пользователю на email',
  )
}

async function executeUserAction(action, successMessage) {
  saving.value = true
  pageError.value = ''
  pageSuccess.value = ''

  try {
    await action()
    pageSuccess.value = successMessage
    await loadUsers()
  } catch (requestError) {
    pageError.value = requestError.response?.data?.message || 'Операция завершилась ошибкой'
  } finally {
    saving.value = false
  }
}

function applyFilters() {
  filters.page = 0
  loadUsers()
}

function clearFilters() {
  filters.search = ''
  filters.role = ''
  filters.enabledOnly = false
  filters.deletedOnly = false
  filters.page = 0
  loadUsers()
}

function nextPage() {
  if ((filters.page + 1) * filters.size < total.value) {
    filters.page += 1
    loadUsers()
  }
}

function prevPage() {
  if (filters.page > 0) {
    filters.page -= 1
    loadUsers()
  }
}

onMounted(loadUsers)
</script>

<template>
  <section class="page-shell">
    <div class="page-head compact">
      <h1>Пользователи</h1>
      <p class="lead">Управление учетными записями и их состоянием.</p>
    </div>

    <p v-if="pageError" class="inline-error">{{ pageError }}</p>
    <p v-if="pageSuccess" class="inline-success">{{ pageSuccess }}</p>

    <article class="surface-card">
      <div class="filters-row wrap">
        <label class="field-inline stacked">
          Поиск
          <input v-model="filters.search" type="text" placeholder="Логин или email" />
        </label>

        <label class="field-inline stacked">
          Роль
          <select v-model="filters.role">
            <option value="">Все роли</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="SECURITY_ENGINEER">SECURITY_ENGINEER</option>
            <option value="DEVELOPER">DEVELOPER</option>
          </select>
        </label>

        <label class="check-row filter-check">
          <input v-model="filters.enabledOnly" type="checkbox" />
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
        <h2>Список пользователей</h2>
        <div class="section-head-actions">
          <span class="pill">{{ loading ? 'LOADING' : `Всего: ${total}` }}</span>
          <button class="ghost-button" type="button" @click="openCreateModal">Регистрация нового пользователя</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table data-table--compact">
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Роль</th>
              <th>Состояние</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>#{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.firstName }}</td>
              <td>{{ user.lastName }}</td>
              <td>{{ user.role }}</td>
              <td>
                <div class="status-list">
                  <span>Активен: {{ user.enabled ? 'Да' : 'Нет' }}</span>
                  <span>Удален: {{ user.deleted ? 'Да' : 'Нет' }}</span>
                  <span>Требует смены пароля: {{ user.mustChangePassword ? 'Да' : 'Нет' }}</span>
                </div>
              </td>
              <td>
                <button class="row-actions-trigger" type="button" @click="openActions(user)">...</button>
              </td>
            </tr>
            <tr v-if="!users.length && !loading">
              <td colspan="8">Пользователи не найдены</td>
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
          <h2>Создание пользователя</h2>
          <button class="ghost-button" type="button" @click="closeCreateModal">Закрыть</button>
        </div>
        <p v-if="createModalError" class="inline-error">{{ createModalError }}</p>
        <form class="form-grid" @submit.prevent="submitCreate">
          <label class="field-inline stacked">Email<input v-model="createForm.email" type="email" placeholder="user@mail.ru" /></label>
          <label class="field-inline stacked">Username<input v-model="createForm.username" type="text" placeholder="ivan.petrov" /></label>
          <label class="field-inline stacked">Имя<input v-model="createForm.firstName" type="text" placeholder="Иван" /></label>
          <label class="field-inline stacked">Фамилия<input v-model="createForm.lastName" type="text" placeholder="Петров" /></label>
          <label class="field-inline stacked">Роль
            <select v-model="createForm.role">
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="SECURITY_ENGINEER">SECURITY_ENGINEER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
          <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Сохранение...' : 'Создать пользователя' }}</button>
        </form>
      </article>
    </div>

    <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <article class="modal-card">
        <div class="section-head">
          <h2>Редактирование пользователя</h2>
          <button class="ghost-button" type="button" @click="closeEditModal">Закрыть</button>
        </div>
        <p v-if="editModalError" class="inline-error">{{ editModalError }}</p>
        <form class="form-grid" @submit.prevent="submitEdit">
          <p class="muted-block">ID: {{ editForm.id || '-' }}</p>
          <label class="field-inline stacked">Email<input v-model="editForm.email" type="email" placeholder="user@mail.ru" /></label>
          <label class="field-inline stacked">Username<input v-model="editForm.username" type="text" placeholder="ivan.petrov" /></label>
          <label class="field-inline stacked">Имя<input v-model="editForm.firstName" type="text" placeholder="Иван" /></label>
          <label class="field-inline stacked">Фамилия<input v-model="editForm.lastName" type="text" placeholder="Петров" /></label>
          <label class="field-inline stacked">Роль
            <select v-model="editForm.role">
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="SECURITY_ENGINEER">SECURITY_ENGINEER</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
          <button class="primary-button" :disabled="saving || !editForm.id" type="submit">{{ saving ? 'Сохранение...' : 'Сохранить изменения' }}</button>
        </form>
      </article>
    </div>

    <div v-if="selectedUserForActions" class="modal-backdrop" @click.self="closeActions">
      <article class="modal-card modal-card--actions">
        <div class="section-head">
          <h2>Действия с пользователем</h2>
          <button class="ghost-button" type="button" @click="closeActions">Закрыть</button>
        </div>
        <p class="muted-block">{{ selectedUserForActions.username }} · {{ selectedUserForActions.email }}</p>
        <div class="row-actions-list row-actions-list--modal">
          <button class="mini-button" type="button" @click="selectForEdit(selectedUserForActions); closeActions()">Редактировать</button>
          <button class="mini-button" type="button" @click="doInitiateReset(selectedUserForActions)">Сброс пароля</button>
          <button class="mini-button" type="button" :disabled="!selectedUserForActions.deleted" @click="doRestore(selectedUserForActions)">Восстановить</button>
          <button class="mini-button" type="button" :disabled="selectedUserForActions.deleted" @click="doSoftDelete(selectedUserForActions)">Мягкое удаление</button>
          <button class="mini-button danger" type="button" @click="doHardDelete(selectedUserForActions)">Физическое удаление</button>
        </div>
      </article>
    </div>
  </section>
</template>
