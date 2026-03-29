import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RoleWorkspaceView from '../views/RoleWorkspaceView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import ActivatePasswordView from '../views/ActivatePasswordView.vue'
import RecoveryView from '../views/RecoveryView.vue'
import RecoveryPasswordResetView from '../views/RecoveryPasswordResetView.vue'
import RecoveryEmailCodeRequestView from '../views/RecoveryEmailCodeRequestView.vue'
import RecoveryEmailCodeConfirmView from '../views/RecoveryEmailCodeConfirmView.vue'
import RecoveryEmailIdentityView from '../views/RecoveryEmailIdentityView.vue'
import ProfileView from '../views/ProfileView.vue'
import SuperAdminUsersView from '../views/SuperAdminUsersView.vue'
import SuperAdminAuditLogsView from '../views/SuperAdminAuditLogsView.vue'
import SuperAdminDockerHostsView from '../views/SuperAdminDockerHostsView.vue'
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
    path: '/activate-password',
    name: 'activate-password',
    component: ActivatePasswordView,
  },
  {
    path: '/recovery',
    name: 'recovery',
    component: RecoveryView,
  },
  {
    path: '/recovery/password-reset',
    name: 'recovery-password-reset',
    component: RecoveryPasswordResetView,
  },
  {
    path: '/recovery/email-code/request',
    name: 'recovery-email-code-request',
    component: RecoveryEmailCodeRequestView,
  },
  {
    path: '/recovery/email-code/confirm',
    name: 'recovery-email-code-confirm',
    component: RecoveryEmailCodeConfirmView,
  },
  {
    path: '/recovery/email-identity',
    name: 'recovery-email-identity',
    component: RecoveryEmailIdentityView,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      requiresAuth: true,
    },
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
    redirect: '/super-admin/users',
  },
  {
    path: '/super-admin/users',
    name: 'super-admin-users',
    component: SuperAdminUsersView,
    meta: {
      requiresAuth: true,
      role: 'SUPER_ADMIN',
    },
  },
  {
    path: '/super-admin/audit-logs',
    name: 'super-admin-audit-logs',
    component: SuperAdminAuditLogsView,
    meta: {
      requiresAuth: true,
      role: 'SUPER_ADMIN',
    },
  },
  {
    path: '/super-admin/hosts',
    name: 'super-admin-hosts',
    component: SuperAdminDockerHostsView,
    meta: {
      requiresAuth: true,
      role: 'SUPER_ADMIN',
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