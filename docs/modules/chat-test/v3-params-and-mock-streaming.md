# 模块实现方案：对话测试 / Prompt 调试台 v3 测试参数区 + mock 流式输出

## 0. 文档状态

- 阶段：v3 mock streaming
- 状态：已实现
- 适用范围：前端 mock 流式输出，不接后端，不真实 SSE

## 1. 模块目标

v3 是对 ChatTest v1 / v2 的增强，在已有“Prompt 模板 + 模型配置 + 可选知识库 mock context + 用户输入 + mock 输出 + 测试记录”的基础上，增加测试参数区和 mock 流式输出体验。

目标是让 `/chat-test` 更像真实 AI 应用调试界面：用户可以设置 temperature、maxTokens、outputFormat，并看到输出内容按分段逐步追加。

当前不是正式 SSE，不真实调用模型 API，只是前端通过 timer 分段追加 mock 输出。后续接 FastAPI 后，可替换为真实 SSE、`StreamingResponse` 或 `fetch stream`。

## 2. 本阶段范围

### 本阶段要做

- 增加测试参数区。
- 支持 `temperature`。
- 支持 `maxTokens`。
- 支持 `outputFormat`。
- 运行测试时携带参数生成 mock 输出。
- 输出结果区支持 streaming 状态。
- mock 输出分段追加显示。
- 运行中禁用运行按钮。
- 支持停止生成，只停止前端 mock timer。
- 测试记录保存参数信息。
- 测试记录展示参数摘要。
- 保留 v2 知识库 mock context 联动能力。
- 保留不选知识库也能运行的基础 Prompt 测试能力。

### 本阶段不做

- 不接后端。
- 不真实调用模型 API。
- 不做真实 SSE。
- 不接 SDK。
- 不接 WebSocket。
- 不做真实 token 计费。
- 不做真实 maxTokens 截断。
- 不做真实 temperature 采样。
- 不修改 Prompt 管理模块。
- 不修改 Model 管理模块。
- 不修改 Knowledge 管理模块。
- 不修改登录模块。
- 不引入新依赖。
- 不引入 LangChain / LangGraph。
- 不引入 Pinia。

## 3. 用户操作流程

进入 `/chat-test`  
→ 加载 prompt / model / knowledge / records  
→ 选择 Prompt  
→ 选择模型  
→ 可选知识库  
→ 设置 temperature / maxTokens / outputFormat  
→ 输入测试内容  
→ 点击运行  
→ 页面进入 streaming / loading 状态  
→ mock 文本按分段追加到结果区  
→ 完成后生成 `ChatTestResult`  
→ 保存测试记录，包含参数摘要  
→ 最近测试记录刷新

## 4. 页面信息结构

- 测试配置区：保留提示词模板、模型配置、知识库文档和测试内容输入。
- 测试参数区：新增 `TestParameterPanel.vue`，展示 temperature、maxTokens、outputFormat。
- 知识库 mock context 预览区：保留 v2 能力。
- 输出结果区：streaming 时显示“生成中”和增量文本；停止后保留已生成草稿；完成后展示最终结果。
- 测试记录表：新增参数摘要列，短文本展示 `T=0.7 / 800 tokens / Markdown`。

## 5. 文件结构

```text
frontend/src/views/chat-test/
├─ ChatTestView.vue
└─ components/
   ├─ KnowledgeContextPanel.vue
   ├─ TestParameterPanel.vue
   ├─ TestResultPanel.vue
   └─ TestRecordTable.vue

frontend/src/services/chatTest.ts
frontend/src/types/chatTest.ts
```

## 6. 类型设计

`frontend/src/types/chatTest.ts` 新增：

- `ChatTestOutputFormat = 'text' | 'markdown' | 'json'`
- `ChatTestParams`
  - `temperature: number`
  - `maxTokens: number`
  - `outputFormat: ChatTestOutputFormat`

扩展：

- `ChatTestFormData.params`
- `ChatTestResult.params`
- `ChatTestResult.paramsSummary`
- `ChatTestRecordInput.params`
- `ChatTestRecord.params`
- `ChatTestRecord.paramsSummary`

