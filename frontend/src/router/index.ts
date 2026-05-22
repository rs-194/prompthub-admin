import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AdminLayout from '@/layout/AdminLayout.vue';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'prompts',
        name: 'prompts',
        component: () => import('@/views/prompts/PromptListView.vue'),
        meta: { title: '提示词管理', requiresAuth: true }
      },
      {
        path: 'knowledge',
        name: 'knowledge',
        component: () => import('@/views/knowledge/KnowledgeListView.vue'),
        meta: { title: '知识库管理', requiresAuth: true }
      },
      {
        path: 'models',
        name: 'models',
        component: () => import('@/views/models/ModelConfigView.vue'),
        meta: { title: '模型配置', requiresAuth: true }
      },
      {
        path: 'chat-test',
        name: 'chat-test',
        component: () => import('@/views/chat-test/ChatTestView.vue'),
        meta: { title: '对话测试', requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '系统设置', requiresAuth: true }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 路由守卫负责检查 v1 mock 登录态。
 * 首次跳转时先从 localStorage 恢复 auth store；后台页面需要 token 才能访问。
 * 当前只基于 mock token 判断是否登录，不做真实 JWT 校验、RBAC 或菜单权限过滤。
 * 后续接后端时可继续复用守卫结构，并把 token 校验扩展到 auth service / store。
 */
router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (!authStore.initialized) {
    authStore.restoreAuth();
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    return '/dashboard';
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    const redirect = to.fullPath.startsWith('/login') ? '/dashboard' : to.fullPath;

    return {
      path: '/login',
      query: { redirect }
    };
  }

  return true;
});

export default router;
