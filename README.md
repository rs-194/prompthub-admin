# PromptHub Admin

PromptHub Admin 是一个面向大模型应用开发的 AI Prompt 调试与记录管理平台。

## 项目简介

项目围绕 Prompt 调试主链路展开：管理后端 Prompt 模板和 Knowledge 文档，展示后端可信模型配置状态，运行真实 LLM 流式调试，并通过 TestRecord 完成详情复盘和双记录对比。

更多功能与边界说明见 [项目展示页](docs/project-showcase.md)。

## 当前核心能力

- Dashboard 真实统计概览。
- PromptTemplate 后端 CRUD、分页、筛选和详情按需加载。
- KnowledgeDocument 后端 CRUD、分页、筛选和手动上下文选择。
- ModelConfig 后端可信配置状态展示，不返回 API Key。
- ChatTest 通过 fetch stream / ReadableStream 消费 FastAPI NDJSON 流。
- TestRecord 保存、列表预览、详情 Drawer 和历史双记录对比。

## 核心链路

```text
PromptTemplate + KnowledgeDocument + ModelConfig
→ ChatTest
→ FastAPI stream
→ LLM API
→ NDJSON 流式渲染
→ TestRecord
→ 详情 / 对比复盘
```

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Element Plus、Vue Router、Pinia。
- 后端：FastAPI、SQLAlchemy、SQLite、httpx、StreamingResponse。
- 流式处理：fetch stream、ReadableStream、TextDecoder、NDJSON。

## 项目截图

截图文件将在公开仓库发布前补充：

### Dashboard

截图待补充：`docs/assets/screenshots/dashboard.png`

### ChatTest 流式调试

截图待补充：`docs/assets/screenshots/chat-test-streaming.png`

### TestRecord 双记录对比

截图待补充：`docs/assets/screenshots/test-record-compare.png`

## 本地启动

### 后端

```bash
cd backend
copy .env.example .env
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

在 `backend/.env` 中配置 OpenAI-compatible 模型服务。真实 API Key 只保存在后端环境变量中，不应提交到仓库。

### 前端

```bash
cd frontend
npm install
npm run dev
```

开发环境通过 Vite proxy 将 `/api/...` 转发到 `http://127.0.0.1:8000`。

## 当前边界

- Knowledge 是用户手动选择的上下文，不是自动 RAG 召回。
- 当前不包含 embedding、向量数据库、文件上传或文档解析。
- ModelConfig 只展示后端脱敏状态，不提供 API Key 前端输入或 CRUD。
- TestRecord 对比基于两条历史记录，不是多模型并发生成。
- 当前没有真实 auth、JWT、RBAC、多租户或 Workspace。

## 文档入口

- [项目展示页](docs/project-showcase.md)
- [路线图](docs/roadmap.md)
- [模块文档索引](docs/modules/README.md)
- [Dashboard summary](docs/modules/dashboard/phase-2-13-dashboard-summary.md)
- [Prompt 后端轻量版](docs/modules/prompt/phase-2-11-prompt-backend-lite.md)
- [Knowledge 后端轻量版](docs/modules/knowledge/phase-2-9-knowledge-backend-lite.md)
- [ModelConfig 状态展示](docs/modules/model/phase-2-8-model-config-display.md)
- [ChatTest 真实流式输出](docs/modules/chat-test/phase-2-5-stream.md)
- [TestRecord 详情](docs/modules/chat-test/phase-2-6-record-detail-drawer.md)
- [TestRecord 双记录对比](docs/modules/chat-test/phase-2-7-record-compare.md)
- [开发记录](docs/development-log.md)
