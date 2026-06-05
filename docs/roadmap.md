# 路线图（Roadmap）

## v0.1 项目骨架整理与基础布局修复
- 目标：完成后台基础结构可用状态。
- 计划内容：目录整理、基础路由、菜单配置、页面骨架、布局修复。
- 当前状态：已完成。

## v0.2 Dashboard 首页数据看板
- 目标：为首页提供可扩展的数据看板框架。
- 计划内容：统计卡片、趋势区域、关键指标展示（可先使用 mock）。
- 当前状态：进行中（已完成 Dashboard 首页 mock 数据看板，后端待接入，趋势区域待实现）。

## v0.3 提示词管理
- 目标：支持提示词列表与基础 CRUD。
- 计划内容：列表页、筛选、创建/编辑/删除、详情展示。
- 当前状态：进行中（已完成列表展示、搜索、分类筛选和新增/编辑/删除 mock CRUD；当前为 mock 数据，刷新页面后不保证持久化，后端待接入；详情展示与真实后端接口仍待实现）。

## v0.4 模型配置
- 目标：支持模型接入参数配置与展示。
- 计划内容：模型列表、配置表单、状态展示。
- 当前状态：进行中（已完成模型配置 mock 管理，支持列表、搜索、供应商筛选、新增/编辑/删除与启用/停用；当前为 mock 数据，后端待接入，不真实调用模型 API）。

## v0.5 对话测试
- 目标：提供后台内的模型对话测试能力。
- 计划内容：测试输入区、历史记录、基础参数控制。
- 当前状态：进行中（已完成对话测试 / Prompt 调试台 v3 mock 基础能力；Phase 2.4 已将前端运行测试默认路径接入 `POST /api/v1/chat-test/run`；Phase 2.5 已新增 `POST /api/v1/chat-test/stream` 并将前端默认运行路径切换为 fetch stream + NDJSON 真实流式输出，支持逐段展示和 AbortController 停止生成；Phase 2.6 已完成 TestRecord 详情 Drawer，列表只展示 `outputPreview`，完整 output 通过 `GET /api/v1/test-records/{id}` 按需加载；Phase 2.7 已完成基于历史 TestRecord 的双记录前端对比，可选择 2 条记录并排查看模型、参数、知识库上下文、耗时、用户输入和完整 output；Prompt / Model / Knowledge 仍是前端配置源；当前不是原生 EventSource SSE，不做多模型并发生成，不做多路 stream，不做真实 RAG，用户主动停止时 v1 不保存 stopped 记录）。

## v0.6 知识库管理
- 目标：提供知识条目管理与检索基础能力。
- 计划内容：知识列表、基础增删改、后续检索能力对接。
- 当前状态：进行中（已完成知识库管理 v1 mock，支持文档元数据列表、搜索、分类筛选、状态筛选、新增/编辑/删除、启用/停用、摘要与 mock 切片信息查看；当前为 mock 数据，后端待接入，不真实上传文件，不真实切片，不调用 embedding，不接向量数据库，不做真实 RAG 检索；后续检索能力仍待对接）。

## v0.7 FastAPI 后端接入
- 目标：完成前后端基础联调。
- 计划内容：接口规范、后端项目骨架、TestRecord 持久化、ChatTest mock stream、后续鉴权基础与关键模块 API 对接。
- 当前状态：进行中（Phase 2.1 FastAPI 后端最小骨架已完成；Phase 2.2 已新增 TestRecord 持久化 CRUD 接口，支持创建、分页列表、详情、删除和 keyword 轻量查询；Phase 2.3 已新增 `POST /api/v1/chat-test/run`，支持真实 LLM 非流式调用并保存 TestRecord；Phase 2.4 已完成前端 ChatTest 接入该 run 接口；Phase 2.5 已新增真实 fetch stream + StreamingResponse + NDJSON 输出接口并完成前端流式消费；Phase 2.7 的双记录对比复用 `GET /api/v1/test-records/{id}`，不新增后端 compareGroup 表；当前尚未实现真实 RAG、真实认证 / JWT / RBAC，也未迁移 Prompt / Model / Knowledge 后端表）。

## Phase 2 后续顺序
- Phase 2.4：前端 ChatTest 接入 `/api/v1/chat-test/run`，展示真实 output，并使用后端返回的 record 更新最近测试记录。（已完成）
- Phase 2.5：真实 fetch stream + StreamingResponse + NDJSON 输出。（已完成；不是原生 EventSource SSE）
- Phase 2.6：测试记录详情 Drawer。（已完成）
- Phase 2.7：双记录对比。（已完成；基于历史 TestRecord，不是多模型并发生成）
- Phase 2.8：README 展示化与项目包装整理。（已完成；文档展示整理，不修改业务代码）
- Phase 2.8：轻量 ModelConfig 展示。（已完成；读取后端可信 LLM 配置状态，不返回 API Key，不做 CRUD）
- 后续建议顺序：Knowledge 后端化轻量版、记录详情 / 对比继续优化、failed / stopped record 保存策略、真实 RAG / embedding、auth / Workspace / 多租户。

## v0.8 登录与权限控制
- 目标：完善后台访问控制能力。
- 计划内容：登录页、Token 管理、路由权限、菜单权限。
- 当前状态：进行中（已完成认证与路由访问控制 v1 mock，支持 mock 登录、Pinia auth store、localStorage mock 登录态恢复、后台路由守卫、Header 用户展示与退出登录；当前不接后端、不做真实 JWT 校验、不做 RBAC、不做菜单权限或按钮权限）。

## v0.9 README、截图、部署文档完善
- 目标：完善项目展示与交付文档。
- 计划内容：README 强化、页面截图、部署与运行说明。
- 当前状态：进行中（Phase 2.8 已完成 README 展示化与项目包装整理，新增 `docs/project-showcase.md` 用于项目投递、面试讲解和简历描述准备；真实截图、部署文档仍待补充）。

## Phase 2.8 轻量 ModelConfig 展示补充

- 当前状态：已完成轻量 ModelConfig 展示。
- 后端新增 `GET /api/v1/model-config`，读取 settings / 环境变量中的可信 LLM 配置状态。
- 前端模型配置页面展示 provider、model、baseUrlHost、enabled、apiKeyConfigured、temperature、maxTokens 和 timeoutSeconds。
- API Key 不返回明文，只展示“已配置 / 未配置”。
- 前端 mock 模型列表仍仅用于展示，不直接决定真实 `LLM_MODEL`。
- 当前仍不支持 API Key 输入、加密存储、多用户模型配置、ModelConfig CRUD、多 provider 管理、真实 RAG、auth / RBAC 或 Workspace。
