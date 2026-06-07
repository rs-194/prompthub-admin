# PromptHub Admin

面向大模型应用开发的 AI Prompt 调试与记录管理平台。

## 项目简介

普通 AI 对话工具通常只能看到单次回答，很难系统记录一次 Prompt 调试中使用的 Prompt 模板、模型参数、知识库上下文和输出结果。PromptHub Admin 围绕 ChatTest 调试链路，提供真实 LLM 流式输出、测试记录持久化、详情复盘和双记录对比，帮助开发者把一次次 Prompt 调试沉淀为可追踪、可复盘的记录。

当前项目适合作为前端实习 / AI 前端方向作品集项目展示：重点体现 Vue3 + TypeScript 前端工程能力、流式响应消费、前后端接口联调和 AI 调试业务链路设计。

更完整的展示说明见 [docs/project-showcase.md](docs/project-showcase.md)。

## 核心功能

### ChatTest 调试台

- Prompt / Model / Knowledge 配置源选择。
- Prompt 模板来自后端持久化数据源。
- 参数配置：temperature / maxTokens / outputFormat。
- 真实 LLM 流式输出。
- fetch stream + NDJSON 逐段渲染。
- AbortController 停止生成。
- loading / error / result 状态处理。

### TestRecord 测试记录

- 后端持久化。
- 列表分页 / keyword 查询。
- 列表只展示 outputPreview。
- 详情 Drawer 按需加载完整 output。
- 双记录对比 Drawer。

### 后端能力

- FastAPI 后端。
- TestRecord CRUD。
- ChatTest run 非流式接口。
- ChatTest stream 流式接口。
- 后端 .env 读取 LLM 配置。
- API Key 不进前端。

### 工程化

- Vue3 + TypeScript + Vite。
- Element Plus。
- 前端 service / types / components 分层。
- FastAPI router / service / schema / model 分层。
- Vite proxy。
- request 封装。
- 模块文档与开发日志。

## 技术栈

### 前端

- Vue3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- fetch stream / ReadableStream

### 后端

- FastAPI
- SQLAlchemy
- SQLite
- httpx
- python-dotenv
- StreamingResponse

## 核心链路

```text
Prompt / 参数 / 知识库上下文
→ 前端 ChatTest
→ FastAPI /api/v1/chat-test/stream
→ 后端代理 LLM API
→ 前端流式渲染
→ 后端保存 TestRecord
→ 列表 / 详情 / 对比复盘
```

## 本地启动

### 后端

```bash
cd backend
copy .env.example .env
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

复制 `backend/.env.example` 为 `backend/.env` 后，填写本地模型服务配置：

```text
LLM_BASE_URL=你的 OpenAI-compatible API 地址
LLM_API_KEY=你的 API Key
LLM_MODEL=你的模型名称
```

不要在 README、前端代码或提交记录中展示真实 API Key。

后端健康检查：

```text
http://127.0.0.1:8000/api/v1/health
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

开发环境已配置 Vite proxy：前端请求 `/api/...` 会转发到 `http://127.0.0.1:8000`。

## 环境变量说明

| 变量 | 说明 |
| --- | --- |
| LLM_BASE_URL | OpenAI-compatible 模型服务地址 |
| LLM_API_KEY | 模型服务 API Key，仅放在后端环境变量中 |
| LLM_MODEL | 后端实际调用的模型名称 |
| LLM_TEMPERATURE | 默认 temperature 配置 |
| LLM_MAX_TOKENS | 默认 max tokens 配置 |
| LLM_TIMEOUT_SECONDS | 后端调用模型服务的超时时间 |

说明：

- `backend/.env` 不提交。
- `backend/.env.example` 可以提交。
- 修改 `.env` 后需要重启后端。
- 前端不保存、不展示、不透传真实 `LLM_API_KEY`。

## 当前完成度

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| ChatTest 真实流式输出 | 已完成 | fetch stream + NDJSON |
| TestRecord 持久化 | 已完成 | FastAPI + SQLite |
| 详情 Drawer | 已完成 | 按需加载完整 output |
| 双记录对比 | 已完成 | 基于历史 TestRecord |
| Knowledge 后端化轻量版 | 已完成 | 文档 CRUD + ChatTest 手动上下文 |
| Prompt 后端化轻量版 | 已完成 | PromptTemplate CRUD + ChatTest 使用完整模板内容 |
| 真实 RAG | 未完成 | 后续计划 |
| ModelConfig 状态展示 | 已完成 | 只读脱敏状态，不做 CRUD |
| auth / RBAC | 未完成 | 后续计划 |

