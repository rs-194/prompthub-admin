# 模块设计文档索引

本目录用于保存复杂业务模块的阶段性设计文档，避免把 mock、后端接入和增强阶段混写在同一份文档中。

| 模块 | 阶段 | 文档 | 状态 |
| --- | --- | --- | --- |
| 对话测试 / Prompt 调试台 | v1 mock | `chat-test/v1-mock-design.md` | 已实现 |
| 对话测试 / Prompt 调试台 | v2 knowledge-context mock | `chat-test/v2-knowledge-context-mock.md` | 已实现 |
| 对话测试 / Prompt 调试台 | v3 params-and-mock-streaming | `chat-test/v3-params-and-mock-streaming.md` | 已实现 |
| 知识库管理 | v1 mock | `knowledge/v1-mock-design.md` | 已实现 |
| 认证与路由访问控制 | v1 mock | `auth/v1-mock-design.md` | 已实现 |
| FastAPI 后端 | Phase 2.1 backend skeleton | `backend/v1-backend-skeleton.md` | 已实现 |

## 后端阶段说明

- Phase 2.1 当前只完成 FastAPI 后端骨架、CORS、SQLite / SQLAlchemy 基础连接、`/api/v1` 路由入口和 health check。
- 当前没有 TestRecord CRUD。
- 当前没有 ChatTest stream 接口。
- 当前没有真实 LLM、真实 RAG、真实认证 / JWT / RBAC。

后续如果进入 TestRecord 持久化、真实后端接口接入、RAG 或 Agent Workflow 阶段，应继续在对应模块目录下新增版本化设计文档，并明确当前阶段边界。
