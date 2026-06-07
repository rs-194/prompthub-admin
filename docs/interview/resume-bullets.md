# PromptHub Admin 简历项目描述

## 简洁版

- 基于 Vue3 + TypeScript + Element Plus 实现 AI Prompt 调试与记录管理平台，覆盖 Prompt、Knowledge、ModelConfig、ChatTest 和 TestRecord 主链路。
- 接入 FastAPI 后端 PromptTemplate / KnowledgeDocument CRUD，支持列表 preview、详情按需加载和 ChatTest 运行前读取完整内容。
- 使用 fetch stream + ReadableStream 解析后端 NDJSON 流式响应，实现 LLM 输出逐段渲染、停止生成和错误状态处理。
- 设计 TestRecord 复盘链路，支持记录保存、列表 outputPreview、详情 Drawer 和基于历史记录的双记录对比。
- API Key 仅由后端 `.env` / 环境变量托管，前端不输入、不保存、不展示真实 key。

## 偏前端版

- 使用 Vue3 + TypeScript + Vite + Element Plus 构建后台页面，按 views / components / services / types 拆分 Prompt 调试相关模块。
- 在 ChatTest 中实现 fetch stream / ReadableStream / TextDecoder 流式消费逻辑，按 NDJSON 行解析并逐段渲染模型输出。
- 通过 Drawer、Dialog、Table、Form 等组件完成 Prompt / Knowledge CRUD、TestRecord 详情和双记录对比交互。
- 维护 loading、error、empty、streaming、result 等状态，并使用 AbortController 处理停止生成和组件卸载清理。
- 通过类型封装约束前后端字段，区分列表 preview 与详情完整内容，减少页面层请求和字段转换逻辑。

## 偏 AI 前端版

- 围绕 Prompt 调试场景设计主链路：PromptTemplate + 手动 Knowledge 上下文 + ModelConfig 状态进入 ChatTest，再沉淀为 TestRecord。
- 支持选择后端 Prompt 模板作为 systemPrompt，并手动选择后端 Knowledge 文档作为模型上下文。
- 接入后端代理真实 LLM API，前端通过 NDJSON 流式渲染输出，提升长文本生成时的实时反馈体验。
- 设计测试记录复盘能力，支持详情查看和双记录对比，用于分析不同 Prompt、参数和上下文下的输出差异。
- 明确 Knowledge 当前为手动上下文，不夸大为完整 RAG；后续可扩展 embedding、召回和检索结果追踪。

## 不建议写法

- 不写“企业级完整平台”。
- 不写“实现完整 RAG”。
- 不写“高并发”。
- 不写“多租户”。
- 不夸大后端能力。