## 项目边界

- Prompt / Knowledge 已使用后端持久化数据源；ModelConfig 当前是后端可信 LLM 配置状态展示，不是完整模型配置 CRUD。
- knowledgeContext 来自用户手动选择的后端文档，不是真实 RAG，不做 embedding、向量检索、自动召回或排序。
- 双记录对比基于历史 TestRecord，不是多模型并发生成，不做多路 stream，也不新增 compareGroup 后端表。
- API Key 当前由后端环境变量托管，不做前端密文存储。
- 当前不是完整企业级多租户系统，不包含真实 JWT / RBAC / Workspace。

## 后续规划

1. 记录详情 / 对比继续优化。
2. failed / stopped record 保存策略。
3. 简单关键词检索或真实 RAG / embedding 方案设计。
4. auth / Workspace / 多租户。

## 简历项目描述参考

### 当前版本

- 基于 Vue3 + TypeScript + Element Plus 实现 AI Prompt 调试台，支持 Prompt、模型参数与知识库上下文选择。
- 通过 fetch stream + ReadableStream 消费 FastAPI 返回的 NDJSON 流式响应，实现模型输出逐段渲染和 AbortController 停止生成。
- 设计 TestRecord 测试记录链路，支持后端持久化、列表 outputPreview 展示、详情 Drawer 按需加载完整 output。
- 实现基于历史 TestRecord 的双记录对比 Drawer，支持并排复盘两次 Prompt 调试的输入、参数、上下文和完整输出。
- 实现 Knowledge 文档后端 CRUD，并让 ChatTest 手动选择启用文档作为模型上下文。
- 实现 Prompt 模板后端 CRUD，并让 ChatTest 使用启用模板详情中的完整 content 作为 systemPrompt。
- 将真实 API Key 托管在后端 `.env` / 环境变量中，前端只通过 `/api` 代理调用后端接口。
- 按 service / types / components 拆分前端模块，配套维护模块文档、路线图和开发日志。

### 后续增强版

- 在现有手动 Knowledge 上下文基础上，设计关键词检索或 embedding / RAG 检索能力。
- 在保持 API Key 后端托管的前提下，继续扩展模型配置管理和检索结果追踪。

## 文档入口

- [前端架构说明](docs/frontend-architecture.md)
- [模块设计文档索引](docs/modules/README.md)
- [路线图](docs/roadmap.md)
- [开发记录](docs/development-log.md)
- [项目展示说明](docs/project-showcase.md)

## Phase 2.8 轻量 ModelConfig 展示

- 已新增 `GET /api/v1/model-config`，用于读取后端可信 LLM 环境配置状态。
- 前端模型配置页面已展示 provider、model、baseUrlHost、enabled、API Key 是否已配置、temperature、maxTokens 和 timeoutSeconds。
- API Key 只由后端 `.env` / 环境变量托管，接口不返回明文 key、Authorization 或 headers。
- 前端只显示“API Key 已配置 / 未配置”，不提供 API Key 输入框。
- 前端 mock 模型列表仍保留为展示用数据，不会改变后端真实 `LLM_MODEL`。
- 当前仍不支持 ModelConfig CRUD、多用户模型配置、多 provider 管理、API Key 加密存储、真实 RAG、auth / RBAC 或 Workspace。

## Phase 2.9 Knowledge 后端化轻量版

- 已新增 KnowledgeDocument 后端表和 `/api/v1/knowledge-documents` CRUD。
- 列表只返回 `contentPreview`，详情接口按需返回完整 `content`。
- Knowledge 页面已从前端 mock 数据迁移到后端持久化数据源。
- ChatTest 可手动选择启用中的后端文档，并缓存详情后拼接 `knowledgeContext`。
- 当前不是 RAG，不做 embedding、向量数据库、自动召回、文件上传或文档解析。

## Phase 2.11 Prompt 后端化轻量版

- 已新增 PromptTemplate 后端表和 `/api/v1/prompt-templates` CRUD。
- 列表只返回 `contentPreview`，详情接口按需返回完整 `content`。
- Prompt 管理页面已从前端 mock 数据迁移到后端持久化数据源。
- ChatTest 加载启用中的后端 Prompt 模板，并在选择或运行时按需请求详情、缓存完整 `content`。
- 运行 ChatTest 时使用后端 Prompt 详情中的完整 `content` 作为 `systemPrompt`。
- 当前不做 Prompt 版本管理、diff、变量解析引擎、marketplace、审核流、多租户、auth / RBAC 或 Workspace。
