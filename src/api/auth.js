import { http } from './http'

export async function activatePassword(payload) {
  const { data } = await http.post('/auth/activate-password', payload)
  return data
}

export async function initiatePasswordReset(payload) {
  const { data } = await http.post('/auth/recovery/password/reset', payload)
  return data
}

export async function requestEmailChangeCode(payload) {
  const { data } = await http.post('/auth/recovery/email/change/request-code', payload)
  return data
}

export async function confirmEmailChangeCode(payload) {
  const { data } = await http.post('/auth/recovery/email/change/confirm-code', payload)
  return data
}

export async function verifyIdentityEmailChange(payload) {
  const { data } = await http.post('/auth/recovery/email/change/verify-identity', payload)
  return data
}
