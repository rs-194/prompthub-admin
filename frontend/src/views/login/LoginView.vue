<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { LoginFormData } from '@/types/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const formData = reactive<LoginFormData>({
  username: '',
  password: ''
});
const loading = ref(false);
const errorMessage = ref('');

const canSubmit = computed(() => Boolean(formData.username.trim() && formData.password.trim()));

const getSafeRedirect = (): string => {
  const redirect = route.query.redirect;
  if (typeof redirect !== 'string' || redirect.startsWith('/login')) {
    return '/dashboard';
  }

  return redirect;
};

/**
 * 登录提交处理，负责校验本地表单并调用 auth store 完成 mock 登录。
 * 调用时机：用户点击登录按钮或在密码框回车时。
 * 参数含义：无参数，直接读取当前页面局部表单状态。
 * 返回值含义：无返回值；成功后跳转 redirect 或 /dashboard，失败时展示错误信息。
 * mock 边界：当前不直接判断账号密码、不操作 token 和 localStorage。
 * 后端替换点：后续接 FastAPI 时保持本函数调用 authStore.login，由 service 替换内部请求。
 */
const handleLogin = async (): Promise<void> => {
  if (!canSubmit.value || loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    await authStore.login({
      username: formData.username.trim(),
      password: formData.password
    });
    await router.replace(getSafeRedirect());
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-panel__brand">
        <p class="login-panel__eyebrow">PromptHub Admin</p>
        <h1>后台登录</h1>
        <p>当前为 v1 mock 登录，用于演示后台访问控制流程，后端待接入。</p>
      </div>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
        class="login-panel__alert"
      />

      <el-form class="login-form" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="formData.username" placeholder="请输入用户名" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button type="primary" class="login-form__button" :loading="loading" :disabled="!canSubmit" @click="handleLogin">
          登录
        </el-button>
      </el-form>

      <p class="login-panel__hint">mock 账号：admin / 123456</p>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: linear-gradient(135deg, #f4f7fb 0%, #eef4f1 50%, #f8f5ef 100%);
}

.login-panel {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 40px rgb(15 23 42 / 10%);
}

.login-panel__brand {
  margin-bottom: 24px;
}

.login-panel__brand h1 {
  margin: 0 0 8px;
  color: #111827;
  font-size: 28px;
  line-height: 1.25;
}

.login-panel__brand p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.login-panel__eyebrow {
  margin-bottom: 8px !important;
  color: #2563eb !important;
  font-size: 14px;
  font-weight: 700;
}

.login-panel__alert {
  margin-bottom: 18px;
}

.login-form__button {
  width: 100%;
  margin-top: 8px;
}

.login-panel__hint {
  margin: 18px 0 0;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}
</style>
