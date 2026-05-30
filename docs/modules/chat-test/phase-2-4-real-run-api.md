# ChatTest Phase 2.4 前端接入真实 run 接口

## 0. 文档状态

- 阶段：Phase 2.4 前端 ChatTest 接入真实 LLM run 接口
- 状态：已实现
- 适用范围：前端 ChatTest 页面、`frontend/src/services/chatTest.ts`、`frontend/src/types/chatTest.ts`

## 1. 本阶段目标

Phase 2.4 将 ChatTest 页面点击“运行测试”的默认路径从前端 mock run 切换为后端 `POST /api/v1/chat-test/run`。

前端负责组装当前选择的提示词、模型展示名、用户输入、知识库上下文和测试参数；后端负责真实 LLM 非流式调用、保存 TestRecord，并返回完整 `output`、`record` 和 `durationMs`。请求成功后，页面展示后端返回的真实 `output`，并使用后端返回的 `record` 更新最近测试记录。

## 2. 当前能力

- 前端调用 `POST /api/v1/chat-test/run`。
- 请求成功后展示后端返回的完整 `output`。
- 请求成功后将后端返回的 `record` 插入最近测试记录。
- 保留运行 loading、错误提示和清空结果能力。
- 测试参数随请求发送到后端。
- API Key 不在前端保存、展示或传输。

## 3. 当前不做

- 不做 stream / SSE / fetch stream。
- 不做 WebSocket。
- 不做逐字输出。
- 不做真实 RAG。
- 不做 embedding。
- 不接向量数据库。
- 不做 Prompt / Model / Knowledge 后端化。
- 不做 ModelConfig 后端化。
- 不做 auth / JWT / RBAC。
- 不做多模型并发对比。

## 4. 数据来源边界

- Prompt 仍来自前端当前提示词配置源。
- Model 仍来自前端当前模型配置源；`modelName` 只用于展示和记录。
- Knowledge 仍来自前端当前知识库 mock 配置源。
- `knowledgeContext.titles` 是用户手动选择的知识库文档标题数组。
- `knowledgeContext.content` 是用户手动选择文档的摘要 / 内容拼接文本。
- 当前 `knowledgeContext` 只是上下文拼接，不是真实 RAG 召回结果。
- 真实调用模型由后端 `LLM_MODEL` 控制。
- `LLM_API_KEY` 只配置在后端环境变量中。

## 5. 非流式交互说明

当前接口是非流式请求，前端等待后端返回完整响应后一次性展示 output。

因此本阶段不再使用前端 timer mock streaming 作为默认运行路径。“停止生成”在非流式阶段暂不支持，页面中以禁用按钮和提示文案说明当前限制。真正的停止生成需要在 Phase 2.5 stream / SSE / fetch stream 阶段结合 AbortController 或流式连接清理一起设计。

## 6. 本地开发说明

当前前端 service 使用相对路径：

```text
/api/v1/chat-test/run
```

如果前后端不是同源部署，本地开发需要配置 Vite proxy，或通过同源反向代理访问后端。当前阶段不修改 `vite.config.*`，避免扩展构建配置范围。

## 7. 验证路径

手动验证建议：

1. 启动后端并配置 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL` 等环境变量。
2. 启动前端。
3. 打开 `/chat-test`。
4. 选择提示词、模型配置，可选知识库文档。
5. 输入测试内容并点击“运行测试”。
6. 确认页面展示后端返回的真实 output。
7. 确认最近测试记录出现后端返回的新 record。
8. 移除或不配置 `LLM_API_KEY` 时，确认前端出现清晰错误提示。

## 8. 下一阶段

下一阶段优先做 Phase 2.5：真实 stream / SSE / fetch stream 输出。

Phase 2.5 需要补充：

- 流式响应协议或 fetch stream 消费方式。
- 逐段渲染 `streamingText`。
- 停止生成和请求取消。
- 组件卸载清理。
- stream 完成后的 TestRecord 保存策略。
