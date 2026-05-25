# FastAPI 后端 TestRecord 持久化 Phase 2.2

## 0. 文档状态
- 阶段：Phase 2.2 TestRecord 持久化
- 状态：已实现
- 适用范围：FastAPI 后端测试记录 CRUD 接口

## 1. 本阶段目标
本阶段只完成 TestRecord 测试记录的后端持久化能力，让后端可以通过接口创建、分页查询、查看详情和删除测试记录。

本阶段不接前端，不实现 ChatTest stream，不调用真实 LLM，不实现真实 RAG，不实现 auth / JWT / RBAC。

## 2. 已完成内容
- 新增 `test_records` SQLAlchemy model。
- 新增 TestRecord Pydantic schema。
- 新增 TestRecord service，封装数据库读写、分页、keyword 轻量查询、`outputPreview` 生成和 JSON 字段转换。
- 新增 `/api/v1/test-records` router。
- 在 `/api/v1` 路由入口挂载 TestRecord router，并保留 health router。
- 启动时通过 `Base.metadata.create_all(bind=engine)` 创建 `test_records` 表。

## 3. API

### `GET /api/v1/test-records`
查询测试记录列表。

Query 参数：
- `page`：页码，最小值为 1，默认 1。
- `pageSize`：每页数量，最小值为 1，最大值为 100，默认 10。
- `keyword`：可选轻量关键词，匹配 `prompt_title`、`model_name`、`user_input`、`output_preview`。

列表项只返回 `outputPreview`，不返回完整 `output`。

### `GET /api/v1/test-records/{id}`
查询测试记录详情。详情返回完整 `output`。记录不存在时返回 404。

### `POST /api/v1/test-records`
创建测试记录。请求体不传 `id`、`outputPreview`、`createdAt`。

后端负责：
- 生成 `outputPreview`。
- 生成 `createdAt`。
- 将 `knowledgeTitles` 序列化为 JSON 字符串保存。
- 使用 `len(knowledgeTitles)` 校准 `knowledgeCount`。

### `DELETE /api/v1/test-records/{id}`
删除测试记录。记录不存在时返回 404，删除成功返回 `{ "success": true }`。

## 4. 数据边界
- ORM 内部字段使用 snake_case。
- API 对外字段使用 camelCase。
- `knowledge_titles` v1 使用 JSON 字符串存储，对外仍返回 `knowledgeTitles: list[str]`。
- `output` 使用 `Text` 保存完整输出。
- `output_preview` 用于列表摘要。
- `status` 允许 `success`、`failed`、`stopped`。其中 `stopped` 只是记录状态预留，不代表后端已经接入真实取消能力。
- v1 不做外键关联，不新增 Prompt / Model / Knowledge 后端表。

## 5. 设计原因

### 5.1 为什么 TestRecord 保存快照，而不是外键

当前 Prompt / Model / Knowledge 仍停留在前端 mock 或待迁移状态，还没有对应的后端业务表。Phase 2.2 的目标是先完成 TestRecord 的最小持久化闭环，如果此时强行设计外键，需要同时迁移 Prompt、Model、Knowledge 表结构、接口和数据关系，会扩大本阶段范围。

测试记录本质上记录的是“某一次测试发生时”的上下文。它应该保存当时使用的 prompt 标题、模型名称、知识库标题、参数摘要、输入和输出快照。即使后续 Prompt / Model / Knowledge 被编辑、删除或重命名，历史测试记录也应该保持稳定，方便回放和排查当时的测试结果。

### 5.2 为什么列表不返回完整 output

`output` 可能是长文本，甚至后续真实模型输出会更长。列表页主要用于表格浏览、分页、搜索和快速定位，只需要 `outputPreview` 这类摘要信息。

如果列表接口直接返回完整 `output`，响应体会随着记录数量和输出长度快速变大，影响表格加载体验。后续详情 Drawer 可以在用户打开某条记录时，通过 `GET /api/v1/test-records/{id}` 按需加载完整 `output`。

### 5.3 snake_case / camelCase 边界

后端 ORM 内部字段使用 snake_case，符合 Python 和 SQLAlchemy 的常见命名习惯，也贴近数据库列名风格。API 对外字段使用 camelCase，贴近前端 TypeScript 类型和 Vue 页面使用习惯。

字段转换应收敛在 schema / service 边界内完成，不应该让前端页面层到处做字段适配。这样前端只关心稳定的 API 数据形状，后端内部也可以保持 Python 生态习惯。

### 5.4 knowledgeTitles 为什么用 JSON 字符串存储

v1 不做 Knowledge 后端表，也不做测试记录与知识库之间的关联表。`knowledgeTitles` 在当前阶段只是测试记录的上下文标题快照，用于说明这次测试参考了哪些知识库文档。

将 `knowledgeTitles` 序列化为 JSON 字符串并存入 `Text` 字段，实现简单，足够支撑 v1 的创建、列表、详情和历史回看需求。后续如果 Knowledge 后端表成熟，再考虑改为关联表或数据库 JSON 字段。

### 5.5 开发期建表边界

当前使用 `Base.metadata.create_all(bind=engine)` 是开发期方案。它的好处是简单，适合本地学习、快速验证和最小闭环，不需要在 Phase 2.2 额外引入迁移工具。

如果后续字段频繁变化、进入多环境部署或多人协作阶段，应引入 Alembic 管理数据库迁移，避免依赖自动建表来处理正式环境结构演进。

## 6. 分层职责

- model：定义数据库表结构，例如字段名、类型、索引和默认值。
- schema：定义请求和响应数据形状，约束 API 入参和出参。
- service：负责数据库读写、字段转换、分页、keyword 查询、`outputPreview` 生成和 `knowledgeTitles` JSON 转换。
- router：负责 HTTP 路由、依赖注入、参数校验入口、404 处理和 response model。
- main：只负责 FastAPI 启动、路由挂载和建表初始化，不写业务 CRUD。

## 7. 前端后续替换策略

- 当前前端 ChatTest 仍使用 mock service，尚未接入后端 TestRecord 接口。
- 后续优先替换 `getChatTestRecords`，对应 `GET /api/v1/test-records`。
- 再替换 `saveChatTestRecord`，对应 `POST /api/v1/test-records`。
- 详情 Drawer 后续可调用 `GET /api/v1/test-records/{id}` 按需加载完整 `output`。
- ChatTest stream 接口后续单独设计和实现，不和 records service 替换混在一起。

## 8. 当前未完成内容
- 未接前端，`frontend/src/services/chatTest.ts` 仍未替换为后端接口。
- 未实现 ChatTest stream 或 `StreamingResponse`。
- 未接真实 LLM API。
- 未实现真实 RAG、embedding 或向量数据库。
- 未实现 auth / JWT / RBAC。
- 未迁移 Prompt / Model / Knowledge 模块到后端。
- 未引入 Alembic。

## 9. 数据库说明
当前 SQLite + `create_all` 是 Phase 2.2 开发期方案，用于快速验证后端持久化接口，不应描述为生产最终方案。

后续进入正式迁移和多环境部署阶段时，可引入 Alembic 管理数据库迁移。

## 10. 验证方式
```bash
cd backend
python -m compileall app
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

启动后验证：
- `GET /api/v1/health`
- `POST /api/v1/test-records`
- `GET /api/v1/test-records`
- `GET /api/v1/test-records/{id}`
- `DELETE /api/v1/test-records/{id}`
