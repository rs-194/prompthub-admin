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
| FastAPI 后端 | Phase 2.3 真实 LLM 非流式调用 | `backend/v3-llm-chat-test-run.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.4 前端接入真实 run 接口 | `chat-test/phase-2-4-real-run-api.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.5 真实 fetch stream 流式输出 | `chat-test/phase-2-5-stream.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.6 TestRecord 详情 Drawer | `chat-test/phase-2-6-record-detail-drawer.md` | 已实现 |

## 后端阶段说明

- Phase 2.1 已完成 FastAPI 后端骨架、CORS、SQLite / SQLAlchemy 基础连接、`/api/v1` 路由入口和 health check。
- Phase 2.2 已新增 TestRecord 后端持久化 CRUD 接口，支持创建、分页列表、详情、删除和 keyword 轻量查询。
- Phase 2.3 已新增 `POST /api/v1/chat-test/run`，支持后端通过 OpenAI-compatible API 做真实 LLM 非流式调用，成功后保存 TestRecord。
- Phase 2.4 已完成前端 ChatTest 接入 `POST /api/v1/chat-test/run`，可展示真实 LLM 非流式 output，并使用后端返回的 record 更新最近测试记录。
- Phase 2.5 已新增 `POST /api/v1/chat-test/stream`，使用 fetch stream + FastAPI StreamingResponse + NDJSON 实现真实流式输出；当前不是原生 EventSource SSE，正常完成后由后端保存 TestRecord，用户主动停止时 v1 不保存 stopped record。
- Prompt / Model / Knowledge 仍未全部后端化，当前仍是前端配置源。
- 当前未实现真实 RAG、真实认证 / JWT / RBAC，也未迁移 Prompt / Model / Knowledge 后端表。
- 当前 SQLite + `create_all` 是开发期方案，后续正式阶段可引入 Alembic。

后续阶段顺序：

1. Phase 2.7：双记录对比。
2. 后续增强：failed / stopped record 持久化、真实 RAG、ModelConfig 后端化。

ModelConfig 后端化是后续增强，不排在 stream 前面。
