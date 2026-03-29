import { http } from './http'

const ADMIN_PREFIX = '/admin'

export async function listUsers(params = {}) {
  const { data } = await http.get(`${ADMIN_PREFIX}/users`, { params })
  return data
}

export async function createUser(payload) {
  const { data } = await http.post(`${ADMIN_PREFIX}/users`, payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await http.patch(`${ADMIN_PREFIX}/users/${id}`, payload)
  return data
}

export async function deleteUser(id, hard = false) {
  const { data } = await http.delete(`${ADMIN_PREFIX}/users/${id}`, { params: { hard } })
  return data
}

export async function restoreUser(id) {
  const { data } = await http.post(`${ADMIN_PREFIX}/users/${id}/restore`)
  return data
}

export async function initiateUserPasswordReset(id) {
  const { data } = await http.post(`${ADMIN_PREFIX}/users/${id}/initiate-password-reset`)
  return data
}

export async function listAuditLogs(params = {}) {
  const { data } = await http.get(`${ADMIN_PREFIX}/audit-logs`, { params })
  return data
}

export async function listAuditTableNames() {
  const { data } = await http.get(`${ADMIN_PREFIX}/audit-logs/tables`)
  return data
}

export async function exportAuditLogsCsv(params = {}) {
  const response = await http.get(`${ADMIN_PREFIX}/audit-logs/export`, {
    params,
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `audit-change-log-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function listHosts(params = {}) {
  const { data } = await http.get(`${ADMIN_PREFIX}/hosts`, { params })
  return data
}

export async function testHostConnection(payload) {
  const { data } = await http.post(`${ADMIN_PREFIX}/hosts/test-connection`, payload)
  return data
}

export async function createHost(payload) {
  const { data } = await http.post(`${ADMIN_PREFIX}/hosts`, payload)
  return data
}

export async function updateHost(id, payload) {
  const { data } = await http.patch(`${ADMIN_PREFIX}/hosts/${id}`, payload)
  return data
}

export async function setHostActive(id, value) {
  const { data } = await http.patch(`${ADMIN_PREFIX}/hosts/${id}/active`, null, { params: { value } })
  return data
}

export async function softDeleteHost(id) {
  const { data } = await http.post(`${ADMIN_PREFIX}/hosts/${id}/soft-delete`)
  return data
}

export async function restoreHost(id) {
  const { data } = await http.post(`${ADMIN_PREFIX}/hosts/${id}/restore`)
  return data
}

export async function hardDeleteHost(id) {
  const { data } = await http.delete(`${ADMIN_PREFIX}/hosts/${id}`)
  return data
}
