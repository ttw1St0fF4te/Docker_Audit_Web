import { http } from './http'

const SECURITY_PREFIX = '/security'

export async function listRules(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/rules`, { params })
  return data
}

export async function patchRuleEnabled(id, enabled) {
  const { data } = await http.patch(`${SECURITY_PREFIX}/rules/${id}/enabled`, { enabled })
  return data
}

export async function listHosts(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/hosts`, { params })
  return data
}

export async function listSchedules(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/schedules`, { params })
  return data
}

export async function listCveSchedules(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/schedules`, { params })
  return data
}

export async function upsertSchedule(payload) {
  const { data } = await http.post(`${SECURITY_PREFIX}/schedules`, payload)
  return data
}

export async function upsertCveSchedule(payload) {
  const { data } = await http.post(`${SECURITY_PREFIX}/cve/schedules`, payload)
  return data
}

export async function runManualAudit(hostId) {
  const { data } = await http.post(
    `${SECURITY_PREFIX}/audits/run`,
    { hostId },
    { timeout: 120000 },
  )
  return data
}

export async function runManualCveAudit(hostId) {
  const { data } = await http.post(
    `${SECURITY_PREFIX}/cve/audits/run`,
    { hostId },
    { timeout: 600000 },
  )
  return data
}

export async function getRecentAudits() {
  const { data } = await http.get(`${SECURITY_PREFIX}/audits/recent`)
  return data
}

export async function searchAudits(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/audits`, { params })
  return data
}

export async function searchCveAudits(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/audits`, { params })
  return data
}

export async function getAuditSummary(scanId) {
  const { data } = await http.get(`${SECURITY_PREFIX}/audits/${scanId}/summary`)
  return data
}

export async function getCveAuditSummary(scanId) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/audits/${scanId}/summary`)
  return data
}

export async function getNotificationSettings() {
  const { data } = await http.get(`${SECURITY_PREFIX}/notification-settings`)
  return data
}

export async function patchNotificationSettings(minSeverity) {
  const { data } = await http.patch(`${SECURITY_PREFIX}/notification-settings`, { minSeverity })
  return data
}

export async function getAnalyticsOverview(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/overview`, { params })
  return data
}

export async function getCveAnalyticsOverview(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/analytics/overview`, { params })
  return data
}

export async function getSeverityTrend(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/severity-trend`, { params })
  return data
}

export async function getCveSeverityTrend(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/analytics/severity-trend`, { params })
  return data
}

export async function getSecurityScoreTrend(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/security-score-trend`, { params })
  return data
}

export async function getCveSecurityScoreTrend(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/analytics/security-score-trend`, { params })
  return data
}

export async function getTopHosts(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/top-hosts`, { params })
  return data
}

export async function getCveTopHosts(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/analytics/top-hosts`, { params })
  return data
}

export async function getTopRules(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/top-rules`, { params })
  return data
}

export async function getCveTopRules(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/cve/analytics/top-rules`, { params })
  return data
}

export async function generateAnalyticsReport(payload) {
  const response = await http.post(`${SECURITY_PREFIX}/analytics/reports/generate`, payload, {
    responseType: 'blob'
  })
  
  const contentDisposition = response.headers['content-disposition']
  let fileName = 'report'
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/)
    if (match) {
      fileName = match[1]
    }
  }
  
  const blob = new Blob([response.data], { type: response.headers['content-type'] })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  
  return { success: true, fileName }
}
