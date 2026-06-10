# 前端架构说明（Frontend Architecture）

## 1. 当前前端目录结构
以 `frontend/src` 为核心：

```text
src/
├─ assets/                 # 静态资源
├─ config/                 # 配置（当前包含菜单配置）
├─ layout/                 # 后台布局与布局子组件
├─ router/                 # 路由入口与页面路由配置
├─ services/               # 预留：服务层（当前能力有限）
├─ stores/                 # 状态管理（当前含 app store）
├─ styles/                 # 全局样式
├─ types/                  # 全局类型与声明
├─ utils/                  # 前端轻量通用工具
├─ views/                  # 页面视图（当前多为骨架页）
├─ App.vue
└─ main.ts
```

## 2. `src/layout` 的职责
- 放置后台整体骨架（侧边栏、头部、内容区、底部）。
- 管理通用布局壳，不承载具体业务数据处理。

## 3. `src/views` 的职责
- 按页面维度组织视图。
- 当前阶段以页面骨架与基础标题展示为主。
- 后续页面逻辑按模块逐步实现，避免在单文件堆积复杂逻辑。
- `src/views/login/LoginView.vue` 承载认证与路由访问控制 v1 mock 登录页，不使用后台主布局。

## 4. `src/router` 的职责
- 统一维护前端路由配置。
- 管理后台主布局与各页面入口映射。
- 路由变更应保持与菜单和页面目录同步。
- 当前包含 v1 mock 路由守卫：后台页面通过 `meta.requiresAuth` 标记需要登录，未登录访问时跳转 `/login`。

## 5. `src/stores` 的职责
- 管理全局/跨页面状态。
- 当前主要用于后台 UI 状态（如侧边栏折叠）。
- 后续如有业务状态，按模块拆分 store。
- `auth.ts` 用于认证与路由访问控制 v1 mock，管理 mock token、用户信息和 localStorage 登录态恢复。普通业务列表数据不迁入 Pinia。

## 6. `src/config` 的职责
- 存放相对稳定的配置数据。
- 当前用于菜单配置。
- 后续可扩展为常量配置、枚举映射等。

## 7. `src/types` 的职责
- 存放全局类型、模块类型与声明文件。
- 业务对象、接口返回结构应逐步收敛到类型定义。

## 8. `src/styles` 的职责
- 存放全局基础样式（reset、基础布局、通用页面类、主题变量）。
- 不承载大量具体业务页面样式。

## 8.1 `src/utils` 的职责
- 存放不依赖具体业务模块的轻量前端工具。
- `debounce.ts` 提供支持取消待执行任务的防抖函数，供列表 keyword 输入自动搜索和组件卸载清理使用。

## 9. `src/api` 或 `src/services` 的预期职责
- `src/api`（计划新增）：按业务模块封装接口请求。
- `src/services`（当前已存在）：可承载服务封装与请求调用逻辑。
- 当前后端已提供 TestRecord CRUD 接口，但前端 ChatTest service 尚未替换；其他业务接口仍处于预留/待完善状态。
- `services/auth.ts` 当前封装 mock 登录与退出登录，后续接 FastAPI 后优先替换其内部实现。

## 10. 全局样式使用边界
- 全局样式仅用于：基础布局、reset、通用类、主题变量。
- 页面级业务样式优先写在页面组件的 scoped CSS。
- 不应把页面私有样式大量堆到 `src/styles/index.css`。

## 11. 页面开发流程建议
1. 在 `src/views` 新建页面骨架（`XxxView.vue`）。
2. 在 `src/router` 注册路由并配置 `meta`。
3. 如需菜单入口，在 `src/config/menu.ts` 增加菜单项。
4. 页面内先定义类型和数据结构，再补交互与展示。
5. 若涉及接口，统一放到 `src/api` 或 `src/services`。
6. 完成后同步更新 README、roadmap 和 development-log。

## 12. 后续新增模块时的放置规则
- 新页面：`src/views/<module>/XxxView.vue`
- 页面子组件：优先放 `src/views/<module>/components`
- 全局可复用组件：`src/components`（当前目录可按需新增）
- 模块 store：`src/stores/<module>.ts`
- 模块类型：`src/types/<module>.ts`
- 模块接口：`src/api/<module>.ts`（计划）或 `src/services/<module>.ts`

说明：当前项目处于前端骨架阶段，复杂架构与分层将在业务实现过程中逐步落地。

## 13.前端技术债
1. dashboard模块
- src/views/dashboard/DashboardView.vue 目前没有 loading 状态，不过 mock 数据很快返回，所以目前不加也行。以后接真实接口时再加类似：

const loading = ref(false)

表格和卡片可以显示加载状态。
- overview.stats 的 key 用 item.label 可以暂时接受。
后面如果提示词数量这种 label 会变，最好给 stat 加一个 key 字段，比如：

key: 'prompts'

2.prompt提示词模块
- prompt页面操作后期需要和dashboard的最近操作的表格绑定。

3.knowledge知识库模块
- `frontend/src/views/knowledge/KnowledgeListView.vue` 承载知识库管理 v1 mock 页面。
- `frontend/src/views/knowledge/components/` 放置知识库页面局部组件，例如表单弹窗与摘要预览抽屉。
- `frontend/src/services/knowledge.ts` 封装知识库 mock service，后续接后端时优先替换 service 内部实现。
- `frontend/src/types/knowledge.ts` 定义知识库文档元数据、来源类型、启用状态筛选与 mock 向量化状态类型。
- 当前知识库模块不真实上传文件、不真实切片、不调用 embedding、不接向量数据库、不做真实 RAG。

4.auth认证模块
- `frontend/src/views/login/LoginView.vue` 承载 mock 登录页。
- `frontend/src/services/auth.ts` 封装 mock 登录与退出登录，后续接后端时优先替换 service 内部实现。
- `frontend/src/stores/auth.ts` 管理 mock token、用户信息和 localStorage 登录态恢复。
- `frontend/src/router/index.ts` 通过 `beforeEach` 做后台路由访问控制。
- 当前认证模块不接后端、不做真实 JWT 校验、不做 RBAC、不做菜单权限或按钮权限。

## 14. 后端骨架状态

- `backend/` 当前包含 FastAPI Phase 2.1 最小骨架与 Phase 2.2 TestRecord 持久化接口，不属于前端业务目录。
- 后端当前包含 app 入口、基础配置、SQLite / SQLAlchemy 连接、`/api/v1` 路由入口、health check，以及 TestRecord 创建、分页列表、详情和删除接口。
- 前端 `src/services` 仍保持现有 mock service，ChatTest 页面链路仍使用前端 mock records，尚未接入后端 TestRecord CRUD。
- 后端已实现 TestRecord CRUD；ChatTest stream、真实 LLM、真实 RAG、真实认证 / JWT / RBAC 仍未实现。
- 下一步是替换前端 ChatTest record service，而不是从零实现后端 TestRecord 接口。
- 后续接入后端时，应优先替换对应模块 service 内部实现，避免直接在 View 中写接口调用。
