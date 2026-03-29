import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

const authStore = useAuthStore(pinia)

router.beforeEach(async (to) => {
	await authStore.restoreSession()

	if ((to.name === 'login' || to.name === 'activate-password') && authStore.isAuthenticated) {
		return authStore.homePath
	}

	if (to.meta.requiresAuth && !authStore.isAuthenticated) {
		return { name: 'login', query: { redirect: to.fullPath } }
	}

	if (to.meta.role && authStore.user?.role !== to.meta.role) {
		return { name: 'forbidden' }
	}

	return true
})

app.use(router)
app.mount('#app')
