<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const displayName = computed(() => authStore.nickname || authStore.username || '未登录');

/**
 * 退出登录处理，负责调用 auth store 清理 mock 登录态并返回登录页。
 * 调用时机：用户点击 Header 的退出登录按钮时。
 * 参数含义：无参数，直接使用当前全局 auth 状态。
 * 返回值含义：无返回值；退出完成后跳转 /login。
 * mock 边界：当前只清理前端 mock token 和 userInfo，不处理真实后端会话。
 * 后端替换点：后续接 FastAPI 时由 authStore.logout 内部调用真实退出接口。
 */
const handleLogout = async (): Promise<void> => {
  await authStore.logout();
  await router.replace('/login');
};
</script>

<template>
  <div class="app-header">
    <h2 class="app-header__title"></h2>
    <div class="app-header__user">
      <span class="app-header__username">{{ displayName }}</span>
      <el-button type="primary" plain size="small" @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.app-header__title {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 600;
}

.app-header__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header__username {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}
</style>
