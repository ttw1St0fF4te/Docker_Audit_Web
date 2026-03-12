import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RoleWorkspaceView from '../views/RoleWorkspaceView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/security-engineer',
    name: 'security-engineer',
    component: RoleWorkspaceView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
      endpoint: '/pages/security-engineer',
    },
  },
  {
    path: '/developer',
    name: 'developer',
    component: RoleWorkspaceView,
    meta: {
      requiresAuth: true,
      role: 'DEVELOPER',
      endpoint: '/pages/developer',
    },
  },
  {
    path: '/super-admin',
    name: 'super-admin',
    component: RoleWorkspaceView,
    meta: {
      requiresAuth: true,
      role: 'SUPER_ADMIN',
      endpoint: '/pages/super-admin',
    },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: ForbiddenView,
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})