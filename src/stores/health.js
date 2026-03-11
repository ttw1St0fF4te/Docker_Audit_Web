import { defineStore } from 'pinia'
import { http } from '../api/http'

export const useHealthStore = defineStore('health', {
  state: () => ({
    status: 'idle',
    loading: false,
    error: '',
    payload: null,
    lastUpdated: '',
  }),
  actions: {
    async fetchHealth() {
      this.loading = true
      this.error = ''

      try {
        const { data } = await http.get('/health')
        this.payload = data
        this.status = data.status
        this.lastUpdated = new Date().toLocaleString('ru-RU')
      } catch (error) {
        this.payload = null
        this.status = 'DOWN'
        this.error = error.response?.data?.message || error.message || 'API is unavailable'
      } finally {
        this.loading = false
      }
    },
  },
})