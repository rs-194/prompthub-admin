# PromptHub Backend

## 当前阶段

当前后端处于 Phase 2.5：在 Phase 2.1 FastAPI 最小骨架、Phase 2.2 TestRecord 持久化接口和 Phase 2.3 真实 LLM 非流式调用接口基础上，新增真实 fetch stream + StreamingResponse + NDJSON 流式输出接口。

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

## 当前未完成

- 原生 EventSource SSE
- 真实 RAG / embedding / 向量数据库
- 真实认证 / JWT / RBAC
- Prompt / Model / Knowledge 后端表
- ModelConfig 后端化
- Alembic 数据库迁移

## 本地启动

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

默认 SQLite 地址为：

```text
sqlite:///./prompthub.db
```

按上述命令从 `backend` 目录启动时，数据库文件会位于 `backend/prompthub.db`。当前 `Base.metadata.create_all(bind=engine)` 是开发期建表方案，不是生产最终迁移方案；后续正式阶段可引入 Alembic。

## LLM 环境变量

```text
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=真实 key，仅后端环境变量
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1024
LLM_TIMEOUT_SECONDS=60
```

说明：

- API Key 只在后端读取，不进入前端、不进入响应、不写入日志。
- 不要提交真实 API Key。
- 当前使用 `os.getenv` 读取环境变量，不依赖 `.env` 自动加载。

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
- `knowledgeContext` 当前只是前端传入上下文，不是真实 RAG。
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
- 当前不是真实 RAG，`knowledgeContext` 仍是前端传入的 mock context。

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
