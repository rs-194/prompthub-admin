# 模块实现方案：对话测试 / Prompt 调试台 v2 知识库上下文 mock 联动

## 0. 文档状态

- 阶段：v2 knowledge-context mock
- 状态：已实现
- 适用范围：前端 mock 版本，不接后端，不真实调用模型 API，不做真实 RAG

## 1. 模块目标

本阶段是在对话测试 / Prompt 调试台 v1 mock 的基础上增强知识库上下文联动能力，让 `/chat-test` 可以体现“Prompt 模板 + 模型配置 + 知识库 mock context + 用户输入”的组合测试流程。

该能力不是正式 RAG，不做真实检索、embedding、向量库、相似度计算或召回排序。当前只是 RAG 前的 mock 上下文注入演示，知识库上下文来自用户手动选择的启用中文档，并使用文档的 summary、tags、sourceName、chunkCount、vectorStatus 等 mock 元数据参与测试展示。

## 2. 本阶段范围

### 本阶段要做

- 加载知识库文档选项。
- 只展示 `enabled === true` 的知识库文档。
- 支持选择一个或多个知识库文档。
- 展示已选知识库文档的摘要预览。
- 运行 mock 测试时把知识库摘要作为上下文输入的一部分。
- mock 输出中体现“参考了知识库 mock context”。
- 测试记录保存使用的知识库标题列表和数量。
- 最近测试记录展示知识库使用情况。

### 本阶段不做

- 不接后端。
- 不真实调用大模型 API。
- 不做真实 RAG 检索。
- 不做 embedding。
- 不接向量数据库。
- 不做真实文本切片。
- 不做召回排序。
- 不做相似度计算。
- 不做知识库上传。
- 不修改知识库管理模块。
- 不修改提示词管理模块。
- 不修改模型配置模块。
- 不修改路由和菜单。
- 不引入新依赖。
- 不引入 LangChain / LangGraph。

## 3. 用户操作流程

进入 `/chat-test`  
→ 加载提示词选项 / 模型配置选项 / 知识库文档选项  
→ 选择提示词  
→ 选择模型配置  
→ 选择一个或多个知识库文档  
→ 查看知识库摘要预览  
→ 输入测试内容  
→ 点击运行测试  
→ 显示 loading  
→ service 根据 prompt / model / userInput / selectedKnowledgeDocs 生成 mock 输出  
→ 页面展示 mock 输出  
→ 保存测试记录，记录包含使用的知识库信息  
→ 最近测试记录刷新

## 4. 页面信息结构

v2 继续在现有 `ChatTestView.vue` 上增强，不新增页面，不新增路由，不修改菜单。

- 知识库选择区：使用多选 `el-select`，只展示启用中的知识库文档。
- 已选知识库上下文预览区：使用 `KnowledgeContextPanel.vue` 展示文档标题、分类 label、来源、摘要、tags、mock chunkCount 和 vectorStatus。
- 测试结果区：`TestResultPanel.vue` 在使用知识库时展示 `contextPreview` 和 `usedKnowledgeTitles`。
- 最近测试记录区：`TestRecordTable.vue` 增加知识库字段，展示“未使用”或“已用 N 篇”，标题列表通过 tooltip 展示，避免表格过宽。

页面明确提示当前为 mock context，不是真实检索结果。

## 5. 文件结构

```text
frontend/src/views/chat-test/
├─ ChatTestView.vue
└─ components/
   ├─ KnowledgeContextPanel.vue
   ├─ TestResultPanel.vue
   └─ TestRecordTable.vue

frontend/src/services/chatTest.ts
frontend/src/types/chatTest.ts
```

新增 `KnowledgeContextPanel.vue`，因为知识库预览字段较多，拆成只展示 props 的局部组件可以避免 `ChatTestView.vue` 继续变厚。

## 6. 类型设计

`frontend/src/types/chatTest.ts` 新增或扩展：

