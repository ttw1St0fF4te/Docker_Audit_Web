import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RoleWorkspaceView from '../views/RoleWorkspaceView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import SecurityEngineerOverviewView from '../views/SecurityEngineerOverviewView.vue'
import SecurityEngineerRulesView from '../views/SecurityEngineerRulesView.vue'
import SecurityEngineerSchedulesView from '../views/SecurityEngineerSchedulesView.vue'
import SecurityEngineerScansView from '../views/SecurityEngineerScansView.vue'
import SecurityEngineerAnalyticsView from '../views/SecurityEngineerAnalyticsView.vue'
import SecurityEngineerNotificationsView from '../views/SecurityEngineerNotificationsView.vue'

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
    redirect: '/security-engineer/overview',
  },
  {
    path: '/security-engineer/overview',
    name: 'security-engineer-overview',
    component: SecurityEngineerOverviewView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
    },
  },
  {
    path: '/security-engineer/rules',
    name: 'security-engineer-rules',
    component: SecurityEngineerRulesView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
    },
  },
  {
    path: '/security-engineer/schedules',
    name: 'security-engineer-schedules',
    component: SecurityEngineerSchedulesView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
    },
  },
  {
    path: '/security-engineer/scans',
    name: 'security-engineer-scans',
    component: SecurityEngineerScansView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
    },
  },
  {
    path: '/security-engineer/analytics',
    name: 'security-engineer-analytics',
    component: SecurityEngineerAnalyticsView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
    },
  },
  {
    path: '/security-engineer/notifications',
    name: 'security-engineer-notifications',
    component: SecurityEngineerNotificationsView,
    meta: {
      requiresAuth: true,
      role: 'SECURITY_ENGINEER',
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