# 路线图（Roadmap）

## v0.1 项目骨架整理与基础布局修复

- 目标：完成后台基础结构可用状态。
- 当前状态：已完成。

## v0.2 Dashboard 首页数据看板

- 目标：为首页提供可扩展的数据看板框架。
- 当前状态：进行中（已完成 Dashboard 首页 mock 数据看板，后端待接入，趋势区域待实现）。

## v0.3 提示词管理

- 目标：支持提示词列表与基础 CRUD。
- 当前状态：进行中（Phase 2.11 已完成 Prompt 后端化轻量版，支持 SQLite 持久化、分页、keyword、category、enabled 筛选、创建/编辑/删除、启用/停用和详情按需加载；不做版本管理、变量引擎、审核流或 marketplace）。

## v0.4 模型配置

- 目标：支持模型接入参数配置与展示。
- 当前状态：进行中（已完成模型配置 mock 管理和 Phase 2.8 轻量 ModelConfig 后端可信状态展示；当前只展示后端环境配置脱敏状态，不做 API Key 输入、加密存储、ModelConfig CRUD 或多 provider 管理）。

## v0.5 对话测试

- 目标：提供后台内的模型对话测试能力。
- 当前状态：进行中（已完成真实 run、fetch stream + NDJSON、TestRecord 详情 Drawer、历史双记录对比、手动 Knowledge 上下文和后端 PromptTemplate 接入；当前不是原生 EventSource SSE，不做多模型并发生成、不做真实 RAG，用户主动停止时 v1 不保存 stopped 记录）。

## v0.6 知识库管理

- 目标：提供知识条目管理与检索基础能力。
- 当前状态：进行中（Phase 2.9 已完成 Knowledge 后端化轻量版，支持 SQLite 持久化、分页、keyword、enabled 筛选、创建/编辑/删除、启用/停用和详情正文按需加载；ChatTest 可手动选择启用中的后端文档作为上下文；当前不上传文件、不自动解析、不调用 embedding、不接向量数据库、不做真实 RAG 检索）。

## v0.7 FastAPI 后端接入

- 目标：完成前后端基础联调。
- 当前状态：进行中（已完成 FastAPI 骨架、TestRecord CRUD、ChatTest run / stream、ModelConfig 状态展示、KnowledgeDocument CRUD、PromptTemplate CRUD；当前尚未实现真实 RAG、真实认证 / JWT / RBAC，Model 仍未完成完整后端 CRUD）。

## v0.8 登录与权限控制

- 目标：完善后台访问控制能力。
- 当前状态：进行中（已完成认证与路由访问控制 v1 mock；当前不接后端、不做真实 JWT 校验、不做 RBAC、不做菜单权限或按钮权限）。

## v0.9 README、截图、部署文档完善

- 目标：完善项目展示与交付文档。
- 当前状态：进行中（Phase 2.12 已完成项目收束与投递包装，新增面试讲解稿、简历 bullet 和项目 QA；真实截图、部署文档仍待补充）。

## Phase 2 已完成阶段

- Phase 2.4：前端 ChatTest 接入 `/api/v1/chat-test/run`。（已完成）
- Phase 2.5：真实 fetch stream + StreamingResponse + NDJSON 输出。（已完成；不是原生 EventSource SSE）
- Phase 2.6：测试记录详情 Drawer。（已完成）
- Phase 2.7：双记录对比。（已完成；基于历史 TestRecord，不是多模型并发生成）
- Phase 2.8：README 展示化与项目包装整理。（已完成；文档展示整理，不修改业务代码）
- Phase 2.8：轻量 ModelConfig 展示。（已完成；读取后端可信 LLM 配置状态，不返回 API Key，不做 CRUD）
- Phase 2.9：Knowledge 后端化轻量版。（已完成；后端 CRUD + ChatTest 手动选择上下文，不是 RAG）
- Phase 2.10：收束清理与稳定性补丁。（已完成；不修改 stream / TestRecord 契约）
- Phase 2.11：Prompt 后端化轻量版。（已完成；后端 CRUD + Prompt 页面接入 + ChatTest 使用后端 Prompt 详情完整 content）
- Phase 2.12：项目收束与投递包装。（已完成；只整理文档、简历描述和面试讲解，不修改业务代码）

## 后续规划

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
