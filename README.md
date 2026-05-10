# PromptHub Admin

## 项目简介
PromptHub Admin 是一个基于 Vue3 + TypeScript + Vite + Element Plus 的 AI 提示词与知识库管理后台。

本项目当前处于开发中，定位为个人学习、作品集展示与 AI 应用后台能力实践。当前以后台骨架和前端工程结构为主，业务功能仍在逐步实现。

## 技术栈
- Vue 3
- TypeScript
- Vite
- Element Plus
- Vue Router
- Pinia（已创建基础 store）

## 当前已完成内容
- 前端基础布局
- 路由结构整理
- 侧边栏菜单配置
- 页面骨架（Dashboard、提示词管理、知识库管理、模型配置、对话测试、系统设置；当前仅包含基础标题与页面容器）
- Dashboard 首页 mock 数据看板（当前为 mock 数据，后端待接入）
- 提示词管理列表展示与筛选（当前为 mock 数据，后端待接入；新增、编辑、删除仍待实现）
- Element Plus 基础接入

## 计划功能
- Dashboard 真实接口数据看板
- 提示词管理 CRUD
- 知识库管理
- 模型配置
- 对话测试
- FastAPI 后端接口
- 登录与权限控制
- README、截图和部署说明完善

## 本地启动方式
1. 安装依赖
```bash
npm install
```
2. 启动开发环境
```bash
npm run dev
```
3. 构建检查
```bash
npm run build
```

## 目录结构说明
```text
prompthub-admin/
├─ frontend/                     # 前端工程
│  ├─ src/
│  │  ├─ layout/                 # 后台布局与布局子组件
│  │  ├─ views/                  # 页面视图（当前多为骨架页）
│  │  ├─ components/             # 全局组件
│  │  ├─ router/                 # 路由配置
│  │  ├─ config/                 # 配置（如菜单）
│  │  ├─ stores/                 # 状态管理
│  │  ├─ styles/                 # 全局样式
│  │  ├─ types/                  # 类型声明
│  │  ├─ services/               # 预留：接口与服务层（后端接入后逐步完善）
│  │  ├─ App.vue
│  │  └─ main.ts
│  └─ ...
├─ docs/                         # 项目文档
├─ README.md
└─ AGENTS.md
```

## 开发规范
- 保持小步迭代：每次只完成一个小任务。
- 不夸大完成度：未实现功能必须标注为计划中。
- 业务逻辑与页面展示分层，避免把复杂逻辑直接堆在页面文件。
- 使用 TypeScript 类型约束，避免滥用 `any`。
- 文档与代码同步更新，至少维护开发日志。

## 项目状态说明
- 当前状态：开发中（前端骨架阶段）
- 页面状态：部分页面为骨架页面，业务功能待实现
- 数据状态：当前无真实接口数据
- 后端状态：后端待接入
- 项目容器化：计划中，后续考虑补充 Dockerfile 与 docker-compose 配置

## 当前限制
- 当前页面以骨架和布局为主，暂未实现完整业务交互。
- 当前数据仍未接入真实后端接口。
- 当前暂无登录、权限控制和接口鉴权。
- 当前暂未接入 Docker 部署流程。