- `ChatTestKnowledgeOption`
- `ChatTestFormData.knowledgeIds`
- `ChatTestFormData.selectedKnowledgeDocs`
- `ChatTestFormData.contextPreview`
- `ChatTestResult.usedKnowledgeTitles`
- `ChatTestResult.contextPreview`
- `ChatTestRecordInput.knowledgeTitles`
- `ChatTestRecordInput.contextPreview`
- `ChatTestRecord.knowledgeTitles`
- `ChatTestRecord.knowledgeCount`
- `ChatTestRecord.contextPreview`

`ChatTestKnowledgeOption.vectorStatus` 复用知识库模块已有 `KnowledgeVectorStatus`，不重新发明状态值。不使用 `any`。

## 7. 页面状态设计

`ChatTestView.vue` 新增：

- `knowledgeOptions`
- `selectedKnowledgeIds`

保持已有：

- `promptOptions`
- `modelOptions`
- `selectedPromptId`
- `selectedModelId`
- `userInput`
- `testResult`
- `testRecords`
- `loading`
- `errorMessage`

`selectedKnowledgeDocs` 使用 computed 从 `knowledgeOptions` 和 `selectedKnowledgeIds` 推导，暂不使用 Pinia。

## 8. service 方法设计

`frontend/src/services/chatTest.ts` 新增或扩展：

- `getChatTestKnowledgeOptions()`
- `runMockPromptTest(data)`
- `saveChatTestRecord(data)`

`getChatTestKnowledgeOptions()` 调用已有 `getKnowledgeDocumentList()` 和 `getKnowledgeCategories()`，只保留启用中文档，并转换为 ChatTest 选项。不修改 knowledge service，不重复维护另一份知识库 mock 数据。

`runMockPromptTest(data)` 接收 prompt、model、userInput 和已选知识库上下文信息；如果选择了知识库，mock 输出体现本次参考了哪些知识库 mock context，并说明不是真实检索结果；如果未选择知识库，仍然返回基础 Prompt 测试 mock 输出。

`saveChatTestRecord(data)` 保存 knowledgeTitles、knowledgeCount 和 contextPreview，仍由 service 生成 id、createdAt、outputPreview 和 status。

## 9. 组件拆分与职责

`KnowledgeContextPanel.vue`：

- 展示已选知识库文档。
- 展示 summary / tags / chunkCount / vectorStatus。
- 明确提示 mock context，不是真实检索结果。
- 不调用 service。
- 不修改数据。
- 不维护本地业务状态。
- 不使用 watch。

`TestResultPanel.vue`：

- 展示 result.contextPreview。
- 展示 result.usedKnowledgeTitles。
- 未使用知识库时仍显示基础 Prompt 测试结果。

`TestRecordTable.vue`：

- 增加知识库字段。
- 展示“未使用”或“已用 N 篇”。
- 标题列表通过 tooltip 展示，避免表格过宽。

## 10. props / emit 设计

`KnowledgeContextPanel.vue`：

- props：`documents`
- emit：无

`TestResultPanel.vue`：

- props 保持 `result`、`loading`、`errorMessage`。
- 知识库结果从 `result` 内部字段读取。

`TestRecordTable.vue`：

- props 保持 `records`。
- 知识库字段从每条 record 的 `knowledgeTitles` 和 `knowledgeCount` 读取。

## 11. computed / watch 使用点

新增 computed：

- `selectedKnowledgeDocs`

`canRunTest` 不强制要求知识库。允许不选知识库运行基础 Prompt 测试。

watch：

- v2 不因为知识库选择引入 watch。
- 不用 watch 手动维护 `selectedKnowledgeDocs`。
- 不用 watch 手动维护 `contextPreview`。

## 12. 关键函数职责

