# FastAPI 后端真实 LLM 非流式调用 Phase 2.3

## 0. 文档状态

- 阶段：Phase 2.3 真实 LLM 非流式调用最小闭环
- 状态：已实现
- 适用范围：后端 `POST /api/v1/chat-test/run`，OpenAI-compatible chat completions 调用，TestRecord 保存

## 1. 本阶段目标

本阶段把 ChatTest 的核心调试链路从前端 mock 输出推进到后端真实 LLM 非流式调用。后端接收 prompt、userInput、knowledgeContext 和 params 后拼装 messages，通过 OpenAI-compatible `/chat/completions` 调用真实模型，拿到 output 后保存为 TestRecord，并返回 `output`、`record` 和 `durationMs`。

当前 Prompt / Model / Knowledge 管理模块仍未全部后端化，前端传入的 prompt、modelName 和 knowledgeContext 仍是当前阶段的上下文快照来源。

## 2. 本阶段不做

- 不做 StreamingResponse
- 不做 SSE
- 不做 fetch stream
- 不做 WebSocket
- 不做真实 RAG
- 不做 embedding
- 不做向量数据库
- 不做 Prompt / Model / Knowledge 后端表
- 不做 ModelConfig 后端化
- 不做 API Key 管理页面
- 不做 auth / JWT / RBAC
- 不做多模型并发对比
- 不做前端接入
- 不做 Docker / Redis / Celery / Alembic

下一阶段优先完成前端接入 `/api/v1/chat-test/run`，验证真实 output 展示与 TestRecord 保存链路；随后进入真实 stream / SSE / fetch stream。ModelConfig 后端化属于后续增强，不阻塞真实调用和 stream。

## 3. 后端文件结构

```text
backend/app/modules/llm_provider/
├─ schemas.py
└─ service.py

backend/app/modules/chat_test/
├─ schemas.py
└─ service.py

backend/app/api/v1/chat_test.py
```

- `llm_provider/schemas.py`：定义 OpenAI-compatible message 数据结构。
- `llm_provider/service.py`：使用 `httpx` 调用 `/chat/completions`，处理配置缺失、超时、HTTP 错误和响应结构异常。
- `chat_test/schemas.py`：定义 ChatTest 运行请求、知识上下文、参数和响应结构。
- `chat_test/service.py`：拼装 messages，调用 LLM provider，计算 durationMs，复用 TestRecord service 保存成功记录。
- `api/v1/chat_test.py`：暴露 `POST /api/v1/chat-test/run`，把内部异常映射为安全的 HTTP 错误。

## 4. 环境变量

```text
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=真实 key，仅后端环境变量
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1024
LLM_TIMEOUT_SECONDS=60
```

说明：

- API Key 只在后端环境变量读取，不进入前端、不进入请求体、不进入响应、不写入日志。
- 不要把真实 API Key 提交到 Git。
- 当前使用 `os.getenv` 读取配置，不新增 `python-dotenv`。
- `LLM_BASE_URL` 拼接 `/chat/completions` 时会去掉末尾斜杠，避免重复斜杠。

## 5. API 设计

### `POST /api/v1/chat-test/run`

请求体：

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

响应体：

```json
{
  "output": "真实模型输出",
  "record": {
    "id": 1,
    "promptTitle": "客服回复优化",
    "modelName": "前端展示模型名",
    "userInput": "请帮我优化这段回复",
    "outputPreview": "真实模型输出",
    "knowledgeTitles": ["售后政策"],
    "knowledgeCount": 1,
    "temperature": 0.7,
    "maxTokens": 1024,
    "outputFormat": "markdown",
    "durationMs": 1200,
    "status": "success",
    "createdAt": "2026-05-25T00:00:00",
    "output": "真实模型输出"
  },
  "durationMs": 1200
}
```

`modelName` 当前只用于 TestRecord 展示字段。真实调用使用后端 `LLM_MODEL`，前端不能通过 `modelName` 任意控制真实模型。后续 ModelConfig 后端化后，才考虑从后端可信配置中选择模型。

## 6. messages 拼装策略

system message 包含：

- `systemPrompt`，为空时使用兜底提示词。
- `outputFormat` 要求。
- `knowledgeContext` 参考上下文说明。

user message 包含：

- `userInput`。

边界：

- `userInput` 为空返回 422。
- `knowledgeContext.content` 为空时正常调用。
- `knowledgeContext.content` 不为空时作为“用户选择的参考上下文”拼入 system message。
- `knowledgeContext.content` 会截断到 7000 字符，避免 prompt 过长。
- 当前不做 token 精确计算。
- `outputFormat=json` 只提示模型尽量输出 JSON，不做强校验，不保证一定是合法 JSON。
- `knowledgeContext` 当前不是向量召回结果，不是真实 RAG。

## 7. 错误处理

- LLM 配置缺失：返回 503，提示 LLM service is not configured completely。
- LLM API 超时：返回 504。
- LLM API 非 2xx：返回 502。
- LLM 响应结构异常：返回 502。
- `userInput` 为空：返回 422。
- 不返回 API Key、敏感 headers、完整上游错误栈。
- v1 失败请求先不保存 TestRecord。后续可扩展 `status=failed`、`errorSummary` 和失败审计记录。

## 8. TestRecord 关系

成功调用后会保存 TestRecord：

- `promptTitle`
- `modelName`
- `userInput`
- `output`
- `knowledgeTitles`
- `temperature`
- `maxTokens`
- `outputFormat`
- `durationMs`
- `status=success`

`outputPreview` 和 `createdAt` 继续由 TestRecord service 生成。

## 9. 验证方式

```bash
cd backend
python -m compileall app
python -m uvicorn app.main:app --reload
```

验证：

- `GET /api/v1/health` 正常。
- 配置 LLM 环境变量后，`POST /api/v1/chat-test/run` 返回真实 output。
- 响应包含 `output`、`record`、`durationMs`。
- `GET /api/v1/test-records` 可查到新记录。
- 缺少 `LLM_API_KEY` 时返回清晰配置错误，且不泄露敏感信息。

## 10. 后续入口

- Phase 2.4：前端 ChatTest 接入 `/api/v1/chat-test/run`，展示真实 output，并保存 TestRecord。
- Phase 2.5：真实 stream / SSE / fetch stream 输出。
- Phase 2.6：测试记录详情 Drawer / 对比。

ModelConfig 后端化可以作为后续增强，但当前不排在 stream 前面。
