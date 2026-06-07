# PromptHub Backend

## 当前阶段

当前后端已推进至 Phase 2.12 文档收束阶段。后端业务能力仍保持 Phase 2.11 状态：TestRecord 持久化、ChatTest run / fetch stream、后端 `.env` 模型配置、ModelConfig 脱敏状态展示、Knowledge 后端化轻量 CRUD，以及 Prompt 后端化轻量 CRUD。Knowledge 当前仅由用户手动选择文档并拼入上下文，不是完整 RAG。

## 当前已完成

- FastAPI app 入口
- CORS 基础配置
- SQLite / SQLAlchemy 基础连接
- `/api/v1` 路由入口
- health check 接口
- TestRecord SQLAlchemy model
- TestRecord 创建、分页列表、详情、删除接口
- 列表接口只返回 `outputPreview`，详情接口返回完整 `output`
- `POST /api/v1/chat-test/run` 真实 LLM 非流式调用接口
- `POST /api/v1/chat-test/stream` 真实 LLM 流式输出接口
- 使用 `httpx` 调 OpenAI-compatible `/chat/completions`
- 非流式成功调用后保存 TestRecord，并返回 `output`、`record`、`durationMs`
- 流式正常完成后保存 TestRecord，并通过 `done` 行返回 `record`、`durationMs`
- KnowledgeDocument SQLAlchemy model 与 CRUD
- Knowledge 列表只返回 `contentPreview`，详情返回完整 `content`
- ChatTest 可接收前端手动选择的后端 Knowledge 文档正文
- PromptTemplate SQLAlchemy model 与 CRUD
- PromptTemplate 列表只返回 `contentPreview`，详情返回完整 `content`
- ChatTest 可接收前端选择的后端 PromptTemplate 完整正文作为 `systemPrompt`

## 当前未完成

- 原生 EventSource SSE
- 真实 RAG / embedding / 向量数据库
- 真实认证 / JWT / RBAC
- Model 完整后端 CRUD
- Prompt 版本管理 / 变量引擎 / 审核流 / marketplace
- ModelConfig 完整 CRUD 与多 provider 管理
- Alembic 数据库迁移

## 投递讲解边界

- 后端用于支撑前端真实调试链路，不包装成完整企业级后端平台。
- API Key 只由后端 `.env` / 环境变量托管，前端不输入、不保存、不展示。
- PromptTemplate 和 KnowledgeDocument 是轻量 CRUD，不包含版本管理、文件上传、解析、embedding 或自动召回。
- TestRecord 对比是历史记录复盘，不是多模型并发生成。

## 本地启动

```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload
```

默认 SQLite 地址为：

```text
sqlite:///./prompthub.db
```

按上述命令从 `backend` 目录启动时，数据库文件会位于 `backend/prompthub.db`。当前 `Base.metadata.create_all(bind=engine)` 是开发期建表方案，不是生产最终迁移方案；后续正式阶段可引入 Alembic。

## LLM 环境变量

```text
LLM_BASE_URL=https://api.example.com/v1
LLM_API_KEY=replace-with-your-api-key
LLM_MODEL=example-model
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1024
LLM_TIMEOUT_SECONDS=60
```

说明：

- API Key 只在后端读取，不进入前端、不进入响应、不写入日志。
- 本地开发时可复制 `backend/.env.example` 为 `backend/.env`，再把真实 API Key 写入 `backend/.env`。
- 后端启动时会自动读取 `backend/.env`，不是项目根目录 `.env`。
- 不要提交真实 API Key，也不要提交 `backend/.env`；`backend/.env.example` 可以提交。
- 修改 `.env` 后需要重启 uvicorn。
- 配置代码仍使用 `os.getenv` 读取环境变量，只是在读取前通过 `python-dotenv` 加载 `backend/.env`。

## 健康检查

启动后访问：

```text
http://localhost:8000/api/v1/health
```

预期返回：

```json
{
  "status": "ok",
  "service": "prompthub-backend"
}
```

## ChatTest 运行接口

```text
POST /api/v1/chat-test/run
```

请求体示例：

```json
{
  "promptTitle": "客服回复优化",
  "systemPrompt": "你是一个客服话术优化助手",
  "userInput": "请帮我优化这段回复",
  "modelName": "前端展示模型名",
  "knowledgeContext": {
    "titles": ["售后政策"],
    "content": "当前由前端传入的知识库上下文"
  },
  "params": {
    "temperature": 0.7,
    "maxTokens": 1024,
    "outputFormat": "markdown"
  }
}
```

说明：

- `modelName` 当前只用于 TestRecord 展示字段，真实调用使用后端 `LLM_MODEL`。
- `knowledgeContext` 当前由前端手动选择后端 Knowledge 文档后传入，不是真实 RAG。
- 当前不是 stream，接口会在真实模型完整返回后一次性响应；该接口仍保留作为 fallback 或调试接口。

