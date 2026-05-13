# 模块实现方案：知识库管理

## 0. 文档状态

- 阶段：v1 mock
- 状态：已确认 / 已实现
- 适用范围：前端 mock 版本，不接后端，不真实上传文件，不做向量检索

## 1. 模块目标

知识库管理不是普通文件管理页，而是后续 RAG 上下文准备区。v1 只维护知识库文档 mock 元数据，包括标题、分类、来源类型、来源名称、摘要、标签、mock 切片数量、mock 向量化状态、启用状态和更新时间。

后续该模块会作为文档上传、文本解析、文本切片、embedding、向量检索、RAG 调试和 Prompt 调试台联动的入口。

## 2. 本阶段范围

### 本阶段要做

- 加载知识库文档 mock 列表
- 搜索文档
- 按分类筛选
- 按状态筛选
- 新增知识库文档记录
- 编辑知识库文档记录
- 删除知识库文档记录
- 启用 / 停用文档
- 查看文档摘要
- 查看 mock 切片数量和向量化状态
- 展示更新时间

### 本阶段不做

- 不接后端
- 不真实上传文件
- 不真实解析文件
- 不真实文本切片
- 不调用 embedding 模型
- 不接向量数据库
- 不做真实 RAG 检索
- 不接 Prompt 调试台
- 不做文件预览器
- 不做权限系统
- 不引入新依赖
- 不修改提示词管理、模型配置、对话测试模块
- 不修改路由和菜单

## 3. 用户操作流程

进入 `/knowledge`
→ 加载知识库文档列表
→ 输入关键词或选择分类 / 状态进行筛选
→ 查看文档列表
→ 点击新增文档
→ 填写文档标题、分类、标签、摘要、来源等信息
→ 保存后列表刷新
→ 点击编辑可回填表单
→ 点击删除需要确认
→ 点击启用 / 停用可切换文档状态
→ 点击查看摘要可查看文档详情和 mock 切片信息

## 4. 页面信息结构

- 页面标题与说明：说明当前为 mock 知识库管理，用于后续 RAG 上下文准备。
- 筛选区：搜索框、分类筛选、状态筛选、重置按钮。
- 操作区：新增文档按钮。
- 文档表格区：标题、分类、来源、标签、mock 切片数、mock 向量化状态、启用状态、更新时间、操作。
- 新增 / 编辑文档弹窗：维护文档 metadata，不涉及真实上传。
- 文档摘要 / mock 切片信息抽屉：使用 Drawer 保留列表上下文，适合查看当前行扩展信息。

## 5. 文件结构

```text
frontend/src/views/knowledge/
├─ KnowledgeListView.vue
└─ components/
   ├─ KnowledgeFormDialog.vue
   └─ KnowledgePreviewDrawer.vue

frontend/src/services/knowledge.ts
frontend/src/types/knowledge.ts
docs/modules/knowledge/v1-mock-design.md
notes/interview/knowledge-module-notes.md
notes/interview/knowledge-module-qa.md
```

## 6. 类型设计

- `KnowledgeCategory`：分类选项，包含 `label` 和 `value`。
- `KnowledgeStatus`：筛选状态，取值为 `enabled` 或 `disabled`。
- `KnowledgeVectorStatus`：mock 向量化状态，取值为 `not_started`、`processing`、`completed`、`failed`。
- `KnowledgeSourceType`：来源类型，取值为 `manual`、`pdf`、`web`、`markdown`。
- `KnowledgeDocumentItem`：完整文档记录，包含 id、标题、分类、来源、摘要、标签、mock 切片数、mock 向量化状态、启用状态和更新时间。
- `KnowledgeDocumentFormData`：表单数据，不包含 id 和 updatedAt。
- `KnowledgeDialogMode`：弹窗模式，取值为 `create` 或 `edit`。

## 7. 页面状态设计

- service 加载结果：`documents`、`categories`
- 用户筛选状态：`searchKeyword`、`selectedCategory`、`selectedStatus`
- 弹窗状态：`dialogVisible`、`dialogMode`、`currentFormData`、`currentEditId`
- 预览抽屉状态：`previewVisible`、`currentPreviewDocument`
- 加载状态：`loading`

这些状态只服务当前页面，v1 不跨页面共享，因此暂不引入 Pinia。

## 8. service 方法设计

- `getKnowledgeCategories()`
- `getKnowledgeDocumentList()`
- `createKnowledgeDocument(data)`
- `updateKnowledgeDocument(id, data)`
- `deleteKnowledgeDocument(id)`
- `toggleKnowledgeDocumentEnabled(id, enabled)`

当前 service 使用前端 mock 数组。新增时生成 id 和 updatedAt；编辑时更新 updatedAt；删除时从数组移除；启用 / 停用只更新 enabled 和 updatedAt。返回数据时对对象和 tags 数组做拷贝，避免暴露内部可变数组。

## 9. 组件拆分与职责

- `KnowledgeListView.vue`：负责页面状态、筛选、调用 service、组织整体数据流。
- `KnowledgeFormDialog.vue`：负责新增 / 编辑知识库文档表单、本地表单状态、回填、轻量校验和 tags 转换。
- `KnowledgePreviewDrawer.vue`：负责展示摘要、标签、来源、分类、更新时间、chunkCount、vectorStatus 等 mock 预览信息。

