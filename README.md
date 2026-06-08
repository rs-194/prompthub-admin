# PromptHub Admin

PromptHub Admin：面向大模型应用开发的 AI Prompt 调试与记录管理平台。

## 项目简介

PromptHub Admin 聚焦 Prompt 调试主链路：把后端 Prompt 模板、手动选择的 Knowledge 上下文、后端可信模型配置状态、真实 LLM 流式输出和 TestRecord 复盘串成一个可演示、可讲解的 AI 前端项目。

项目适合用于前端 / AI 前端实习投递。当前重点不是包装成完整企业平台，而是清楚展示 Vue3 + TypeScript 前端分层、流式输出渲染、接口联调、记录复盘和边界表达能力。

更多展示说明见 [docs/project-showcase.md](docs/project-showcase.md)，面试讲解材料见 [docs/interview/project-story.md](docs/interview/project-story.md)。

## 当前核心能力

- Prompt 模板后端 CRUD：支持 PromptTemplate 持久化、分页、筛选、启用状态和详情按需加载。
- Knowledge 文档后端 CRUD：支持 KnowledgeDocument 持久化、分页、筛选、启用状态和详情按需加载。
- ModelConfig 后端可信配置状态展示：读取后端环境配置状态，只展示脱敏信息。
- Dashboard 真实统计概览：通过后端 summary 接口展示 Prompt、Knowledge、TestRecord、ModelConfig 和最近测试记录。
- ChatTest 真实流式调试：通过 fetch stream / ReadableStream 消费 FastAPI 返回的 NDJSON。
- 手动选择 Knowledge 上下文：ChatTest 可选择启用中的后端 Knowledge 文档并拼入上下文。
- TestRecord 保存、详情、对比：正常完成后保存记录，列表展示 preview，详情 Drawer 按需加载完整 output，支持双记录对比 Drawer。

## 核心链路图

```text
PromptTemplate
+ KnowledgeDocument
+ ModelConfig
→ ChatTest
→ FastAPI stream
→ LLM API
→ NDJSON 流式渲染
→ TestRecord
→ 详情 / 对比复盘
```

## 项目收获

- 更清楚地区分 AI Prompt 调试平台和普通聊天页：重点不只是对话，而是 Prompt、上下文、模型状态和记录复盘。
- 实践 Vue3 + TypeScript 下 views / components / services / types 的分层组织，减少页面内请求和类型逻辑堆积。
- 掌握 fetch stream / ReadableStream / NDJSON 的浏览器端流式渲染方式。
- 理解 preview / detail 分离、API Key 不进入前端这类接口与安全边界。

## 技术栈

### 前端

- Vue3
- TypeScript
- Vite
- Element Plus
- Vue Router
- Pinia
- fetch stream / ReadableStream
- 类型封装
- 组件拆分
- 错误与 loading 状态管理

### 后端

- FastAPI
- SQLAlchemy
- SQLite
- httpx
- StreamingResponse
- python-dotenv

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

开发环境已配置 Vite proxy，前端请求 `/api/...` 会转发到 `http://127.0.0.1:8000`。

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
| Prompt 模板后端 CRUD | 已完成 | PromptTemplate CRUD + ChatTest 使用完整模板内容 |
| Knowledge 文档后端 CRUD | 已完成 | 文档 CRUD + ChatTest 手动上下文 |
| ModelConfig 状态展示 | 已完成 | 只读脱敏状态，不做 CRUD |
| Dashboard 真实统计概览 | 已完成 | 后端 summary + 最近 TestRecord，不返回完整 output |
| ChatTest 真实流式输出 | 已完成 | fetch stream + NDJSON |
| TestRecord 持久化 | 已完成 | FastAPI + SQLite |
| TestRecord 详情 Drawer | 已完成 | 按需加载完整 output |
| TestRecord 双记录对比 | 已完成 | 基于历史 TestRecord |
| 真实 RAG | 未完成 | 后续规划 |
| auth / RBAC / 多租户 | 未完成 | 后续规划 |

## 项目边界

- 当前不是完整 RAG。
- Knowledge 是用户手动选择的上下文，不是自动召回。
- 当前不做 embedding、向量数据库、相似度排序、文件上传或文档解析。
- Prompt 不支持版本管理、diff、变量引擎、marketplace 或审核流。
- 当前没有 auth / RBAC / 多租户 / Workspace。
- API Key 由后端 `.env` / 环境变量托管，不做前端输入和加密存储。
- 双记录对比基于历史 TestRecord，不是多模型并发生成。

## 后续规划

### 近期可做

- UI 细节 polish。
- failed / stopped TestRecord 保存策略。
- 简单关键词检索增强。
- 项目截图和部署说明。

### 中期可做

- Prompt 版本管理。
- 简单变量填充。
- Knowledge 文件上传。
- embedding / RAG 方案设计。

### 长期可做

- auth / workspace。
- 多 provider。
- 多模型对比。
- 权限和审计。

## 文档入口

- [前端架构说明](docs/frontend-architecture.md)
- [模块设计文档索引](docs/modules/README.md)
- [Dashboard summary 接入](docs/modules/dashboard/phase-2-13-dashboard-summary.md)
- [路线图](docs/roadmap.md)
- [开发记录](docs/development-log.md)
- [项目展示说明](docs/project-showcase.md)
- [面试讲解稿](docs/interview/project-story.md)
- [简历 bullet](docs/interview/resume-bullets.md)
- [面试问答](docs/interview/qa-prompthub-admin.md)
