# 开发记录（Development Log）

## 1. 开发记录说明
本文件用于持续记录项目开发过程中的关键变更，便于回溯与协作。

记录原则：
- 每次代码改动后追加一条记录。
- 记录应包含：变更内容、影响范围、验证方式。
- 不夸大完成度，未完成内容必须明确标注。

## 2. 开发记录模板
```md
### YYYY-MM-DD：本次变更标题

内容：
- 变更点 1
- 变更点 2

影响范围：
- 目录/模块 A
- 目录/模块 B

验证方式：
- npm run build 通过
- npm run dev 页面可正常访问
```

## 3. 当前开发记录

### 2026-04-27：项目骨架整理

内容：
- 整理后台项目目录结构
- 新增 AdminLayout
- 将布局组件整理到 src/layout
- 新增 config/menu.ts
- 重构基础路由
- 新增 dashboard、prompts、knowledge、models、chat-test、settings 页面骨架
- 新增 stores/app.ts 管理侧边栏折叠状态

影响范围：
- 前端目录结构
- 路由
- 布局
- 菜单配置
- 页面骨架

验证方式：
- npm run build 通过
- npm run dev 可正常启动

### 2026-04-27：基础布局修复

内容：
- 修复页面没有铺满浏览器的问题
- 修复右侧大面积黑色空白问题
- 调整后台左右布局
- 统一 Header、Aside、Content、Footer 区域
- 新增 page-card 通用页面壳样式
- 统一页面标题可读性

影响范围：
- 全局样式
- 后台布局组件
- 页面骨架样式

验证方式：
- npm run build 通过
- npm run dev 页面显示正常

### 2026-05-08：Dashboard 首页 mock 数据看板

内容：
- 新增 Dashboard 相关类型 `types/dashboard.ts`
- 新增 Dashboard 数据服务 `services/dashboard.ts`，当前为 mock 数据，后端待接入
- 新增 Dashboard 统计卡片组件 `StatCard.vue`
- 完善 Dashboard 首页，展示统计卡片和最近操作记录表格

影响范围：
- frontend/src/views/dashboard
- frontend/src/services
- frontend/src/types
- docs/roadmap.md

验证方式：
- npm run build
- 启动项目后访问 `/dashboard`，检查统计卡片和最近操作记录表格是否正常显示

### 2026-05-08：提示词管理列表展示与筛选

内容：
- 新增提示词管理类型 `frontend/src/types/prompt.ts`
- 新增提示词管理数据服务 `frontend/src/services/prompt.ts`，当前为 mock 数据，后端待接入
- 完善 `frontend/src/views/prompts/PromptListView.vue`，支持提示词列表展示、搜索和分类筛选

影响范围：
- frontend/src/views/prompts
- frontend/src/services
- frontend/src/types
- docs/roadmap.md
- README.md

验证方式：
- npm run build
- 启动项目后访问 `/prompts`，检查提示词列表、搜索、分类筛选和重置按钮是否正常可用

### 2026-05-08：提示词管理页面代码风格统一

内容：
- 统一 `frontend/src/views/prompts/PromptListView.vue` 中 Element Plus 组件为 kebab-case 写法
- 移除提示词管理页面中不必要的 Element Plus 组件手动 import
- 调整表格插槽参数写法，不在 template 插槽参数中添加 TypeScript 类型标注
- 本次不涉及功能变化，不涉及 UI 变化

影响范围：
- frontend/src/views/prompts/PromptListView.vue

验证方式：
- npm run build
- 启动项目后访问 `/prompts`，确认列表、搜索、分类筛选和重置仍正常可用

### 2026-05-10：提示词管理 mock CRUD

内容：
- 新增 `frontend/src/views/prompts/components/PromptFormDialog.vue`，用于提示词新增和编辑弹窗
- 扩展 `frontend/src/types/prompt.ts`，补充 `PromptFormData` 和 `PromptDialogMode`
- 扩展 `frontend/src/services/prompt.ts`，新增 create/update/delete mock CRUD 方法
- 完善 `frontend/src/views/prompts/PromptListView.vue`，支持新增、编辑、删除和删除确认
- 当前仍为前端 mock 数据，刷新页面后不保证持久化，后端待接入

影响范围：
- frontend/src/views/prompts
- frontend/src/services/prompt.ts
- frontend/src/types/prompt.ts
- docs/roadmap.md
- README.md
- notes/interview

验证方式：
- npm run build
- 启动项目后访问 `/prompts`，测试新增、编辑、删除，以及 CRUD 后搜索和分类筛选是否仍可用

### 2026-05-11：模型配置 mock 管理

内容：
- 新增 `frontend/src/types/model.ts`，定义模型供应商、模型配置项、表单数据和弹窗模式类型
- 新增 `frontend/src/services/model.ts`，封装模型配置 mock 列表、新增、编辑、删除和启用/停用方法
- 新增 `frontend/src/views/models/components/ModelConfigDialog.vue`，用于模型配置新增和编辑弹窗
- 完善 `frontend/src/views/models/ModelConfigView.vue`，支持模型配置列表、搜索、供应商筛选、新增/编辑/删除和启用/停用
- 当前为前端 mock 数据，刷新页面后不保证持久化，后端待接入，不真实调用模型 API，不保存 API Key

影响范围：
- frontend/src/views/models
- frontend/src/services/model.ts
- frontend/src/types/model.ts
- docs/roadmap.md
- README.md
- notes/interview

验证方式：
- npm run build
- 启动项目后访问 `/models`，测试新增、编辑、删除、启用/停用，以及 CRUD 后搜索和供应商筛选是否仍可用
