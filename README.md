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
- FastAPI（后端骨架、TestRecord 持久化和真实 LLM 非流式调用接口已建立）
- SQLite + SQLAlchemy（当前仅完成基础连接配置）

## 当前已完成内容
- 前端基础布局
- 路由结构整理
- 侧边栏菜单配置
- 页面骨架（Dashboard、提示词管理、知识库管理、模型配置、对话测试、系统设置；当前仅包含基础标题与页面容器）
- Dashboard 首页 mock 数据看板（当前为 mock 数据，后端待接入）
- 提示词管理列表展示、搜索、分类筛选与新增/编辑/删除 mock CRUD（当前为 mock 数据，刷新页面后不保证持久化，后端待接入）
- 模型配置 mock 管理，支持模型配置列表、搜索、供应商筛选、新增/编辑/删除与启用/停用（当前为 mock 数据，后端待接入，不真实调用模型 API）
- 对话测试 / Prompt 调试台已接入后端真实 LLM 调用，保留 `POST /api/v1/chat-test/run` 非流式接口，并新增 `POST /api/v1/chat-test/stream` 真实 fetch stream + StreamingResponse + NDJSON 流式输出；支持选择提示词模板、选择启用模型配置、选择启用中的知识库文档作为 mock context、设置 temperature / maxTokens / outputFormat 测试参数、逐段展示真实 output、使用 AbortController 停止生成，并在正常完成后使用后端返回的 record 更新最近测试记录（Prompt / Model / Knowledge 仍是前端配置源；当前不是原生 EventSource SSE，不做真实 RAG；用户主动停止时 v1 不保存 stopped 记录）
- 知识库管理 v1 mock，支持知识库文档元数据列表、搜索、分类筛选、状态筛选、新增/编辑/删除、启用/停用、摘要与 mock 切片信息查看（当前为 mock 数据，后端待接入，不真实上传文件，不真实切片，不调用 embedding，不接向量数据库，不做真实 RAG）
- 认证与路由访问控制 v1 mock，支持 `/login` 登录页、mock 账号登录、Pinia auth store、localStorage mock 登录态恢复、后台路由守卫、Header 用户展示与退出登录（当前为 mock 登录，后端待接入，不做真实 JWT 校验，不做 RBAC）
- FastAPI 后端 Phase 2.1 最小骨架、Phase 2.2 TestRecord 持久化接口、Phase 2.3 真实 LLM 非流式调用接口、Phase 2.4 前端 ChatTest run 接入与 Phase 2.5 真实流式输出，包含 CORS、SQLite / SQLAlchemy 基础连接、`/api/v1` 路由入口、`GET /api/v1/health` 健康检查接口、测试记录 CRUD、`POST /api/v1/chat-test/run` 非流式调用，以及 `POST /api/v1/chat-test/stream` fetch stream + NDJSON 流式调用并在正常完成后保存 TestRecord（当前未实现真实 RAG / auth）
- Element Plus 基础接入

## 计划功能
- Dashboard 真实接口数据看板
- 提示词管理真实后端 CRUD 接口接入
- 知识库管理真实后端接入、文件上传、文本切片、embedding、向量检索与 RAG 调试
- 模型配置真实后端接口接入与真实模型调用能力
- 对话测试测试记录详情、对比能力与 stream 错误恢复优化
- FastAPI 后端接口：Prompt / Model / Knowledge 后端迁移、真实 RAG、真实接口联调
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
开发环境已配置 Vite proxy：前端请求 `/api/...` 会转发到 `http://127.0.0.1:8000`。如需绕过 dev proxy 直连其他后端地址，可在前端环境变量中配置 `VITE_API_BASE_URL`，但不要在前端配置 `LLM_API_KEY` 或真实模型服务 baseURL。

3. 构建检查
```bash
npm run build
```

### 后端

当前后端包含 Phase 2.1 骨架、Phase 2.2 TestRecord 持久化接口、Phase 2.3 真实 LLM 非流式调用接口和 Phase 2.5 真实 fetch stream 流式接口：

```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env
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

ChatTest 真实运行接口：

```text
POST /api/v1/chat-test/run
POST /api/v1/chat-test/stream
```

LLM 环境变量：

```text
LLM_BASE_URL
LLM_API_KEY
LLM_MODEL
LLM_TEMPERATURE
LLM_MAX_TOKENS
LLM_TIMEOUT_SECONDS
```

说明：本地开发时可复制 `backend/.env.example` 为 `backend/.env`，再把真实 `LLM_API_KEY` 写入 `backend/.env`；后端启动时会自动读取 `backend/.env`，不是项目根目录 `.env`。`backend/.env` 和真实 API Key 不提交，`backend/.env.example` 可以提交；修改 `.env` 后需要重启 uvicorn。前端普通 JSON API 通过 `frontend/src/services/request.ts` 统一封装；`/chat-test/stream` 继续使用 fetch stream + FastAPI StreamingResponse + NDJSON，不是原生 EventSource SSE，也不改为普通请求封装；当前不是真实 RAG；`modelName` 当前只用于测试记录展示字段，真实调用使用后端 `LLM_MODEL`。

## 目录结构说明
```text
prompthub-admin/
├─ backend/                      # FastAPI 后端骨架、TestRecord 持久化与真实 LLM 调用（Phase 2.1 / 2.2 / 2.3 / 2.5）
│  ├─ app/
│  │  ├─ api/v1/                 # v1 API 路由入口与 health check
│  │  ├─ core/                   # 基础配置
│  │  ├─ db/                     # SQLite / SQLAlchemy 基础连接
│  │  ├─ modules/                # 后端业务模块（当前包含 test_records、llm_provider、chat_test）
│  │  └─ main.py                 # FastAPI app 入口
│  ├─ .env.example               # 后端 LLM 环境变量示例，可提交；真实 backend/.env 不提交
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
- 当前状态：开发中（前端部分 mock + 后端真实 run / stream 接口接入阶段）
- 页面状态：部分页面为骨架页面，业务功能待实现
- 数据状态：Prompt / Model / Knowledge 等前端业务数据仍为 mock；ChatTest 运行已接入后端真实 LLM run / stream 接口，并使用后端返回的 record 更新最近测试记录
- 后端状态：FastAPI 最小骨架、TestRecord CRUD、ChatTest 真实 LLM 非流式调用接口与真实 fetch stream 流式接口已建立；真实 RAG、真实认证仍待实现
- 项目容器化：计划中，后续考虑补充 Dockerfile 与 docker-compose 配置

## 当前限制
- 当前页面以骨架和布局为主，暂未实现完整业务交互。
- 当前 Prompt / Model / Knowledge 等业务数据仍未接入真实后端业务接口；ChatTest run / stream 已接入后端真实 LLM 接口。
- 当前仅支持 mock 登录与前端路由守卫，暂无真实后端鉴权、RBAC 和接口鉴权。
- 当前后端已实现真实 LLM 非流式调用和真实 fetch stream 流式输出；当前未实现真实 RAG 或真实认证；Prompt / Model / Knowledge 模块仍未迁移到后端。
- 当前暂未接入 Docker 部署流程。
