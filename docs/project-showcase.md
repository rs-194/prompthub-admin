# PromptHub Admin 项目展示页

## 1. 项目简介

PromptHub Admin 是一个面向大模型应用开发的 AI Prompt 调试与记录管理平台。当前版本围绕 Prompt 调试主链路展开：选择后端 Prompt 模板、手动选择 Knowledge 文档上下文、查看后端可信模型配置状态、运行真实 LLM 流式调试，并通过 TestRecord 做详情复盘和双记录对比。

## 2. 解决的问题

普通 AI 对话页面通常只关注单次输入和单次输出，不方便管理 Prompt 模板、知识库上下文、模型配置状态和测试记录。PromptHub Admin 把这些信息沉淀成可追踪的调试链路，方便开发者复盘一次模型输出为什么产生、用了哪些配置、和历史结果有什么差异。

## 3. 当前功能模块

- Prompt 管理：后端 PromptTemplate CRUD，列表 preview，详情按需加载完整 content。
- Knowledge 管理：后端 KnowledgeDocument CRUD，列表 preview，详情按需加载完整 content。
- ModelConfig：展示后端可信 LLM 配置状态，API Key 只显示是否已配置。
- ChatTest：选择 Prompt / Knowledge / Model 配置状态并运行真实流式调试。
- TestRecord：保存成功记录，支持列表、详情 Drawer 和双记录对比 Drawer。

## 4. 核心业务流

```text
PromptTemplate
+ KnowledgeDocument
+ ModelConfig
→ ChatTest
→ FastAPI stream
→ LLM API
→ NDJSON 流式渲染
→ TestRecord
→ 详情 / 对比复盘
```

## 5. 技术亮点

- Vue3 + TypeScript 组织前端页面、类型、service 和局部组件。
- Element Plus 实现 Table、Drawer、Dialog、Form 等后台常用交互。
- fetch stream + ReadableStream + TextDecoder 逐行解析 NDJSON，实现真实流式输出渲染。
- 使用 AbortController 支持停止生成和组件卸载清理。
- TestRecord 列表只返回 `outputPreview`，详情 Drawer 再按需请求完整 `output`。
- 双记录对比复用详情接口，并排展示两次历史调试的输入、参数、上下文和完整输出。
- 后端使用 FastAPI + httpx 代理真实 LLM API，API Key 只由后端环境变量托管。
- 前后端以 types / schemas 保持字段契约清晰，避免在 View 中堆积请求细节。

## 6. 开发问题与收获

- 通过排查 Vue 组件作用域和 `<script setup>` 问题，加深了对 Vue3 组件写法的理解。
- 通过处理 Dialog / Drawer / Panel 的 props、emit 和 v-model，同步了父子组件通信边界。
- 通过 Prompt / Knowledge / TestRecord 的 preview / detail 设计，理解了列表轻量接口和详情完整接口的区别。
- 通过 fetch stream 的 buffer 解析，理解了流式响应中 chunk 不等于完整 JSON 的问题。
- 通过明确 Knowledge 不是 RAG、API Key 不进前端，学会在项目展示中保持能力边界真实。

## 7. 项目收获

- 把项目定位从普通聊天页推进到 AI Prompt 调试工具，围绕 Prompt、Knowledge、ModelConfig、ChatTest 和 TestRecord 形成可复盘链路。
- 理解 Prompt / Knowledge / ModelConfig 如何组合进 ChatTest：Prompt 提供系统指令，Knowledge 提供手动上下文，ModelConfig 展示后端可信配置状态。
- 通过 fetch stream / ReadableStream / NDJSON 实践浏览器端流式渲染，并配合 AbortController 处理停止生成。
- 认识到 TestRecord 不只是保存结果，还能支持详情复盘和双记录对比，帮助解释两次调试输入、参数、上下文和输出差异。
- 明确 Knowledge 当前不是 RAG；后续如果做 RAG，需要单独设计文档切片、embedding、召回、排序和 TestRecord 中的检索结果追踪。

## 8. 截图占位

### ChatTest 流式调试

占位：展示 Prompt 模板选择、Knowledge 文档选择、模型状态、参数区、运行中逐段输出和停止生成按钮。

### TestRecord 详情 Drawer

占位：展示列表中的 outputPreview，以及点击详情后完整 output、输入、参数、知识库标题和耗时。

### TestRecord 双记录对比 Drawer

占位：展示两条历史记录的并排对比，包括 prompt、model、params、knowledge、userInput 和 output。

### Prompt / Knowledge 管理页

占位：展示后端 CRUD 列表、筛选、启停、编辑弹窗和详情预览。

## 9. 当前边界

- 当前不是完整 RAG。
- Knowledge 是手动上下文，不是 embedding / 向量数据库 / 自动召回。
- 当前不支持文件上传、文档解析或检索结果排序。
- Prompt 不支持版本管理、diff、变量引擎或审核流。
- ModelConfig 当前只展示后端可信状态，不做多 provider 管理或 API Key 加密存储。
- API Key 不进入前端，只由后端 `.env` / 环境变量托管。
- TestRecord 双记录对比是历史记录复盘，不是多模型并发生成。
- 当前没有 auth / RBAC / 多租户 / Workspace。

## 10. 后续规划

### 近期可做

- UI 细节 polish。
- failed / stopped TestRecord 保存策略。
- 简单关键词检索增强。
- 项目截图和部署说明。

### 中期可做

- Prompt 版本管理。
- 简单变量填充。
- Knowledge 文件上传。
- embedding / RAG 方案设计。

### 长期可做

- auth / workspace。
- 多 provider。
- 多模型对比。
- 权限和审计。
