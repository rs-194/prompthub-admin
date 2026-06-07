# 模块设计文档索引

本目录用于保存复杂业务模块的阶段性设计文档，避免把 mock、后端接入和增强阶段混写在同一份文档中。

| 模块 | 阶段 | 文档 | 状态 |
| --- | --- | --- | --- |
| 对话测试 / Prompt 调试台 | v1 mock | `chat-test/v1-mock-design.md` | 已实现 |
| 对话测试 / Prompt 调试台 | v2 knowledge-context mock | `chat-test/v2-knowledge-context-mock.md` | 已实现 |
| 对话测试 / Prompt 调试台 | v3 params-and-mock-streaming | `chat-test/v3-params-and-mock-streaming.md` | 已实现 |
| 知识库管理 | v1 mock | `knowledge/v1-mock-design.md` | 已实现 |
| 知识库管理 | Phase 2.9 backend lite | `knowledge/phase-2-9-knowledge-backend-lite.md` | 已实现 |
| 提示词管理 | Phase 2.11 backend lite | `prompt/phase-2-11-prompt-backend-lite.md` | 已实现 |
| 认证与路由访问控制 | v1 mock | `auth/v1-mock-design.md` | 已实现 |
| FastAPI 后端 | Phase 2.1 backend skeleton | `backend/v1-backend-skeleton.md` | 已实现 |
| FastAPI 后端 | Phase 2.2 TestRecord 持久化 | `backend/v2-test-records.md` | 已实现 |
| FastAPI 后端 | Phase 2.3 真实 LLM 非流式调用 | `backend/v3-llm-chat-test-run.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.4 前端接入真实 run 接口 | `chat-test/phase-2-4-real-run-api.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.5 真实 fetch stream 流式输出 | `chat-test/phase-2-5-stream.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.6 TestRecord 详情 Drawer | `chat-test/phase-2-6-record-detail-drawer.md` | 已实现 |
| 对话测试 / Prompt 调试台 | Phase 2.7 TestRecord 双记录对比 | `chat-test/phase-2-7-record-compare.md` | 已实现 |
| 项目展示整理 | Phase 2.8 README 展示化与项目包装 | `../project-showcase.md` | 已完成 |

## 后端阶段说明

- Phase 2.1 已完成 FastAPI 后端骨架、CORS、SQLite / SQLAlchemy 基础连接、`/api/v1` 路由入口和 health check。
- Phase 2.2 已新增 TestRecord 后端持久化 CRUD 接口，支持创建、分页列表、详情、删除和 keyword 轻量查询。
- Phase 2.3 已新增 `POST /api/v1/chat-test/run`，支持后端通过 OpenAI-compatible API 做真实 LLM 非流式调用，成功后保存 TestRecord。
- Phase 2.4 已完成前端 ChatTest 接入 `POST /api/v1/chat-test/run`，可展示真实 LLM 非流式 output，并使用后端返回的 record 更新最近测试记录。
- Phase 2.5 已新增 `POST /api/v1/chat-test/stream`，使用 fetch stream + FastAPI StreamingResponse + NDJSON 实现真实流式输出；当前不是原生 EventSource SSE，正常完成后由后端保存 TestRecord，用户主动停止时 v1 不保存 stopped record。
- Phase 2.6 已完成 TestRecord 详情 Drawer，列表只展示 `outputPreview`，完整 output 通过详情接口按需加载。
- Phase 2.7 已完成基于历史 TestRecord 的双记录对比，前端选择 2 条记录后分别调用 `GET /api/v1/test-records/{id}` 获取完整详情并并排展示；本阶段不是多模型并发生成，不新增 compareGroup 后端表，也不做多路 stream。
- Phase 2.8 已完成 README 展示化与项目包装整理，新增项目展示说明，用于项目投递、面试讲解和后续简历描述准备；本阶段只修改文档，不修改业务代码。
- Phase 2.9 已完成 Knowledge 后端化轻量版，提供文档 CRUD、分页、keyword、enabled 筛选和 ChatTest 手动上下文选择。
- Phase 2.11 已完成 Prompt 后端化轻量版，提供 PromptTemplate CRUD、分页、keyword、category、enabled 筛选，并让 ChatTest 使用后端 Prompt 详情中的完整 `content`。
- Model 仍未完整后端化；Knowledge 和 Prompt 已迁移到后端持久化数据源。
- 当前未实现真实 RAG、embedding、向量数据库、文件上传、真实认证 / JWT / RBAC。
- 当前 SQLite + `create_all` 是开发期方案，后续正式阶段可引入 Alembic。

后续阶段顺序：

1. 记录详情 / 对比继续优化。
2. failed / stopped record 持久化与 stream 错误恢复。
3. 简单关键词检索或真实 RAG / embedding 方案设计。
4. auth / Workspace / 多租户。

ModelConfig 后端化是后续增强，不排在 stream 前面。

## Phase 2.8 轻量 ModelConfig 展示补充

| 模块 | 阶段 | 文档 | 状态 |
| --- | --- | --- | --- |
| 模型配置 | Phase 2.8 轻量 ModelConfig 展示 | `model/phase-2-8-model-config-display.md` | 已实现 |

- 已新增 `GET /api/v1/model-config`，用于展示后端可信 LLM 环境配置状态。
- 接口只返回脱敏状态，不返回 `LLM_API_KEY`、Authorization 或 headers。
- 前端模型配置页已展示 provider、model、baseUrlHost、enabled、apiKeyConfigured 和默认参数。
- 当前仍不支持 API Key 输入、加密存储、多用户模型配置、ModelConfig CRUD 或多 provider 管理。
- 前端 mock 模型列表仍只是展示用数据，不直接决定 ChatTest 真实调用模型。
