# PromptHub Admin 项目展示说明

## 项目定位

PromptHub Admin 是一个面向大模型应用开发的 AI Prompt 调试与记录管理平台。当前版本聚焦 ChatTest 调试链路：从 Prompt、参数和知识库上下文选择，到真实 LLM 流式输出，再到 TestRecord 持久化、详情复盘和双记录对比。

项目展示重点不是“完整企业平台”，而是前端实习 / AI 前端方向中更有辨识度的工程能力：

- Vue3 + TypeScript 的模块化页面开发。
- fetch stream / ReadableStream 流式响应消费。
- 前端状态、错误、停止生成和结果展示的完整交互处理。
- FastAPI 后端代理模型 API，避免 API Key 进入前端。
- TestRecord 从列表预览到详情复盘、双记录对比的业务闭环。

## 功能截图占位

> 后续补充真实截图时，建议使用本节位置，不需要改变 README 主结构。

### ChatTest 流式输出截图

占位：展示 Prompt / Model / Knowledge 选择、参数配置、运行中逐段输出和停止生成按钮。

### TestRecord 详情 Drawer 截图

占位：展示最近测试记录列表中只显示 outputPreview，点击详情后 Drawer 按需加载完整 output、输入、参数和知识库上下文。

### 双记录对比截图

占位：展示选择两条历史 TestRecord 后，并排对比模型、参数、知识库上下文、耗时、用户输入和完整输出。

## 面试讲解版项目故事

这个项目最初是一个 AI 应用后台练习项目，但我没有只停留在普通 CRUD 页面，而是围绕 Prompt 调试这个更贴近大模型应用开发的场景做了一条闭环。

普通 AI 对话工具只展示单次回答，但真实开发中需要反复调整 Prompt、模型参数和上下文，并且需要记录每次测试结果。因此项目把 ChatTest 作为核心链路：前端选择 Prompt、模型配置和知识库上下文，配置 temperature、maxTokens、outputFormat 等参数，然后通过 FastAPI 后端代理真实模型 API。后端读取 `.env` 中的模型配置，API Key 不进入前端。

在输出展示上，项目不是等待完整响应后一次性渲染，而是使用 fetch stream + ReadableStream 逐段消费后端返回的 NDJSON 数据，实现真实流式输出。前端同时处理 loading、error、result、AbortController 停止生成等状态。正常完成后，后端会保存 TestRecord，前端最近记录列表只展示 outputPreview，需要查看完整输出时再打开详情 Drawer 按需请求详情接口。

后续又在 TestRecord 之上做了双记录对比能力：用户选择两条历史记录后，前端分别拉取完整详情，并排展示输入、参数、知识库上下文和完整输出。这个对比是基于历史记录的复盘能力，不是多模型并发生成，也没有新增 compareGroup 后端表。

## 简历 bullet

### 当前版本

- 基于 Vue3 + TypeScript + Element Plus 实现 AI Prompt 调试台，支持 Prompt、模型参数与知识库上下文选择。
- 使用 fetch stream + ReadableStream 消费 FastAPI 返回的 NDJSON 流式响应，实现模型输出逐段渲染与 AbortController 停止生成。
- 设计并接入 TestRecord 持久化链路，支持列表 outputPreview、keyword 查询、分页展示和详情 Drawer 按需加载完整 output。
- 实现历史 TestRecord 双记录对比 Drawer，支持并排复盘两次调试的输入、参数、上下文、耗时和完整输出。
- 通过 FastAPI 后端代理真实 LLM API，将 API Key 托管在后端 `.env` / 环境变量中，避免进入前端。
- 按 service / types / components 拆分前端模块，并同步维护模块文档、路线图和开发日志。

### 后续增强版

- 在 Prompt 调试台与 TestRecord 复盘链路基础上，进一步接入 ModelConfig / Knowledge 后端化能力。
- 支持从后端读取模型配置与知识库上下文，形成 Prompt 调试、参数管理、上下文管理和测试记录复盘的一体化链路。
- 计划扩展轻量 Knowledge 持久化、RAG / embedding 检索、failed / stopped record 保存策略和真实认证权限能力。

## 当前边界

- Prompt / Model / Knowledge 当前仍未全部后端化，仍作为前端配置源参与 ChatTest。
- knowledgeContext 当前是手动上下文，不是真实 RAG。
- 当前不做 embedding、向量数据库、相似度召回或真实知识库检索。
- 双记录对比基于历史 TestRecord，不是多模型并发生成。
- 当前不新增 compareGroup 后端表。
- API Key 当前由后端环境变量托管，不做前端密文存储。
- 当前不包含真实 JWT / RBAC / Workspace / 多租户。

## 后续规划

1. 轻量 ModelConfig 展示。
2. Knowledge 后端化轻量版。
3. 记录详情 / 对比继续优化。
4. failed / stopped record 保存策略。
5. 真实 RAG / embedding。
6. auth / Workspace / 多租户。
