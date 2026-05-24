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
- FastAPI（后端骨架已建立）
- SQLite + SQLAlchemy（当前仅完成基础连接配置）

## 当前已完成内容
- 前端基础布局
- 路由结构整理
- 侧边栏菜单配置
- 页面骨架（Dashboard、提示词管理、知识库管理、模型配置、对话测试、系统设置；当前仅包含基础标题与页面容器）
- Dashboard 首页 mock 数据看板（当前为 mock 数据，后端待接入）
- 提示词管理列表展示、搜索、分类筛选与新增/编辑/删除 mock CRUD（当前为 mock 数据，刷新页面后不保证持久化，后端待接入）
- 模型配置 mock 管理，支持模型配置列表、搜索、供应商筛选、新增/编辑/删除与启用/停用（当前为 mock 数据，后端待接入，不真实调用模型 API）
- 对话测试 / Prompt 调试台 v3 mock，支持选择提示词模板、选择启用模型配置、选择启用中的知识库文档作为 mock context、设置 temperature / maxTokens / outputFormat 测试参数、前端 timer 模拟分段流式输出、停止生成并生成包含参数摘要的前端内存测试记录（当前为 mock 数据，后端待接入，不真实调用模型 API，不做真实 SSE，不做真实 RAG）
- 知识库管理 v1 mock，支持知识库文档元数据列表、搜索、分类筛选、状态筛选、新增/编辑/删除、启用/停用、摘要与 mock 切片信息查看（当前为 mock 数据，后端待接入，不真实上传文件，不真实切片，不调用 embedding，不接向量数据库，不做真实 RAG）
- 认证与路由访问控制 v1 mock，支持 `/login` 登录页、mock 账号登录、Pinia auth store、localStorage mock 登录态恢复、后台路由守卫、Header 用户展示与退出登录（当前为 mock 登录，后端待接入，不做真实 JWT 校验，不做 RBAC）
- FastAPI 后端 Phase 2.1 最小骨架与 Phase 2.2 TestRecord 持久化接口，包含 CORS、SQLite / SQLAlchemy 基础连接、`/api/v1` 路由入口、`GET /api/v1/health` 健康检查接口，以及测试记录创建、分页列表、详情和删除接口（当前未接前端，未实现 ChatTest stream、真实 LLM / RAG / auth）
- Element Plus 基础接入

## 计划功能
- Dashboard 真实接口数据看板
- 提示词管理真实后端 CRUD 接口接入
- 知识库管理真实后端接入、文件上传、文本切片、embedding、向量检索与 RAG 调试
- 模型配置真实后端接口接入与真实模型调用能力
- 对话测试真实模型调用、参数扩展与测试记录持久化
- FastAPI 后端接口：ChatTest stream、真实接口联调、Prompt / Model / Knowledge 后端迁移
- 登录与权限控制真实后端接入、真实 token 校验与权限能力
- README、截图和部署说明完善

## 本地启动方式
### 前端

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

### 后端

当前后端包含 Phase 2.1 骨架和 Phase 2.2 TestRecord 持久化接口：

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

健康检查地址：

```text
http://localhost:8000/api/v1/health
```

测试记录接口：

```text
GET /api/v1/test-records
GET /api/v1/test-records/{id}
POST /api/v1/test-records
DELETE /api/v1/test-records/{id}
```

## 目录结构说明
```text
prompthub-admin/
├─ backend/                      # FastAPI 后端骨架与 TestRecord 持久化（Phase 2.1 / 2.2）
│  ├─ app/
│  │  ├─ api/v1/                 # v1 API 路由入口与 health check
│  │  ├─ core/                   # 基础配置
│  │  ├─ db/                     # SQLite / SQLAlchemy 基础连接
│  │  ├─ modules/                # 后端业务模块（当前包含 test_records）
│  │  └─ main.py                 # FastAPI app 入口
│  ├─ requirements.txt
│  └─ README.md
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
│  │  ├─ services/               # 服务层（当前包含 mock service，后端接入后逐步替换）
│  │  ├─ App.vue
│  │  └─ main.ts
│  └─ ...
├─ docs/                         # 项目文档
├─ README.md
└─ AGENTS.md
```

## 文档与学习笔记
- `docs/` 存放项目公开文档，包括项目说明、架构、路线和开发记录。
- `notes/` 存放个人学习笔记与面试复习内容，用于辅助理解项目代码。
- `notes/` 是否随项目公开，可根据实际需要决定。

## 开发规范
- 保持小步迭代：每次只完成一个小任务。
- 不夸大完成度：未实现功能必须标注为计划中。
- 业务逻辑与页面展示分层，避免把复杂逻辑直接堆在页面文件。
- 使用 TypeScript 类型约束，避免滥用 `any`。
- 文档与代码同步更新，至少维护开发日志。

## 项目状态说明
- 当前状态：开发中（前端 mock + 后端骨架阶段）
- 页面状态：部分页面为骨架页面，业务功能待实现
- 数据状态：前端业务数据仍为 mock；后端 TestRecord 已具备持久化接口，但前端尚未替换 service
- 后端状态：FastAPI 最小骨架与 TestRecord CRUD 已建立；ChatTest stream、真实 LLM、真实 RAG、真实认证仍待实现
- 项目容器化：计划中，后续考虑补充 Dockerfile 与 docker-compose 配置

## 当前限制
- 当前页面以骨架和布局为主，暂未实现完整业务交互。
- 当前数据仍未接入真实后端业务接口。
- 当前仅支持 mock 登录与前端路由守卫，暂无真实后端鉴权、RBAC 和接口鉴权。
- 当前后端未实现 ChatTest stream、真实 LLM、真实 RAG 或真实认证；Prompt / Model / Knowledge 模块仍未迁移到后端。
- 当前暂未接入 Docker 部署流程。
