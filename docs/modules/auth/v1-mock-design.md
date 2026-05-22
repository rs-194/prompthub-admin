# 模块实现方案：认证与路由访问控制 v1 mock

## 0. 文档状态

- 阶段：v1 mock
- 状态：已实现
- 适用范围：前端 mock 登录、Pinia auth store、路由守卫、Header 用户展示与退出登录，不接后端

## 1. 模块目标

本模块用于补齐后台系统基础登录闭环，让 PromptHub Admin 不再裸奔访问后台页面。v1 通过 mock 登录、Pinia 全局 auth 状态和路由守卫实现访问控制演示。

auth 状态会被登录页、路由守卫、Header 和后续接口层共同使用，因此放入 Pinia 是合理的。当前只做 mock 登录，不做真实鉴权；后续接 FastAPI 后端时优先替换 auth service。

## 2. 本阶段范围

### 本阶段要做

- 新增 `/login` 页面。
- 新增 auth service：`mockLogin`、`mockLogout`。
- 新增 auth 类型：`AuthUser`、`LoginFormData`、`LoginResponse`。
- 新增 Pinia auth store。
- token 和 userInfo 存入 localStorage。
- 应用路由守卫首次执行时从 localStorage 恢复 auth 状态。
- 新增 `router.beforeEach` 路由守卫。
- 未登录访问后台页跳转 `/login`。
- 已登录访问 `/login` 跳转 `/dashboard`。
- Header 显示用户名或昵称。
- Header 支持退出登录。

### 本阶段不做

- 不接后端。
- 不做真实 JWT 校验。
- 不做真实权限系统。
- 不做 RBAC。
- 不做刷新 token。
- 不做注册。
- 不做验证码。
- 不做密码加密。
- 不做用户管理页面。
- 不引入新依赖。
- 不修改业务模块逻辑。
- 不实现真实接口请求封装。

## 3. 用户操作流程

### 未登录访问后台

访问 `/dashboard` 或其他后台页面  
→ router guard 检查未登录  
→ 跳转 `/login`  
→ 用户输入账号密码  
→ 点击登录  
→ `mockLogin` 返回 mock token 和 userInfo  
→ auth store 保存状态  
→ localStorage 保存 token / userInfo  
→ 跳转 `/dashboard` 或 redirect 目标页

### 已登录访问后台

访问后台页面  
→ auth store 有 token  
→ 放行

### 已登录访问 `/login`

访问 `/login`  
→ 已登录  
→ 自动跳转 `/dashboard`

### 退出登录

点击 Header 退出登录  
→ auth store 清理 token 和 userInfo  
→ localStorage 清理  
→ 跳转 `/login`

## 4. 页面信息结构

登录页包含：

- 项目名称 PromptHub Admin
- 登录说明
- 用户名输入框
- 密码输入框
- 登录按钮
- mock 账号提示：admin / 123456
- 错误提示 / loading 状态

Header 增加：

- 当前用户名或昵称展示
- 退出登录按钮

## 5. 文件结构

新增：

```text
frontend/src/views/login/LoginView.vue
frontend/src/services/auth.ts
frontend/src/types/auth.ts
frontend/src/stores/auth.ts
```

修改：

```text
frontend/src/router/index.ts
frontend/src/layout/components/AppHeader.vue
frontend/src/main.ts
```

文档与 notes：

```text
docs/modules/auth/v1-mock-design.md
docs/modules/README.md
docs/development-log.md
docs/roadmap.md
notes/interview/auth-module-notes.md
notes/interview/auth-module-qa.md
```

## 6. 类型设计

- `AuthUser`：`id`、`username`、`nickname`、`role`。
- `LoginFormData`：`username`、`password`。
- `LoginResponse`：`token`、`user`。

不使用 `any`。token 是 mock token，role 仅用于展示或后续扩展，v1 不做真实权限判断。

## 7. 状态设计

auth store 状态：

- `token`
- `user`
- `initialized`

getters：

- `isLoggedIn`
- `username`
- `nickname`

actions：

- `login(formData)`
- `logout()`
- `restoreAuth()`
- `setAuth(token, user)`
- `clearAuth()`

token 和 userInfo 通过 `setAuth` / `clearAuth` 显式同步 localStorage，不使用 watch 隐式同步。`restoreAuth` 用于刷新页面后恢复 mock 登录态。

## 8. service 方法设计

- `mockLogin(data)`：校验 mock 账号 `admin / 123456`，成功返回 mock token 和 userInfo，失败抛出错误。
- `mockLogout()`：模拟退出登录，不请求后端。

service 不操作路由、组件状态或 localStorage。后续接 FastAPI 时优先替换 service 内部实现。

## 9. 路由守卫设计

- 新增 `/login` 路由，不使用 `AdminLayout`。
- 后台页面保留现有 path，并增加 `meta.requiresAuth: true`。
- `router.beforeEach` 检查 auth store。
- auth store 未初始化时先调用 `restoreAuth`。
- 未登录访问后台页跳转 `/login`，并携带 redirect query。
- 已登录访问 `/login` 跳转 `/dashboard`。
- login 不进入侧边栏菜单。

