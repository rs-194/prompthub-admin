# PromptHub Admin 项目展示页

## 1. 项目简介

PromptHub Admin 是一个面向大模型应用开发的 AI Prompt 调试与记录管理平台。当前版本围绕 Prompt 调试主链路展开：选择后端 Prompt 模板、手动选择 Knowledge 文档上下文、查看后端可信模型配置状态、运行真实 LLM 流式调试，并通过 TestRecord 做详情复盘和双记录对比。

## 2. 解决的问题

普通 AI 对话页面通常只关注单次输入和输出，不方便管理 Prompt 模板、知识上下文、模型配置状态和测试记录。PromptHub Admin 将这些信息组织成可追踪的调试链路，便于复盘一次模型输出使用了哪些输入和配置，以及它与历史结果的差异。

## 3. 当前功能模块

- Dashboard：展示 Prompt、Knowledge、TestRecord、ModelConfig 真实统计和最近测试记录。
- Prompt 管理：后端 PromptTemplate CRUD，列表 preview，详情按需加载完整 content。
- Knowledge 管理：后端 KnowledgeDocument CRUD，列表 preview，详情按需加载完整 content。
- ModelConfig：展示后端可信 LLM 配置状态，API Key 只显示是否已配置。
- ChatTest：选择 Prompt、Knowledge 和模型配置并运行真实流式调试。
- TestRecord：保存成功记录，支持列表、详情 Drawer 和双记录对比 Drawer。

## 4. 核心业务流

```text
PromptTemplate + KnowledgeDocument + ModelConfig
→ ChatTest
→ FastAPI stream
→ LLM API
→ NDJSON 流式渲染
→ TestRecord
→ 详情 / 对比复盘
```

## 5. 技术亮点

- Vue 3 + TypeScript 组织前端页面、类型、service 和局部组件。
- Element Plus 实现 Table、Drawer、Dialog、Form 等后台交互。
- fetch stream + ReadableStream + TextDecoder 逐行解析 NDJSON，实现真实流式输出。
- 使用 AbortController 支持停止生成和组件卸载清理。
- TestRecord 列表只返回 `outputPreview`，详情再按需请求完整 `output`。
- 双记录对比复用详情接口，并排展示两次历史调试的输入、参数、上下文和输出。
- FastAPI + httpx 代理真实 LLM API，API Key 只由后端环境变量托管。

## 6. 项目截图

以下截图将在公开仓库发布前补充，统一存放在 `docs/assets/screenshots/`。

### Dashboard

截图待补充：`docs/assets/screenshots/dashboard.png`

### Prompt 管理

截图待补充：`docs/assets/screenshots/prompt-list.png`

### Knowledge 管理

截图待补充：`docs/assets/screenshots/knowledge-list.png`

### ChatTest 流式调试

截图待补充：`docs/assets/screenshots/chat-test-streaming.png`

### TestRecord 详情

截图待补充：`docs/assets/screenshots/test-record-detail.png`

### TestRecord 双记录对比

截图待补充：`docs/assets/screenshots/test-record-compare.png`

## 7. 当前边界

- Knowledge 是手动上下文，不是 embedding、向量数据库或自动召回。
- 当前不支持文件上传、文档解析或检索结果排序。
- Prompt 不支持版本管理、diff、变量引擎或审核流。
- ModelConfig 只展示后端可信状态，不做多 provider 管理或 API Key 加密存储。
- TestRecord 双记录对比是历史记录复盘，不是多模型并发生成。
- 当前没有真实 auth、JWT、RBAC、多租户或 Workspace。

## 8. 后续规划

- 补充真实项目截图和部署说明。
- 完善 failed / stopped TestRecord 保存策略。
- 增加 Prompt 版本管理和简单变量填充。
- 设计 Knowledge 文件上传、embedding 和 RAG 链路。
- 评估真实认证、Workspace、多 provider、权限和审计。
