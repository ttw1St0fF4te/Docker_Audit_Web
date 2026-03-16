import { defineStore } from 'pinia'
import { clearAccessToken, getAccessToken, http, setAccessToken } from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    tokenExpiresAt: '',
    loading: false,
    initialized: false,
    error: '',
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    homePath: (state) => state.user?.homePath || '/login',
  },
  actions: {
    async restoreSession() {
      if (this.initialized) {
        return
      }

      const token = getAccessToken()
      if (!token) {
        this.user = null
        this.accessToken = null
        this.tokenExpiresAt = ''
        this.initialized = true
        return
      }

      this.accessToken = token

      try {
        const { data } = await http.get('/auth/me')
        this.user = data
      } catch {
        this.user = null
        this.accessToken = null
        this.tokenExpiresAt = ''
        clearAccessToken()
      } finally {
        this.initialized = true
      }
    },
    async login(credentials) {
      this.loading = true
      this.error = ''

      try {
        const { data } = await http.post('/auth/login', credentials)
        this.user = data
        this.accessToken = data.accessToken || null
        this.tokenExpiresAt = data.expiresAt || ''
        if (data.accessToken) {
          setAccessToken(data.accessToken)
        }
        this.initialized = true
        return data
      } catch (error) {
        this.user = null
        this.accessToken = null
        this.tokenExpiresAt = ''
        clearAccessToken()
        this.initialized = true
        this.error = error.response?.data?.message || 'Не удалось выполнить вход'
        throw error
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await http.post('/auth/logout')
      } finally {
        this.user = null
        this.accessToken = null
        this.tokenExpiresAt = ''
        this.error = ''
        this.initialized = true
        clearAccessToken()
      }
    },
  },
})