## 10. 组件职责

- `LoginView.vue`：负责登录表单、登录按钮、错误提示、调用 authStore.login。
- `auth.ts service`：负责 mock 登录接口。
- `auth store`：负责全局登录状态、localStorage 同步。
- `router`：负责访问控制。
- `AppHeader.vue`：负责展示用户信息和退出登录入口。

## 11. props / emit 设计

v1 不涉及复杂父子组件通信。

- LoginView 暂时不拆子组件。
- Header 直接读取 auth store。
- 不需要 props / emit。
- 后续登录页复杂后再拆 `LoginForm` 组件。

## 12. computed / watch 使用点

computed：

- LoginView 使用 computed 判断登录按钮 disabled。
- auth store getter `isLoggedIn` 属于派生状态。

watch：

- v1 不需要 watch。
- localStorage 同步由 auth store actions 显式处理。

## 13. 关键函数职责

- `handleLogin`：提交登录表单，调用 auth store，成功后跳转。
- `handleLogout`：调用 auth store 退出登录并跳转 `/login`。
- `restoreAuth`：从 localStorage 恢复 mock 登录态。
- `router.beforeEach guard`：统一检查后台页面访问控制。
- `mockLogin`：模拟登录接口。
- `clearAuth`：清理 Pinia 与 localStorage 登录态。

## 14. 数据流 / 调用链

### 登录数据流

用户输入账号密码  
→ `handleLogin`  
→ `authStore.login`  
→ `authService.mockLogin`  
→ 返回 token / user  
→ `authStore.setAuth`  
→ localStorage 保存  
→ router 跳转 redirect 或 `/dashboard`

### 路由守卫数据流

用户访问路由  
→ `beforeEach`  
→ 检查目标路由 `meta.requiresAuth`  
→ 检查 `authStore.isLoggedIn`  
→ 未登录跳 `/login`  
→ 已登录放行

### 退出登录数据流

用户点击退出  
→ `handleLogout`  
→ `authStore.logout`  
→ `authService.mockLogout`  
→ `clearAuth`  
→ localStorage 清理  
→ router 跳 `/login`

### 应用恢复登录态数据流

应用启动  
→ `authStore.restoreAuth`  
→ 从 localStorage 读取 token / user  
→ 恢复 Pinia 状态  
→ router guard 可以识别登录态

## 15. loading / empty / error 状态

- LoginView 有 loading 状态。
- 登录失败展示 errorMessage。
- 用户名或密码为空时登录按钮 disabled。
- 退出登录不做复杂 loading。
- v1 不做复杂鉴权错误分类。

## 16. mock 边界与后端替换点

- 当前 token 是 mock token。
- 当前用户信息是 mock user。
- 当前不做真实 JWT 校验。
- 当前不做 RBAC。
- 当前不做刷新 token。

后续接 FastAPI 后端时：

- `mockLogin` 替换为 `POST /auth/login`。
- `mockLogout` 替换为 `POST /auth/logout` 或前端直接清理。
- token 由后端签发。
- router guard 继续基于 token 和 auth store 判断。
- 真实权限可后续通过 role / permissions 扩展。

## 17. 验收标准

- 访问 `/login` 能看到登录页。
- 未登录访问 `/dashboard` 会跳转 `/login`。
- 未登录访问 `/prompts`、`/models`、`/knowledge`、`/chat-test`、`/settings` 会跳转 `/login`。
- 使用 mock 账号登录成功后跳转 `/dashboard` 或 redirect。
- 已登录访问 `/login` 会跳转 `/dashboard`。
- Header 显示用户名或昵称。
- 点击退出登录后清理状态并跳转 `/login`。
- 刷新页面后能从 localStorage 恢复登录态。
- `cd frontend && npm run build` 通过。
- docs / notes 按规则更新。

## 18. docs / notes 更新计划

已更新：

- `README.md`
- `docs/frontend-architecture.md`
- `docs/development-log.md`
- `docs/roadmap.md`
- `docs/modules/auth/v1-mock-design.md`
- `docs/modules/README.md`
- `notes/interview/auth-module-notes.md`
- `notes/interview/auth-module-qa.md`

## 19. 风险点与避免事项

- 不要把 mock 登录写成真实鉴权。
- 不要实现真实 JWT 校验。
- 不要实现 RBAC。
- 不要引入新依赖。
- 不要改业务模块逻辑。
- 不要把 login 放进侧边栏菜单。
- 不要大改 layout。
- 不要把 token 安全性描述夸大。
- 不要在前端保存真实敏感信息。
- 不要用 Pinia 管理所有业务数据，只用于 auth 全局状态。
- 不要用 watch 隐式同步 localStorage。
- 不要破坏现有路由路径。
