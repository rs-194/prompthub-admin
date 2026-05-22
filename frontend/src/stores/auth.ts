import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { mockLogin, mockLogout } from '@/services/auth';
import type { AuthUser, LoginFormData } from '@/types/auth';

const TOKEN_STORAGE_KEY = 'prompthub_token';
const USER_STORAGE_KEY = 'prompthub_user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref('');
  const user = ref<AuthUser | null>(null);
  const initialized = ref(false);

  const isLoggedIn = computed(() => Boolean(token.value));
  const username = computed(() => user.value?.username ?? '');
  const nickname = computed(() => user.value?.nickname ?? '');

  /**
   * 保存登录态，负责把 mock token 和用户信息写入 Pinia 与 localStorage。
   * 调用时机：登录成功后，或后续后端登录接口返回 token / user 后。
   * 参数含义：nextToken 为登录凭证字符串，nextUser 为当前用户信息。
   * 返回值含义：无返回值，执行后全局 auth 状态完成同步。
   * mock 边界：当前 token 是 mock token，localStorage 仅用于 mock 登录态持久化。
   * 后端替换点：后续 token 和 user 来源改为 FastAPI 登录接口返回值。
   */
  const setAuth = (nextToken: string, nextUser: AuthUser): void => {
    token.value = nextToken;
    user.value = nextUser;
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  };

  /**
   * 清理登录态，负责同步清空 Pinia 与 localStorage。
   * 调用时机：退出登录、恢复登录态失败或本地数据异常时。
   * 参数含义：无参数。
   * 返回值含义：无返回值，执行后视为未登录状态。
   * mock 边界：当前只清理前端 mock 登录态，不处理后端 token 吊销。
   * 后端替换点：后续可在 logout 调用后端退出接口后继续复用本函数。
   */
  const clearAuth = (): void => {
    token.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  /**
   * 登录 action，负责调用 mock 登录 service 并保存返回的登录态。
   * 调用时机：LoginView 校验表单后提交登录时。
   * 参数含义：formData 为登录表单中的用户名和密码。
   * 返回值含义：登录成功后返回 void，失败时向上抛出错误供页面展示。
   * mock 边界：当前只校验内置 mock 账号，不请求后端、不做真实 JWT 校验。
   * 后端替换点：后续替换 auth service 的登录实现即可保持调用链稳定。
   */
  const login = async (formData: LoginFormData): Promise<void> => {
    const response = await mockLogin(formData);
    setAuth(response.token, response.user);
  };

  /**
   * 退出登录 action，负责调用 mock 退出 service 并清理登录态。
   * 调用时机：Header 点击退出登录时。
   * 参数含义：无参数。
   * 返回值含义：退出完成后返回 void。
   * mock 边界：当前不请求真实后端、不处理真实 token 失效。
   * 后端替换点：后续 mockLogout 可替换为 FastAPI 退出接口。
   */
  const logout = async (): Promise<void> => {
    await mockLogout();
    clearAuth();
  };

  /**
   * 恢复登录态，负责从 localStorage 读取 mock token 和用户信息。
   * 调用时机：路由守卫首次执行且 auth store 未初始化时。
   * 参数含义：无参数。
   * 返回值含义：无返回值，执行后 initialized 会被置为 true。
   * mock 边界：当前只恢复本地 mock 登录态，不向后端校验 token 有效性。
   * 后端替换点：后续可增加 FastAPI token 校验或当前用户接口。
   */
  const restoreAuth = (): void => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    try {
      if (!storedToken || !storedUser) {
        clearAuth();
        return;
      }

      const parsedUser = JSON.parse(storedUser) as AuthUser;
      if (!parsedUser.id || !parsedUser.username || !parsedUser.nickname || !parsedUser.role) {
        clearAuth();
        return;
      }

      token.value = storedToken;
      user.value = parsedUser;
    } catch {
      clearAuth();
    } finally {
      initialized.value = true;
    }
  };

  return {
    token,
    user,
    initialized,
    isLoggedIn,
    username,
    nickname,
    login,
    logout,
    restoreAuth,
    setAuth,
    clearAuth
  };
});
