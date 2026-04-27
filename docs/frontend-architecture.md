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

## 4. `src/router` 的职责
- 统一维护前端路由配置。
- 管理后台主布局与各页面入口映射。
- 路由变更应保持与菜单和页面目录同步。

## 5. `src/stores` 的职责
- 管理全局/跨页面状态。
- 当前主要用于后台 UI 状态（如侧边栏折叠）。
- 后续如有业务状态，按模块拆分 store。

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

## 9. `src/api` 或 `src/services` 的预期职责
- `src/api`（计划新增）：按业务模块封装接口请求。
- `src/services`（当前已存在）：可承载服务封装与请求调用逻辑。
- 当前后端待接入，因此接口层仍处于预留/待完善状态。

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