## ChatTest 流式接口

```text
POST /api/v1/chat-test/stream
```

请求体与 `/api/v1/chat-test/run` 保持一致。

响应格式为 `application/x-ndjson`，不是原生 EventSource SSE：

```json
{"type":"chunk","content":"文本片段"}
{"type":"done","record":{},"durationMs":1234}
{"type":"error","message":"LLM 调用失败"}
```

说明：

- 后端通过 OpenAI-compatible `/chat/completions` 发起 `stream: true` 调用。
- 后端解析上游 `data: {...}` 和 `data: [DONE]`。
- 前端通过 fetch stream 读取 NDJSON。
- 正常完成后由后端保存 `success` TestRecord。
- 用户主动停止时，Phase 2.5 v1 不保存 `stopped` TestRecord。
- API Key 只在后端读取，不进入前端、不进入响应、不写入日志。
- 当前不是真实 RAG，`knowledgeContext` 是用户手动选择的后端文档上下文。

## TestRecord 接口

```text
GET /api/v1/test-records
GET /api/v1/test-records/{id}
POST /api/v1/test-records
DELETE /api/v1/test-records/{id}
```

说明：

- `GET /api/v1/test-records` 支持 `page`、`pageSize`、`keyword`。
- `pageSize` 最大为 100。
- `keyword` 为空或全空白时不筛选。
- `POST /api/v1/test-records` 由后端生成 `outputPreview` 和 `createdAt`。
- `knowledgeTitles` 当前以 JSON 字符串存储，对外仍返回数组。
- `status: stopped` 仍是记录状态预留；Phase 2.5 已支持前端停止生成，但用户主动停止时 v1 不保存 stopped 记录。

## ModelConfig 状态接口

```text
GET /api/v1/model-config
```

该接口用于 Phase 2.8 轻量展示后端可信 LLM 配置状态，读取来源是 `settings` / 后端环境变量。

返回字段包括：

```json
{
  "provider": "OpenAI-Compatible",
  "model": "deepseek-chat",
  "baseUrlHost": "api.deepseek.com",
  "enabled": true,
  "apiKeyConfigured": true,
  "temperature": 0.7,
  "maxTokens": 1024,
  "timeoutSeconds": 60
}
```

说明：
- API Key 只返回是否已配置的布尔值，不返回明文。
- 不返回 Authorization、headers 或完整敏感请求信息。
- 配置缺失时接口仍返回 200，并通过 `enabled=false` 表示 ChatTest 真实调用不可用。
- 当前不支持 API Key 输入、加密存储、用户级模型配置、ModelConfig CRUD 或多 provider 管理。

## KnowledgeDocument 接口

```text
GET    /api/v1/knowledge-documents
GET    /api/v1/knowledge-documents/{id}
POST   /api/v1/knowledge-documents
PUT    /api/v1/knowledge-documents/{id}
DELETE /api/v1/knowledge-documents/{id}
```

说明：

- 列表支持 `page`、`pageSize`、`keyword` 和 `enabled`。
- keyword 可匹配标题、摘要、来源名称和完整正文，但列表响应不会返回完整 `content`。
- 列表只返回 `contentPreview`，详情接口返回完整 `content`。
- tags 内部使用 JSON 字符串存储，对外返回 `string[]`；解析失败时兜底为空数组。
- ChatTest 由用户手动选择启用文档并拼接上下文，不是 RAG。
- 当前不做 embedding、向量数据库、文件上传、文档解析或联网搜索。
- 开发期使用 `create_all` 建表，不引入 Alembic。

## PromptTemplate 接口

```text
GET    /api/v1/prompt-templates
GET    /api/v1/prompt-templates/{id}
POST   /api/v1/prompt-templates
PUT    /api/v1/prompt-templates/{id}
DELETE /api/v1/prompt-templates/{id}
```

说明：

- 列表支持 `page`、`pageSize`、`keyword`、`category` 和 `enabled`。
- keyword 可匹配标题、描述、分类、使用场景和完整正文，但列表响应不会返回完整 `content`。
- 列表只返回 `contentPreview`，详情接口返回完整 `content`。
- tags 内部使用 JSON 字符串存储，对外返回 `string[]`；解析失败时兜底为空数组。
- ChatTest 由前端选择启用中的 PromptTemplate，并使用详情中的完整 `content` 作为 `systemPrompt`。
- 当前不做 Prompt 版本管理、diff、变量解析引擎、marketplace 或审核流。
- 当前不做多租户、Workspace、auth / RBAC。
- 开发期使用 `create_all` 建表，不引入 Alembic。
