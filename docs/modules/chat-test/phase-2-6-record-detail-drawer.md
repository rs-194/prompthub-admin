# Phase 2.6：TestRecord 详情 Drawer

## 文档状态

- 阶段：Phase 2.6
- 状态：已实现
- 适用范围：ChatTest 最近测试记录详情查看

## 阶段目标

Phase 2.6 完成 TestRecord 详情 Drawer，让用户在最近测试记录列表中点击“详情”后，按需查看完整调试上下文和完整模型输出。

## 本阶段已完成

- 最近测试记录表格新增“详情”操作列。
- `TestRecordTable.vue` 只负责展示列表摘要，并通过 emit 把 record id 交给父组件。
- `ChatTestView.vue` 管理详情 Drawer 的 visible、loading、error、empty 和 detail 状态。
- 新增 `getTestRecordDetail(id)`，通过普通 JSON request 封装调用 `GET /api/v1/test-records/{id}`。
- 新增 `TestRecordDetailDrawer.vue`，展示基本信息、参数信息、用户输入、知识库上下文、完整 output 和 outputPreview。
- 详情请求处理 404、网络异常、响应结构异常和未知错误，不暴露后端内部堆栈。

## 数据加载策略

列表仍只展示 `outputPreview`，不在最近测试记录列表里塞完整 `output`。

完整 `output` 只在用户打开详情 Drawer 时，通过 `GET /api/v1/test-records/{id}` 按需获取。这样可以避免列表接口响应体过大，也避免长文本输出影响表格渲染性能。

## 用户操作流程

1. 用户在 ChatTest 页面完成一次测试，后端正常保存 TestRecord。
2. 最近测试记录列表展示 record 摘要和 `outputPreview`。
3. 用户点击某条记录的“详情”按钮。
4. `ChatTestView.vue` 打开 Drawer 并进入 loading 状态。
5. 前端调用 `GET /api/v1/test-records/{id}`。
6. 成功后 Drawer 展示完整详情；失败时展示页面内错误状态。
7. 关闭 Drawer 时清理 error 和当前 record id。

## 本阶段不做

- 不修改后端业务逻辑。
- 不做多记录对比。
- 不做多模型并发生成。
- 不做真实 RAG、embedding 或向量数据库。
- 不做 ModelConfig 后端化。
- 不做 auth / JWT / RBAC。
- 不做多租户 / Workspace。

## 后续入口

下一阶段可以在当前详情 Drawer 基础上做双记录对比，例如选择两条 TestRecord 后对比 userInput、params、knowledgeTitles、durationMs 和 output 差异。

## 验收标准

- `cd frontend && npm run build` 通过。
- 进入 `/chat-test`，确保有测试记录后点击“详情”。
- Drawer 能展示完整 `output`、`userInput`、params、knowledgeTitles、durationMs 和 createdAt。
- 记录不存在或请求失败时，Drawer 内展示清晰错误提示。
- 列表仍只展示 `outputPreview`，完整 `output` 不进入列表行数据。
