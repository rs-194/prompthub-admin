# 模块实现方案：对话测试 / Prompt 调试台

## 0. 文档状态

- 阶段：v1 mock
- 状态：已实现
- 适用范围：前端 mock 版本，不接后端，不真实调用模型 API

## 1. 模块目标

该模块用于验证“提示词模板 + 模型配置 + 测试输入”的组合效果。它不是普通聊天页，而是面向 Prompt 调试的后台工作台。当前先完成 mock 闭环，后续承接真实 LLM API、测试记录持久化、RAG 与 Agent Workflow 调试能力。

## 2. 本阶段范围

### 本阶段要做

- 加载提示词选项
- 加载 enabled 为 true 的模型配置选项
- 选择提示词与模型配置
- 输入测试内容
- 运行 mock 测试并展示结果
- 保存前端内存测试记录
- 展示最近测试记录
- 支持 loading、empty 和轻量 errorMessage 状态

### 本阶段不做

- 不接后端
- 不真实调用模型 API
- 不保存或处理真实 API Key
- 不做 RAG、Agent Workflow、流式输出、多轮上下文
- 不引入 Pinia 和新依赖
- 不修改提示词管理模块、模型配置模块、路由和菜单

## 3. 用户操作流程

进入 `/chat-test`  
→ 加载提示词选项和模型配置选项  
→ 选择提示词  
→ 选择模型配置  
→ 输入测试内容  
→ 点击运行测试  
→ 显示 loading  
→ service 返回 mock 输出  
→ 页面展示测试结果  
→ service 保存测试记录  
→ 最近测试记录表格刷新

## 4. 页面信息结构

- 页面标题与 mock 说明
- 提示词选择
- 模型配置选择
- 提示词预览
- 测试输入
- 运行按钮、清空按钮、清空结果按钮
- 输出结果区
- 最近测试记录区

## 5. 文件结构

```text
frontend/src/views/chat-test/
├─ ChatTestView.vue
└─ components/
   ├─ TestResultPanel.vue
   └─ TestRecordTable.vue

frontend/src/services/chatTest.ts
frontend/src/types/chatTest.ts
```

v1 只做轻量拆分。提示词选择、模型选择、测试输入、运行按钮和提示词预览暂时保留在 View 中，减少 props / emit 复杂度；后续复杂后再拆 `PromptPreviewCard` 和 `TestInputPanel`。

## 6. 类型设计

- `ChatTestPromptOption`
- `ChatTestModelOption`
- `ChatTestFormData`
- `ChatTestResult`
- `ChatTestRecordInput`
- `ChatTestRecord`

其中 `ChatTestModelOption.provider` 复用模型配置模块已有 provider 类型；`ChatTestRecord.status` 为 `'success' | 'failed'`。

## 7. 页面状态设计

View 维护：

- `promptOptions`
- `modelOptions`
- `selectedPromptId`
- `selectedModelId`
- `userInput`
- `testResult`
- `testRecords`
- `loading`
- `errorMessage`

这些状态均为页面局部状态，不引入 Pinia。

## 8. service 方法设计

- `getChatTestPromptOptions()`：调用已有 `getPromptList()` 转换选项
- `getChatTestModelOptions()`：调用已有 `getModelConfigList()`，仅保留 enabled 模型
- `runMockPromptTest(data)`：返回 mock 输出
- `saveChatTestRecord(data)`：service 生成 id、createdAt、outputPreview、status
- `getChatTestRecords()`：返回前端内存记录浅拷贝

## 9. 组件拆分与职责

- `ChatTestView.vue`：状态中心与整体数据流组织
- `TestResultPanel.vue`：展示 loading、empty、errorMessage 与测试结果
- `TestRecordTable.vue`：展示最近测试记录

## 10. props / emit 设计

- `TestResultPanel.vue`
  - props：`result`、`loading`、`errorMessage`
  - emit：无
- `TestRecordTable.vue`
  - props：`records`
  - emit：无

## 11. computed / watch 使用点

- computed：`selectedPrompt`、`selectedModel`、`canRunTest`
- watch：v1 不使用 watch

## 12. 关键函数职责

- `loadInitialData`
- `handleRunTest`
- `handleClearInput`
- `handleClearResult`
- `refreshTestRecords`
- `buildRecordInput`

## 13. 数据流 / 调用链

页面初始化：  
页面挂载 → `loadInitialData` → 获取 promptOptions / modelOptions / testRecords → 更新页面状态

运行测试：  
点击运行 → 校验输入 → 设置 loading → `runMockPromptTest` → 更新结果 → `saveChatTestRecord` → 刷新记录 → 取消 loading

清空：  
点击清空 → 清空 `userInput` / `testResult` / `errorMessage`

## 14. loading / empty / error 状态

- loading：运行测试中
- empty：未运行时结果区展示空态
- error：仅保留轻量 `errorMessage`
- disabled：输入不完整或 loading 时禁用运行按钮

## 15. mock 边界与后端替换点

- 当前不真实调用模型 API
- 当前记录只存在前端内存中
- `runMockPromptTest` 是后续真实模型调用的优先替换点
- 测试记录后续由后端持久化
- 真实 API Key 后续应由后端安全处理

## 16. 验收标准

- 访问 `/chat-test`
- 提示词和启用模型配置选项正常显示
- 提示词预览正常显示
- 输入为空时运行按钮不可用
- 点击运行后出现 loading 并展示 mock 输出
- 最近测试记录新增一条
- 清空按钮可用
- `cd frontend && npm run build` 通过

## 17. docs / notes 更新计划

- `README.md`
- `docs/roadmap.md`
- `docs/development-log.md`
- `docs/modules/README.md`
- `notes/interview/chat-test-notes.md`
- `notes/interview/chat-test-qa.md`

## 18. 风险点与避免事项

- 不把调试台做成普通聊天页
- 不接真实模型 API
- 不保存真实 API Key
- 不引入 Pinia 和新依赖
- 不修改提示词管理和模型配置模块
- 不把 mock 输出写死在 View 中
- 不让 View 拼完整测试记录
- 不把 RAG / Agent 写成已实现
