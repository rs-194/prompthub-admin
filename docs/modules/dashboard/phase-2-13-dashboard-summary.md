# Phase 2.13B Dashboard 真实数据接入

## 0. 文档状态

- 阶段：Phase 2.13B
- 状态：已实现
- 适用范围：Dashboard 首页 summary 接口、真实统计卡片、最近 TestRecord 和首页 polish

## 1. 本阶段目标

Phase 2.13B 将 Dashboard 首页从前端 mock 展示升级为后端真实 summary 数据入口，让打开项目第一屏时可以看到 Prompt、Knowledge、ModelConfig、ChatTest 和 TestRecord 主链路的当前状态。

## 2. 本阶段已实现

- 新增 `GET /api/v1/dashboard/summary`。
- 后端 summary 汇总 PromptTemplate total / enabled。
- 后端 summary 汇总 KnowledgeDocument total / enabled。
- 后端 summary 汇总 TestRecord total、success、failed、stopped 和 latestCreatedAt。
- 后端 summary 返回最近 5 条 TestRecord。
- 前端 Dashboard 页面接入真实 summary 接口，展示统计卡片、最近测试记录、主链路说明和当前边界提示。
- 前端 service 使用现有 request 封装，并做基础响应结构校验。

## 3. 接口结构

```text
GET /api/v1/dashboard/summary
```

响应包含：

- `prompt`：Prompt 模板总数和启用数量。
- `knowledge`：Knowledge 文档总数和启用数量。
- `testRecord`：测试记录总数、状态统计和最新创建时间。
- `modelConfig`：后端模型配置脱敏状态。
- `recentRecords`：最近 5 条测试记录。

`recentRecords` 只返回首页展示所需字段：`id`、`promptTitle`、`modelName`、`outputPreview`、`status`、`durationMs`、`createdAt`，不返回完整 `output`。

## 4. 安全与边界

- ModelConfig 复用现有后端脱敏状态，只返回 `enabled`、`provider`、`model`、`apiKeyConfigured`。
- Dashboard 不返回 API Key、Authorization、headers 或完整敏感请求信息。
- Dashboard 是项目展示入口，不改变 ChatTest run / stream 主链路。
- 本阶段不修改 Prompt / Knowledge / TestRecord 既有接口契约。
- 当前为轻量整体查询实现，暂不做每一类统计的独立 fail-soft；如果 summary 请求失败，前端展示“首页统计加载失败，不影响其他功能使用”。
- 本阶段不做复杂图表、大屏、权限、多租户、RAG、Prompt 版本管理、多模型并发或 API Key 管理。

## 5. 前端展示

首页当前展示：

- 顶部欢迎区：说明 PromptHub Admin 的 AI Prompt 调试与记录管理定位。
- 统计卡片：Prompt 模板、Knowledge 文档、TestRecord、ModelConfig ready 状态。
- 最近测试记录：展示 promptTitle、status、durationMs、createdAt 和 outputPreview。
- 主链路说明：Prompt 模板 -> Knowledge 上下文 -> 真实流式调试 -> TestRecord 复盘。
- 当前边界提示：Knowledge 当前是手动上下文，不是完整 RAG；API Key 只由后端托管。

## 6. 后续可做

- 首页截图和部署文档补充。
- failed / stopped TestRecord 保存策略。
- 更细的错误恢复和局部 fail-soft。

以上均不属于 Phase 2.13B。
