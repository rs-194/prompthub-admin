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
| FastAPI 后端 | Phase 2.2 TestRecord 持久化 | `backend/v2-test-records.md` | 已实现 |

## 后端阶段说明

- Phase 2.1 已完成 FastAPI 后端骨架、CORS、SQLite / SQLAlchemy 基础连接、`/api/v1` 路由入口和 health check。
- Phase 2.2 已新增 TestRecord 后端持久化 CRUD 接口，支持创建、分页列表、详情、删除和 keyword 轻量查询。
- 当前仍未接前端，未实现 ChatTest stream、真实 LLM、真实 RAG、真实认证 / JWT / RBAC，也未迁移 Prompt / Model / Knowledge 后端表。
- 当前 SQLite + `create_all` 是开发期方案，后续正式阶段可引入 Alembic。

后续如果进入 ChatTest stream、真实后端接口接入、RAG 或 Agent Workflow 阶段，应继续在对应模块目录下新增版本化设计文档，并明确当前阶段边界。
