import { defineStore } from 'pinia'
import { http } from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
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

      try {
        const { data } = await http.get('/auth/me')
        this.user = data
      } catch {
        this.user = null
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
        this.initialized = true
        return data
      } catch (error) {
        this.user = null
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
        this.error = ''
        this.initialized = true
      }
    },
  },
})