- `loadInitialData`：加载 promptOptions / modelOptions / knowledgeOptions / testRecords。
- `handleRunTest`：校验基础输入，读取 selectedKnowledgeDocs，构造 mock context，调用 service，保存记录。
- `buildKnowledgeContextPreview`：从已选知识库文档生成简短 mock contextPreview。
- `buildRecordInput`：加入 knowledgeTitles 和 contextPreview。
- `handleClearInput`：清空 userInput、testResult、errorMessage，不清空 selectedKnowledgeIds。
- `handleClearResult`：只清空 testResult 和 errorMessage，不影响 selectedKnowledgeIds。

## 13. 数据流 / 调用链

### 页面初始化数据流

页面挂载  
→ `loadInitialData`  
→ 获取 promptOptions / modelOptions / knowledgeOptions / testRecords  
→ 更新页面状态  
→ 页面渲染

### 知识库选择数据流

用户选择知识库文档  
→ `selectedKnowledgeIds` 更新  
→ `selectedKnowledgeDocs` computed 自动重新计算  
→ 知识库上下文预览区刷新

### 运行测试数据流

用户点击运行测试  
→ `handleRunTest`  
→ 校验 promptId / modelId / userInput  
→ 读取 selectedKnowledgeDocs  
→ `buildKnowledgeContextPreview` 生成 mock context  
→ 调用 `runMockPromptTest`  
→ service 生成包含知识库 mock context 痕迹的 mock result  
→ 更新 testResult  
→ `saveChatTestRecord` 保存知识库标题 / 数量  
→ 刷新 testRecords  
→ 页面渲染

## 14. loading / empty / error 状态

- `knowledgeOptions` 为空时，知识库选择区显示轻量提示，不影响基础 Prompt 测试。
- 未选择知识库时，预览区显示“未选择知识库，将按基础 Prompt 测试运行”。
- `selectedKnowledgeDocs` 为空时仍允许运行基础 Prompt 测试。
- `errorMessage` 仍保持轻量，不做复杂错误系统。

## 15. mock 边界与后端替换点

- 当前不是 RAG。
- 当前没有真实检索。
- 当前没有 embedding。
- 当前没有向量库。
- 当前没有相似度计算。
- 当前只是用户手动选择知识库文档。
- 当前只是把 summary 拼成 mock context。
- 后续真实 RAG 会改为：输入问题 → 后端检索相关切片 → 返回上下文 → 调用真实 LLM。
- 后续可替换 `chatTest` service 内部的 context 构建逻辑和 run 方法。

## 16. 验收标准

- 访问 `/chat-test`。
- 知识库选项正常显示。
- 只显示 `enabled === true` 的知识库文档。
- 可以选择一个或多个知识库文档。
- 已选知识库摘要预览正常显示。
- 不选知识库也可以运行基础 Prompt 测试。
- 选择知识库后运行测试，mock 输出体现使用了知识库上下文。
- 最近测试记录体现使用的知识库标题或数量。
- 清空结果不清空知识库选择。
- `cd frontend && npm run build` 通过。
- docs / notes 按规则更新。
- 页面明确提示当前为 mock context，不是真实 RAG。

## 17. docs / notes 更新计划

已更新：

- `docs/development-log.md`
- `docs/roadmap.md`
- `docs/modules/README.md`
- `docs/modules/chat-test/v2-knowledge-context-mock.md`
- `notes/interview/chat-test-notes.md`
- `notes/interview/chat-test-qa.md`
- `README.md`

未更新知识库 notes：本次没有修改知识库管理模块源码和职责，只通过已有 service 读取启用中文档。

## 18. 风险点与避免事项

- 不要把 v2 写成真实 RAG。
- 不要调用 embedding。
- 不要接向量数据库。
- 不要接后端。
- 不要真实调用模型 API。
- 不要要求必须选择知识库才能运行测试。
- 不要修改知识库管理模块。
- 不要修改提示词管理模块。
- 不要修改模型配置模块。
- 不要引入 Pinia。
- 不要引入新依赖。
- 不要引入 LangChain / LangGraph。
- 不要把 mock context 写成真实检索结果。
- 不要让表格因为新增知识库字段变得过宽。