要求：不使用 `any`。参数只用于 mock 展示、输出文案和记录摘要，不代表真实采样、真实 token 限制或真实模型输出格式。

## 7. 页面状态设计

`ChatTestView.vue` 新增：

- `testParams`：用户输入的测试参数，默认 temperature `0.7`、maxTokens `800`、outputFormat `markdown`。
- `streamingText`：前端 mock streaming 过程中的临时输出。
- `streaming`：表示 mock 输出正在分段追加。
- `streamTimerId`：保存当前 `window.setTimeout` id。
- `streamChunks` / `streamChunkIndex` / `pendingStreamResult`：保存当前 mock streaming 临时数据。

保留：

- `promptOptions`
- `modelOptions`
- `knowledgeOptions`
- `selectedPromptId`
- `selectedModelId`
- `selectedKnowledgeIds`
- `userInput`
- `testResult`
- `testRecords`
- `loading`
- `errorMessage`

`loading` 可表示运行准备阶段，`streaming` 专门表示 mock 输出正在分段追加。运行按钮禁用条件包含 `!loading && !streaming`。这些状态都是页面局部状态，不放 Pinia。

## 8. service 方法设计

- `runMockPromptTest(data)`：生成完整 mock result，接收 params，输出文案中展示参数说明；不真实调用模型 API，不做真实采样、截断或格式约束。
- `createMockStreamChunks(output)`：把完整 mock output 按行拆成 `string[]`，供前端 timer 追加；不做真实 token 切分，不模拟 SSE 协议。
- `saveChatTestRecord(data)`：保存 params 和 paramsSummary，继续由 service 生成 id、createdAt、outputPreview、status。
- `buildParamsSummary(params)`：生成短参数摘要，例如 `T=0.7 / 800 tokens / Markdown`。

后续真实 SSE / LLM API 接入时，优先替换 service 的模型调用逻辑和 View 中 streaming 消费逻辑。

## 9. 组件拆分与职责

`TestParameterPanel.vue`：

- 展示 temperature / maxTokens / outputFormat。
- 通过 `v-model` / `update:modelValue` 把参数变化交给父组件。
- 不调用 service。
- 不维护测试结果。
- 不使用 watch。
- 不直接修改 props。

`TestResultPanel.vue`：

- 展示 error、loading、streamingText、最终 result。
- streaming 时显示“生成中”。
- 停止生成后保留已生成草稿。
- 不调用 service。
- 不维护业务状态。

`TestRecordTable.vue`：

- 继续只接收 `records`。
- 从 `record.paramsSummary` 中读取参数摘要。
- 新增短参数列，避免表格过宽。

## 10. props / emit 设计

`TestParameterPanel.vue`：

- props：`modelValue: ChatTestParams`
- emit：`update:modelValue`

`TestResultPanel.vue`：

- props：`result`、`loading`、`streaming`、`streamingText`、`errorMessage`
- emit：无

`TestRecordTable.vue`：

- props：`records`
- emit：无

## 11. computed / watch 使用点

computed：

- `selectedPrompt`
- `selectedModel`
- `selectedKnowledgeDocs`
- `canRunTest`

`canRunTest` 判断 prompt、model、userInput，并且要求 `!loading && !streaming`。

watch：

- v3 不为 streaming 引入 watch。
- mock streaming 由 `handleRunTest` 显式启动。
- timer 清理由 `clearStreamingState`、`stopMockStreaming`、`onBeforeUnmount` 显式处理。

## 12. 关键函数职责

- `handleRunTest`：校验 prompt / model / userInput，构造包含 knowledge 和 params 的 `ChatTestFormData`，调用 service 生成完整 result 和 chunks，启动 mock streaming。
- `startMockStreaming`：保存 chunks 和 finalResult，设置 streaming 状态，开始追加文本。
- `appendNextChunk`：每次追加一个 chunk，结束后调用 `finishMockStreaming`。
- `finishMockStreaming`：清理 timer，设置 final result，保存测试记录，刷新 records，关闭 loading / streaming。
- `stopMockStreaming`：停止前端 mock timer，保留已生成草稿，不保存成功记录。
- `clearStreamingState`：清理 timer、streamingText、chunks 和临时 result。
- `buildRecordInput`：保存最终 result 的输出、知识库信息和 params，不保存中途 streamingText。

