import type { AuthUser, LoginFormData, LoginResponse } from '@/types/auth';

const MOCK_USER: AuthUser = {
  id: 'mock-admin-001',
  username: 'admin',
  nickname: 'PromptHub 管理员',
  role: 'admin'
};

const MOCK_TOKEN = 'mock-prompthub-admin-token';

/**
 * mock 登录方法，负责模拟登录接口的账号校验。
 * 调用时机：LoginView 提交登录表单时由 auth store 调用。
 * 参数含义：data 为用户输入的用户名和密码。
 * 返回值含义：登录成功时返回 mock token 和 mock userInfo。
 * mock 边界：当前不请求后端、不解析 JWT、不保存真实敏感信息。
 * 后端替换点：后续接 FastAPI 时优先将函数内部替换为 POST /auth/login。
 */
export const mockLogin = async (data: LoginFormData): Promise<LoginResponse> => {
  if (data.username === 'admin' && data.password === '123456') {
    return {
      token: MOCK_TOKEN,
      user: { ...MOCK_USER }
    };
  }

  throw new Error('用户名或密码错误');
};

/**
 * mock 退出方法，负责模拟退出登录接口。
 * 调用时机：Header 点击退出登录时由 auth store 调用。
 * 参数含义：当前无参数，v1 不向后端提交退出请求。
 * 返回值含义：Promise 完成表示 mock 退出流程结束。
 * mock 边界：当前不请求后端、不吊销真实 token。
 * 后端替换点：后续接 FastAPI 时可替换为 POST /auth/logout，或继续由前端清理登录态。
 */
export const mockLogout = async (): Promise<void> => {
  return Promise.resolve();
};
