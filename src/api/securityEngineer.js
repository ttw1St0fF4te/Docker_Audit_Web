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

export async function upsertSchedule(payload) {
  const { data } = await http.post(`${SECURITY_PREFIX}/schedules`, payload)
  return data
}

export async function runManualAudit(hostId) {
  const { data } = await http.post(`${SECURITY_PREFIX}/audits/run`, { hostId })
  return data
}

export async function getRecentAudits() {
  const { data } = await http.get(`${SECURITY_PREFIX}/audits/recent`)
  return data
}

export async function getAuditSummary(scanId) {
  const { data } = await http.get(`${SECURITY_PREFIX}/audits/${scanId}/summary`)
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

export async function getSeverityTrend(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/severity-trend`, { params })
  return data
}

export async function getSecurityScoreTrend(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/security-score-trend`, { params })
  return data
}

export async function getTopHosts(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/top-hosts`, { params })
  return data
}

export async function getTopRules(params = {}) {
  const { data } = await http.get(`${SECURITY_PREFIX}/analytics/top-rules`, { params })
  return data
}