子组件不直接调用 service。

## 10. props / emit 设计

### KnowledgeFormDialog.vue

props：`visible`、`mode`、`initialData`、`categories`

emit：`update:visible`、`submit`

表单弹窗维护本地表单状态，使用 watch 在弹窗打开、mode 或 initialData 变化时同步表单。

### KnowledgePreviewDrawer.vue

props：`visible`、`document`，并接收父组件计算后的展示 label。

emit：`update:visible`

Drawer 只展示 props，不调用 service，不修改 document，不使用 watch 维护本地副本。

## 11. computed / watch 使用点

computed：

- `categoryLabelMap`
- `filteredDocuments`

watch：

- `KnowledgeFormDialog` 中监听 props，把 initialData 同步到本地表单。
- `KnowledgePreviewDrawer` 不需要 watch。

## 12. 关键函数职责

- `loadKnowledgeData`：加载分类和文档列表。
- `getCategoryLabel`：分类 value 转展示 label。
- `getVectorStatusLabel`：mock 向量化状态转中文。
- `handleReset`：重置筛选。
- `handleOpenCreate`：打开新增弹窗。
- `handleOpenEdit`：打开编辑弹窗并回填。
- `handleSubmit`：根据 mode 新增或编辑，并重新加载列表。
- `handleDelete`：确认后删除，并重新加载列表。
- `handleToggleEnabled`：启用 / 停用文档，并重新加载列表。
- `handleOpenPreview`：打开预览抽屉。
- `handleClosePreview`：关闭预览抽屉。

## 13. 数据流 / 调用链

页面初始化：

页面挂载 → `loadKnowledgeData` → 获取 categories / documents → 更新页面状态 → `filteredDocuments` 自动计算 → 表格渲染

搜索筛选：

用户输入关键词 / 选择分类 / 选择状态 → 筛选状态更新 → `filteredDocuments` 自动重新计算 → 表格刷新

新增文档：

点击新增 → 设置 create mode → 打开表单弹窗 → 子组件提交 → 父组件调用 `createKnowledgeDocument` → 重新加载列表

编辑文档：

点击编辑 → 设置 edit mode → 当前行转表单数据 → 子组件 watch 回填 → 父组件调用 `updateKnowledgeDocument` → 重新加载列表

删除文档：

点击删除 → 确认弹窗 → 调用 `deleteKnowledgeDocument` → 重新加载列表

启用 / 停用：

切换 enabled → 调用 `toggleKnowledgeDocumentEnabled` → 重新加载列表

预览：

点击查看 → 设置当前预览文档 → 打开 Drawer → 展示摘要与 mock 切片信息

## 14. loading / empty / error 状态

- `loading`：加载文档列表时使用。
- `empty`：筛选无结果时使用 Element Plus 表格默认空状态。
- `error`：v1 mock 暂不实现复杂错误系统。
- `disabled`：提交按钮根据必填字段禁用。

## 15. mock 边界与后端替换点

- 当前不真实上传文件。
- 当前不真实解析文件。
- 当前不真实文本切片。
- 当前不调用 embedding 模型。
- 当前不接向量数据库。
- `chunkCount` 是 mock 字段。
- `vectorStatus` 是 mock 状态。
- 后续接后端后，service 方法会替换成真实 HTTP 请求。
- 后续 RAG 阶段会新增文档上传、切片、embedding、向量检索。
- 后续可与 Prompt 调试台联动，让调试台选择知识库作为上下文来源。

## 16. 验收标准

- 访问 `/knowledge`
- 文档列表正常显示
- 搜索可用
- 分类筛选可用
- 状态筛选可用
- 重置筛选可用
- 新增文档可用
- 编辑文档可用
- 删除文档有确认弹窗
- 启用 / 停用可用
- 查看摘要 / mock 切片信息可用
- CRUD 后筛选结果仍正常
- `cd frontend && npm run build` 通过
- docs / notes 按规则更新
- 页面明确体现当前为 mock 知识库管理，不做真实上传、切片、向量化或 RAG

## 17. docs / notes 更新

- 已更新 `docs/development-log.md`
- 已更新 `docs/roadmap.md`
- 已新增 `docs/modules/knowledge/v1-mock-design.md`
- 已更新 `docs/modules/README.md`
- 已新增 `notes/interview/knowledge-module-notes.md`
- 已新增 `notes/interview/knowledge-module-qa.md`
- 已更新 `README.md`
- 已更新 `docs/frontend-architecture.md`

## 18. 风险点与避免事项

- 不要把知识库模块写成真实文件上传系统。
- 不要做真实文本切片。
- 不要接 embedding。
- 不要接向量数据库。
- 不要做真实 RAG。
- 不要引入新依赖。
- 不要修改 Prompt 调试台、提示词管理或模型配置模块。
- 不要把计划中的 RAG / Agent 写成已实现。
- 不要过度拆分组件。
- 不要把 mock 数据写死在 View 中。
- 不要修改全局样式。
- 不要引入 Pinia。
