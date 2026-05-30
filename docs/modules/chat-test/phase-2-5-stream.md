# Phase 2.5 ChatTest 真实流式输出

## 0. 文档状态

- 阶段：Phase 2.5 fetch stream
- 状态：已实现
- 适用范围：对话测试 / Prompt 调试台真实流式输出链路

## 1. 阶段目标

Phase 2.5 在已完成 `/api/v1/chat-test/run` 非流式真实调用的基础上，新增真实流式输出能力：

- 后端新增 `POST /api/v1/chat-test/stream`。
- 后端通过 OpenAI-compatible `/chat/completions` 发起 `stream: true` 调用。
- 后端使用 FastAPI `StreamingResponse` 返回 `application/x-ndjson`。
- 前端使用 `fetch` + `ReadableStream` 逐段读取输出。
- 前端支持 `AbortController` 停止生成，并在组件卸载时清理请求。
- 正常完成后由后端保存完整 `TestRecord`，并在 `done` 行返回 `record` 和 `durationMs`。

## 2. 技术选择

本阶段采用：

```text
fetch stream + FastAPI StreamingResponse + NDJSON
```

本阶段不是原生 `EventSource SSE`。原因是当前 ChatTest 请求体包含 `promptTitle`、`systemPrompt`、`userInput`、`knowledgeContext` 和 `params`，更适合继续使用 `POST` 请求。原生 `EventSource` 主要面向 `GET` 订阅场景，不适合作为本阶段主方案。

## 3. NDJSON 响应格式

每行是一个 JSON 对象，并以换行符结束。

```json
{"type":"chunk","content":"文本片段"}
{"type":"done","record":{},"durationMs":1234}
{"type":"error","message":"LLM 调用失败"}
```

- `chunk`：模型增量文本。
- `done`：正常完成，携带后端保存后的 `TestRecord`。
- `error`：流中异常，返回面向用户的安全错误信息。

后端不会向前端返回 API Key、headers、完整上游错误或堆栈信息。

## 4. 后端设计

后端文件职责：

- `backend/app/modules/llm_provider/service.py`
  - 新增 `stream_chat_completion()`。
  - 请求体设置 `stream: true`。
  - 使用 `httpx.Client().stream()` 读取上游响应。
  - 解析 OpenAI-compatible stream 中的 `data: {...}` 和 `data: [DONE]`。
  - 提取 `choices[0].delta.content`，空内容跳过。
- `backend/app/modules/chat_test/service.py`
  - 新增 `stream_chat_test()`。
  - 复用 `build_messages()`、temperature 和 maxTokens 边界处理。
  - 累积完整 output。
  - 正常完成后创建 `success` TestRecord。
  - 逐行输出 NDJSON。
- `backend/app/api/v1/chat_test.py`
  - 新增 `POST /api/v1/chat-test/stream`。
  - 使用 `StreamingResponse`。
  - `media_type` 为 `application/x-ndjson`。

## 5. 前端设计

前端文件职责：

- `frontend/src/types/chatTest.ts`
  - 新增流式事件和 callbacks 类型。
- `frontend/src/services/chatTest.ts`
  - 新增 `runPromptTestStreamApi(payload, callbacks, abortSignal)`。
  - 使用 `fetch` 调用 `/api/v1/chat-test/stream`。
  - 使用 `response.body.getReader()` 读取流。
  - 使用 `TextDecoder` 增量解码。
  - 使用 buffer 缓存半行，按 `\n` 解析 NDJSON。
- `frontend/src/views/chat-test/ChatTestView.vue`
  - 默认运行路径切到真实 stream 接口。
  - 维护 `streaming`、`streamingText`、`abortController`。
  - `chunk` 时追加展示文本。
  - `done` 时构造最终 `testResult`，并刷新最近记录。
  - 停止生成时 abort 请求并保留已生成片段。
- `frontend/src/views/chat-test/components/TestResultPanel.vue`
  - 展示真实流式生成中的文本。
  - 不再展示 mock streaming 标签。

## 6. 停止生成策略

用户点击停止生成时：

- 前端调用 `AbortController.abort()`。
- 前端关闭 `streaming` 状态。
- 前端保留已生成片段。
- Phase 2.5 v1 不保存 `stopped` TestRecord。

原因是浏览器 abort 后，后端未必能稳定完成后续保存逻辑。本阶段只将正常完成的完整输出保存为 `success` 记录；`failed` / `stopped` 持久化留到后续阶段单独设计。

## 7. 当前边界

- 当前仍不是真实 RAG。
- `knowledgeContext` 仍来自前端手动选择的 mock context，不是 embedding 或向量检索结果。
- Prompt / Model / Knowledge 仍未后端化。
- ModelConfig 未控制真实模型调用，真实模型仍由后端 `LLM_MODEL` 决定。
- API Key 只存在后端环境变量，不进入前端。
- 非流式 `/api/v1/chat-test/run` 仍保留，可作为 fallback 或调试接口。

## 8. 验证方式

后端：

```bash
cd backend
python -m compileall app
```

前端：

```bash
cd frontend
npm run build
```

人工验证：

- 启动后端并配置 LLM 环境变量。
- 启动前端，访问 `/chat-test`。
- 点击运行测试，确认输出逐段追加。
- streaming 时停止按钮可用。
- 点击停止后请求中断，页面不再追加文本。
- 正常完成后最近测试记录出现新 record。
- `GET /api/v1/test-records` 可查到记录。

如果没有真实 `LLM_API_KEY`，不能验证真实外部流式 output，只能验证构建、请求错误提示和前端状态处理。

## 9. 后续入口

- Phase 2.6：测试记录详情 Drawer / 对比。
- 后续增强：`failed` / `stopped` record 持久化策略。
- 后续增强：真实 RAG 检索、ModelConfig 后端化、真实 auth / JWT / RBAC。
