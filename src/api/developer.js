import { http } from './http'

const DEVELOPER_PREFIX = '/developer'

export async function listNotifications(params = {}) {
  const { data } = await http.get(`${DEVELOPER_PREFIX}/notifications`, { params })
  return data
}

export async function getNotification(id) {
  const { data } = await http.get(`${DEVELOPER_PREFIX}/notifications/${id}`)
  return data
}

export async function markNotificationRead(id) {
  const { data } = await http.post(`${DEVELOPER_PREFIX}/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await http.post(`${DEVELOPER_PREFIX}/notifications/read-all`)
  return data
}

export async function getScanViolations(scanId, scanType = 'CIS') {
  const { data } = await http.get(`${DEVELOPER_PREFIX}/scans/${scanId}/violations`, {
    params: { scanType }
  })
  return data
}

export async function getDashboardContainerState(params = {}) {
  const { data } = await http.get(`${DEVELOPER_PREFIX}/dashboard/container-state`, { params })
  return data
}

export async function getDashboardContainerLoad(params = {}) {
  const { data } = await http.get(
    `${DEVELOPER_PREFIX}/dashboard/container-load`,
    {
      params,
      timeout: 30000,
    },
  )
  return data
}

export async function getDashboardTopRiskContainers(params = {}) {
  const { data } = await http.get(`${DEVELOPER_PREFIX}/dashboard/top-risk-containers`, { params })
  return data
}

export async function getDashboardSeverityBreakdown(params = {}) {
  const { data } = await http.get(`${DEVELOPER_PREFIX}/dashboard/severity-breakdown`, { params })
  return data
}