## 13. 数据流 / 调用链

### 参数调整数据流

用户修改 temperature / maxTokens / outputFormat  
→ `TestParameterPanel` emit `update:modelValue`  
→ `ChatTestView.vue` 的 `testParams` 更新  
→ 参数区展示更新  
→ 下一次运行测试时携带参数

### mock 流式输出数据流

点击运行  
→ `handleRunTest`  
→ 校验 prompt / model / userInput  
→ 构造 prompt / model / knowledge / params 数据  
→ `runMockPromptTest` 生成完整 mock result  
→ `createMockStreamChunks` 拆分输出文本  
→ 清空旧 `testResult` 和 `streamingText`  
→ 设置 streaming / loading  
→ `startMockStreaming`  
→ 分段追加 `streamingText`  
→ 完成后设置 `testResult`  
→ 保存测试记录，包含 params 和 paramsSummary  
→ 刷新 `testRecords`  
→ 关闭 streaming / loading

### 清空数据流

点击清空结果  
→ 停止可能存在的 mock streaming  
→ 清空 `streamingText` / `testResult` / `errorMessage`  
→ 不清空 prompt / model / knowledge / params

## 14. loading / empty / error 状态

- streaming 时运行按钮禁用。
- streaming 时结果区显示“生成中”。
- streaming 时结果区展示已追加的 `streamingText`。
- 未运行时仍显示 empty。
- 出错时清理 streaming 状态和 timer。
- 停止生成只停止前端 timer，不代表真实 API cancel。
- 停止生成不保存成功记录。

## 15. mock 边界与后端替换点

- 当前不是真 SSE。
- 当前不调用真实模型 API。
- 当前不通过 SDK。
- 当前只是 `setTimeout` / timer 模拟分段输出。
- `temperature` 只是 mock 参数，不做真实采样。
- `maxTokens` 只是 mock 参数，不做真实截断。
- `outputFormat` 只是 mock 参数，不代表模型真实遵循格式。
- 后续真实后端可替换为 FastAPI `StreamingResponse` 或 SSE。
- 前端后续可用 `EventSource` 或 `fetch stream` 接收输出。

## 16. 验收标准

- 访问 `/chat-test`。
- 参数区正常显示。
- 修改 temperature / maxTokens / outputFormat 可用。
- 不选知识库也能运行。
- 选择知识库也能运行。
- 点击运行后结果区分段出现文本。
- 运行中按钮禁用。
- 运行中可以停止生成。
- 停止生成后 timer 被清理，状态恢复。
- 停止生成不保存成功记录。
- 完成后保存测试记录。
- 测试记录展示参数摘要。
- 清空结果可用。
- 清空结果不清空 prompt / model / knowledge / params。
- `cd frontend && npm run build` 通过。
- 页面和文档明确当前为 mock streaming，不是真 SSE。
- 页面和文档明确参数不代表真实采样、真实 token 限制或真实模型输出格式。

## 17. docs / notes 更新计划

已更新：

- `docs/development-log.md`
- `docs/roadmap.md`
- `docs/modules/README.md`
- `docs/modules/chat-test/v3-params-and-mock-streaming.md`
- `notes/interview/chat-test-notes.md`
- `notes/interview/chat-test-qa.md`
- `README.md`

## 18. 风险点与避免事项

- 不要写成真实 SSE。
- 不要接真实模型 API。
- 不要引入 SDK。
- 不要引入新依赖。
- 不要引入 LangChain / LangGraph。
- 不要修改 Prompt / Model / Knowledge / Auth 管理模块。
- 不要把 temperature / maxTokens 写成真实生效。
- 不要把 outputFormat 写成模型真实遵循格式。
- 不要忘记清理 timer。
- 不要让 streaming 状态和 loading 状态冲突。
- 不要让记录表过宽。
- 不要破坏 v1 / v2 已有能力。
