import { http } from './http'

export async function getProfile() {
  const { data } = await http.get('/profile')
  return data
}

export async function updateProfile(payload) {
  const { data } = await http.patch('/profile', payload)
  return data
}

export async function initiateProfilePasswordReset() {
  const { data } = await http.post('/profile/initiate-password-reset')
  return data
}
