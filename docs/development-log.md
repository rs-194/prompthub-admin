# 开发记录（Development Log）

## 1. 开发记录说明
本文件用于持续记录项目开发过程中的关键变更，便于回溯与协作。

记录原则：
- 每次代码改动后追加一条记录。
- 记录应包含：变更内容、影响范围、验证方式。
- 不夸大完成度，未完成内容必须明确标注。

## 2. 开发记录模板
```md
### YYYY-MM-DD：本次变更标题

内容：
- 变更点 1
- 变更点 2

影响范围：
- 目录/模块 A
- 目录/模块 B

验证方式：
- npm run build 通过
- npm run dev 页面可正常访问
```

## 3. 当前开发记录

### 2026-04-27：项目骨架整理

内容：
- 整理后台项目目录结构
- 新增 AdminLayout
- 将布局组件整理到 src/layout
- 新增 config/menu.ts
- 重构基础路由
- 新增 dashboard、prompts、knowledge、models、chat-test、settings 页面骨架
- 新增 stores/app.ts 管理侧边栏折叠状态

影响范围：
- 前端目录结构
- 路由
- 布局
- 菜单配置
- 页面骨架

验证方式：
- npm run build 通过
- npm run dev 可正常启动

### 2026-04-27：基础布局修复

内容：
- 修复页面没有铺满浏览器的问题
- 修复右侧大面积黑色空白问题
- 调整后台左右布局
- 统一 Header、Aside、Content、Footer 区域
- 新增 page-card 通用页面壳样式
- 统一页面标题可读性

影响范围：
- 全局样式
- 后台布局组件
- 页面骨架样式

验证方式：
- npm run build 通过
- npm run dev 页面显示正常

### 2026-05-08：Dashboard 首页 mock 数据看板

内容：
- 新增 Dashboard 相关类型 `types/dashboard.ts`
- 新增 Dashboard 数据服务 `services/dashboard.ts`，当前为 mock 数据，后端待接入
- 新增 Dashboard 统计卡片组件 `StatCard.vue`
- 完善 Dashboard 首页，展示统计卡片和最近操作记录表格

影响范围：
- frontend/src/views/dashboard
- frontend/src/services
- frontend/src/types
- docs/roadmap.md

验证方式：
- npm run build
- 启动项目后访问 `/dashboard`，检查统计卡片和最近操作记录表格是否正常显示

### 2026-05-08：提示词管理列表展示与筛选

内容：
- 新增提示词管理类型 `frontend/src/types/prompt.ts`
- 新增提示词管理数据服务 `frontend/src/services/prompt.ts`，当前为 mock 数据，后端待接入
- 完善 `frontend/src/views/prompts/PromptListView.vue`，支持提示词列表展示、搜索和分类筛选

影响范围：
- frontend/src/views/prompts
- frontend/src/services
- frontend/src/types
- docs/roadmap.md
- README.md

验证方式：
- npm run build
- 启动项目后访问 `/prompts`，检查提示词列表、搜索、分类筛选和重置按钮是否正常可用

### 2026-05-08：提示词管理页面代码风格统一

内容：
- 统一 `frontend/src/views/prompts/PromptListView.vue` 中 Element Plus 组件为 kebab-case 写法
- 移除提示词管理页面中不必要的 Element Plus 组件手动 import
- 调整表格插槽参数写法，不在 template 插槽参数中添加 TypeScript 类型标注
- 本次不涉及功能变化，不涉及 UI 变化

影响范围：
- frontend/src/views/prompts/PromptListView.vue

验证方式：
- npm run build
- 启动项目后访问 `/prompts`，确认列表、搜索、分类筛选和重置仍正常可用

### 2026-05-10：提示词管理 mock CRUD

内容：
- 新增 `frontend/src/views/prompts/components/PromptFormDialog.vue`，用于提示词新增和编辑弹窗
- 扩展 `frontend/src/types/prompt.ts`，补充 `PromptFormData` 和 `PromptDialogMode`
- 扩展 `frontend/src/services/prompt.ts`，新增 create/update/delete mock CRUD 方法
- 完善 `frontend/src/views/prompts/PromptListView.vue`，支持新增、编辑、删除和删除确认
- 当前仍为前端 mock 数据，刷新页面后不保证持久化，后端待接入

影响范围：
- frontend/src/views/prompts
- frontend/src/services/prompt.ts
- frontend/src/types/prompt.ts
- docs/roadmap.md
- README.md
- notes/interview

验证方式：
- npm run build
- 启动项目后访问 `/prompts`，测试新增、编辑、删除，以及 CRUD 后搜索和分类筛选是否仍可用

### 2026-05-11：模型配置 mock 管理

内容：
- 新增 `frontend/src/types/model.ts`，定义模型供应商、模型配置项、表单数据和弹窗模式类型
- 新增 `frontend/src/services/model.ts`，封装模型配置 mock 列表、新增、编辑、删除和启用/停用方法
- 新增 `frontend/src/views/models/components/ModelConfigDialog.vue`，用于模型配置新增和编辑弹窗
- 完善 `frontend/src/views/models/ModelConfigView.vue`，支持模型配置列表、搜索、供应商筛选、新增/编辑/删除和启用/停用
- 当前为前端 mock 数据，刷新页面后不保证持久化，后端待接入，不真实调用模型 API，不保存 API Key

影响范围：
- frontend/src/views/models
- frontend/src/services/model.ts
- frontend/src/types/model.ts
- docs/roadmap.md
- README.md
- notes/interview

验证方式：
- npm run build
- 启动项目后访问 `/models`，测试新增、编辑、删除、启用/停用，以及 CRUD 后搜索和供应商筛选是否仍可用

### 2026-05-11：提示词管理与模型配置注释补充

内容：
- 为提示词管理模块和模型配置模块补充关键中文解释注释，覆盖 service mock、props / emit、watch、computed 和 CRUD 数据流
- 本次仅增强代码可读性，不涉及功能变化
- 本次不涉及 UI 变化
- 本次不涉及接口变化

影响范围：
- frontend/src/views/prompts
- frontend/src/views/models
- frontend/src/services/prompt.ts
- frontend/src/services/model.ts
- frontend/src/types/prompt.ts
- frontend/src/types/model.ts
- notes/interview

验证方式：
- npm run build 通过
- 人工验证路径：访问 `/prompts`，确认提示词列表、搜索、筛选、新增、编辑、删除仍正常
- 人工验证路径：访问 `/models`，确认模型配置列表、搜索、筛选、新增、编辑、删除、启用/停用仍正常

### 2026-05-12：提示词管理与模型配置函数级注释补充

内容：
- 为提示词管理模块和模型配置模块补充 JSDoc 风格函数级中文注释
- 注释覆盖 service mock、computed 派生数据、弹窗 props / emit / watch、表单提交和 CRUD 数据流
- 本次不涉及功能变化
- 本次不涉及 UI 变化
- 本次不涉及接口变化

影响范围：
- frontend/src/views/prompts
- frontend/src/views/models
- frontend/src/services/prompt.ts
- frontend/src/services/model.ts
- docs/development-log.md

验证方式：
- npm run build 通过
- 人工验证路径：访问 `/prompts`，确认提示词列表、搜索、筛选、新增、编辑、删除仍正常
- 人工验证路径：访问 `/models`，确认模型配置列表、搜索、筛选、新增、编辑、删除、启用/停用仍正常

### 2026-05-12：对话测试 / Prompt 调试台 v1 mock

内容：
- 新增 `frontend/src/types/chatTest.ts`，定义调试台提示词选项、模型选项、表单数据、测试结果和测试记录类型
- 新增 `frontend/src/services/chatTest.ts`，复用已有提示词与模型配置 mock service，封装选项加载、mock 测试、测试记录保存与查询
- 完善 `frontend/src/views/chat-test/ChatTestView.vue`，支持提示词选择、启用模型配置选择、提示词预览、测试输入、运行测试、清空与结果展示
- 新增 `TestResultPanel.vue` 和 `TestRecordTable.vue` 两个局部组件，分别承载结果展示与最近记录表格
- 新增 chat-test 模块设计文档与 interview notes，明确当前仍为 mock 阶段，不接后端、不真实调用模型 API、不处理真实 API Key

影响范围：
- frontend/src/views/chat-test
- frontend/src/services/chatTest.ts
- frontend/src/types/chatTest.ts
- docs/modules
- docs/roadmap.md
- README.md
- notes/interview

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：访问 `/chat-test`，确认提示词和模型选项加载、模型只显示 enabled 配置、提示词预览、运行测试 loading、mock 输出、记录新增与清空按钮均按预期工作

### 2026-05-13：知识库管理 v1 mock

内容：
- 新增 `frontend/src/types/knowledge.ts`，定义知识库分类、启用状态筛选、来源类型、mock 向量化状态、文档记录、表单数据和弹窗模式类型
- 新增 `frontend/src/services/knowledge.ts`，使用前端 mock 数组封装知识库分类、文档列表、创建、编辑、删除、启用 / 停用方法
- 完善 `frontend/src/views/knowledge/KnowledgeListView.vue`，支持文档列表、搜索、分类筛选、状态筛选、新增/编辑/删除、启用/停用、摘要与 mock 切片信息查看
- 新增 `KnowledgeFormDialog.vue` 和 `KnowledgePreviewDrawer.vue`，分别承载新增/编辑表单与摘要预览抽屉
- 新增知识库模块设计文档与 interview notes，明确当前仍为 mock 阶段，不接后端、不真实上传文件、不真实切片、不调用 embedding、不接向量数据库、不做真实 RAG

影响范围：
- frontend/src/views/knowledge
- frontend/src/services/knowledge.ts
- frontend/src/types/knowledge.ts
- docs/modules
- docs/development-log.md
- docs/roadmap.md
- docs/frontend-architecture.md
- README.md
- notes/interview

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：访问 `/knowledge`，确认文档列表、搜索、分类筛选、状态筛选、重置、新增、编辑、删除确认、启用/停用、摘要与 mock 切片信息查看均按预期工作

### 2026-05-19：对话测试 / Prompt 调试台 v2 知识库上下文 mock 联动

内容：
- 扩展 `frontend/src/types/chatTest.ts`，新增知识库 mock context 选项类型，并在测试表单、测试结果和测试记录中记录知识库标题、数量与 contextPreview
- 扩展 `frontend/src/services/chatTest.ts`，通过已有 knowledge service 读取启用中的知识库文档，转换为 ChatTest 可用选项，不重复维护知识库 mock 数据
- 完善 `frontend/src/views/chat-test/ChatTestView.vue`，支持选择一个或多个启用中的知识库文档，并使用 computed 推导 selectedKnowledgeDocs
- 新增 `KnowledgeContextPanel.vue`，展示已选知识库文档摘要、tags、mock 切片数和 mock 向量状态，并提示当前为 mock context
- 更新 `TestResultPanel.vue` 和 `TestRecordTable.vue`，展示本次测试使用的知识库标题、数量和 contextPreview
- 新增 chat-test v2 模块设计文档，并同步 roadmap、模块文档索引、README 与 chat-test interview notes
- 当前仍为 mock 阶段，不接后端，不真实调用模型 API，不做真实 RAG、embedding、向量库、相似度计算或召回排序

影响范围：
- frontend/src/views/chat-test
- frontend/src/services/chatTest.ts
- frontend/src/types/chatTest.ts
- docs/modules/chat-test/v2-knowledge-context-mock.md
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：访问 `/chat-test`，确认知识库选项只显示启用中文档、可多选、摘要预览正常、不选知识库也可运行基础 Prompt 测试、选择知识库后 mock 输出和最近测试记录体现知识库使用情况、清空结果不清空知识库选择

### 2026-05-22：认证与路由访问控制 v1 mock

内容：
- 新增 `frontend/src/types/auth.ts`，定义 mock 登录用户、登录表单和登录响应类型
- 新增 `frontend/src/services/auth.ts`，封装 `mockLogin` 和 `mockLogout`，当前只校验内置 mock 账号 `admin / 123456`
- 新增 `frontend/src/stores/auth.ts`，使用 Pinia 管理 token、user 和 initialized，并通过 localStorage 恢复 mock 登录态
- 新增 `frontend/src/views/login/LoginView.vue`，提供 mock 登录页、错误提示、loading 和 redirect 跳转
- 扩展 `frontend/src/router/index.ts`，新增 `/login` 路由，并为后台页面增加 `meta.requiresAuth` 与 beforeEach 守卫
- 扩展 `frontend/src/layout/components/AppHeader.vue`，展示当前用户昵称或用户名，并支持退出登录
- 在 `frontend/src/main.ts` 安装 Pinia
- 新增认证模块设计文档与 interview notes，明确当前为 mock 登录，后端待接入，不做真实 JWT / RBAC / 菜单权限 / 按钮权限

影响范围：
- frontend/src/views/login
- frontend/src/services/auth.ts
- frontend/src/types/auth.ts
- frontend/src/stores/auth.ts
- frontend/src/router/index.ts
- frontend/src/layout/components/AppHeader.vue
- frontend/src/main.ts
- docs/modules
- docs/development-log.md
- docs/roadmap.md
- docs/frontend-architecture.md
- README.md
- notes/interview

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：访问 `/login`，使用错误账号确认错误提示，使用 `admin / 123456` 确认登录成功
- 人工验证路径：未登录访问 `/dashboard`、`/prompts`、`/models`、`/knowledge`、`/chat-test`、`/settings`，确认跳转 `/login` 且保留 redirect
- 人工验证路径：登录后刷新页面确认恢复登录态，访问 `/login` 确认跳转 `/dashboard`，点击 Header 退出登录确认清理状态并跳转 `/login`

### 2026-05-23：对话测试 / Prompt 调试台 v3 测试参数区 + mock 流式输出

内容：
- 扩展 `frontend/src/types/chatTest.ts`，新增 `ChatTestOutputFormat`、`ChatTestParams`，并在表单、结果和测试记录中保存参数与参数摘要
- 扩展 `frontend/src/services/chatTest.ts`，新增 `buildParamsSummary()` 和 `createMockStreamChunks()`，让 `runMockPromptTest()` 接收参数并生成完整 mock 输出
- 新增 `frontend/src/views/chat-test/components/TestParameterPanel.vue`，展示 temperature、maxTokens、outputFormat，并通过 `v-model` 回传参数
- 完善 `frontend/src/views/chat-test/ChatTestView.vue`，使用前端 timer 模拟 mock streaming，支持运行中停止生成、清空结果和组件卸载时清理 timer
- 更新 `TestResultPanel.vue`，支持展示生成中 streamingText、停止后的草稿和最终结果参数摘要
- 更新 `TestRecordTable.vue`，新增短参数摘要列，避免记录表过宽
- 新增 chat-test v3 模块设计文档，并同步 roadmap、模块文档索引、README 与 chat-test interview notes
- 当前仍为 mock 阶段，不接后端，不真实调用模型 API，不做真实 SSE，不做真实 temperature 采样、maxTokens 截断或模型格式约束

影响范围：
- frontend/src/views/chat-test
- frontend/src/services/chatTest.ts
- frontend/src/types/chatTest.ts
- docs/modules/chat-test/v3-params-and-mock-streaming.md
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：访问 `/chat-test`，确认参数区正常显示，可修改 temperature、maxTokens、outputFormat；不选知识库和选择知识库均可运行；点击运行后结果区分段追加文本；运行中按钮禁用且可停止生成；停止生成不保存成功记录；完成后保存测试记录并展示参数摘要；清空结果不清空 prompt / model / knowledge / params

### 2026-05-23：FastAPI 后端项目骨架 Phase 2.1

内容：
- 新增 `backend/` 后端目录，建立 FastAPI 最小应用入口
- 新增基础配置，包含 app name、`/api/v1` 前缀、SQLite database url 和 CORS origins
- 新增 SQLAlchemy engine、SessionLocal、Base 和 get_db 基础连接配置，当前不创建业务表
- 新增 `GET /api/v1/health` 健康检查接口
- 新增后端 README 和后端骨架模块文档
- 当前仅为后端骨架，不实现 TestRecord CRUD、不实现 ChatTest stream、不接前端、不做真实 LLM / RAG / auth

影响范围：
- backend
- docs/modules/backend
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- docs/frontend-architecture.md
- README.md

验证方式：
- `cd backend && python -m pip install -r requirements.txt`
- `cd backend && python -m compileall app`
- `cd backend && python -m uvicorn app.main:app --reload`
- 访问 `http://localhost:8000/api/v1/health`，确认返回 `status: ok`

### 2026-05-24：FastAPI 后端 TestRecord 持久化 Phase 2.2

内容：
- 新增 `backend/app/modules/test_records/`，包含 TestRecord ORM model、Pydantic schemas 和 service
- 新增 `backend/app/api/v1/test_records.py`，提供测试记录创建、分页列表、详情和删除接口
- 在 `/api/v1` 路由入口挂载 `/test-records`，并保留 health check
- 启动时通过 `Base.metadata.create_all(bind=engine)` 创建 `test_records` 表
- 列表接口只返回 `outputPreview`，详情接口返回完整 `output`
- 当前仍不接前端，不实现 ChatTest stream，不调用真实 LLM，不做真实 RAG，不做 auth / JWT / RBAC，不迁移 Prompt / Model / Knowledge 后端表

影响范围：
- backend/app/modules/test_records
- backend/app/api/v1
- backend/app/main.py
- docs/modules/backend
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- backend/README.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd backend && python -m compileall app`
- `cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- 验证 `GET /api/v1/health`
- 验证 `POST /api/v1/test-records` 创建记录，并确认 `knowledgeCount` 由后端校准
- 验证 `GET /api/v1/test-records` 列表不包含完整 `output`
- 验证 `GET /api/v1/test-records/{id}` 详情包含完整 `output`
- 验证 `DELETE /api/v1/test-records/{id}` 删除记录，删除后详情返回 404

### 2026-05-25：TestRecord 持久化设计文档补强

内容：
- 补强 Phase 2.2 TestRecord 持久化文档，说明快照存储、列表不返回完整 output、snake_case / camelCase 边界、knowledgeTitles JSON 字符串存储、分层职责、前端后续替换策略和开发期建表边界的设计原因
- 补充 Phase 2.1 后端骨架设计原则，明确最小骨架、统一 db/session.py、api/v1 挂载入口和按模块逐步接入
- 修正 frontend architecture 中后端 TestRecord 状态描述，明确后端已实现 TestRecord CRUD，但前端 ChatTest service 尚未替换，页面链路仍使用前端 mock records
- 本次为 docs-only 更新，未修改代码

影响范围：
- docs/modules/backend/v2-test-records.md
- docs/modules/backend/v1-backend-skeleton.md
- docs/frontend-architecture.md
- docs/development-log.md

验证方式：
- 文档内容检查
- 未执行 `npm run build`，本次未修改代码

### 2026-05-25：Phase 2.3 真实 LLM 非流式调用最小闭环

内容：
- 新增 `backend/app/modules/llm_provider/`，使用 `httpx` 调 OpenAI-compatible `/chat/completions`，并处理配置缺失、超时、非 2xx 和响应结构异常
- 新增 `backend/app/modules/chat_test/`，负责 ChatTest 请求校验、messages 拼装、temperature / maxTokens 边界保护、knowledgeContext 截断、durationMs 计算和 TestRecord 保存
- 新增 `POST /api/v1/chat-test/run`，成功后返回 `output`、`record`、`durationMs`
- 扩展后端配置，支持从环境变量读取 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`、`LLM_TEMPERATURE`、`LLM_MAX_TOKENS`、`LLM_TIMEOUT_SECONDS`
- 新增 `httpx` 依赖，不使用 OpenAI SDK
- API Key 只从后端环境变量读取，不进入前端、不进入响应、不写入日志
- 当前不接前端，不做 StreamingResponse / SSE / fetch stream，不做真实 RAG，不做 ModelConfig 后端化
- 同步 backend README、根 README、roadmap、模块文档索引、Phase 2.3 设计文档和 chat-test notes

影响范围：
- backend/app/core/config.py
- backend/app/modules/llm_provider
- backend/app/modules/chat_test
- backend/app/api/v1/chat_test.py
- backend/app/api/v1/router.py
- backend/requirements.txt
- backend/README.md
- docs/modules/backend/v3-llm-chat-test-run.md
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd backend && python -m compileall app`
- 使用 FastAPI TestClient 验证 `GET /api/v1/health` 返回 200
- 使用 FastAPI TestClient 验证缺少 LLM 环境变量时，`POST /api/v1/chat-test/run` 返回 503，错误信息为 `LLM service is not configured completely`
- 当前未配置真实 `LLM_API_KEY`，未执行真实外部 LLM 调用验证

### 2026-05-25：idea 记录补充

内容：
- 更新 `idea/2.md`，记录最近 Codex 触发频繁思考导致速率极慢的问题
- 本次仅为记录类文档变更，不涉及代码、路由、样式或业务逻辑

影响范围：
- idea/2.md
- docs/development-log.md

验证方式：
- 文档内容检查
- 未执行 `npm run build`，本次未修改代码

### 2026-05-30：Phase 2.4 ChatTest 前端接入真实 run 接口

内容：
- 扩展 `frontend/src/types/chatTest.ts`，补充 `ChatTestRunRequest`、`KnowledgeContextPayload`、`ChatTestRunResponse` 和 `TestRecordDetail` 类型
- 扩展 `frontend/src/services/chatTest.ts`，新增 `runPromptTestApi()`，通过相对路径 `POST /api/v1/chat-test/run` 调用后端真实 LLM 非流式接口，并统一处理响应结构和错误提示
- 完善 `frontend/src/views/chat-test/ChatTestView.vue`，点击运行测试时组装 prompt、modelName、knowledgeContext 和 params，展示后端真实 output，并使用后端返回的 record 更新最近测试记录
- 调整 ChatTest 结果区、参数区和记录表展示，明确当前为真实非流式调用，非流式阶段暂不支持停止生成
- 新增 Phase 2.4 模块文档，并同步 README、roadmap、模块索引和 chat-test interview notes
- 当前仍不做 stream / SSE / fetch stream，不做真实 RAG，不做 Prompt / Model / Knowledge 后端化，不在前端保存或展示 API Key

影响范围：
- frontend/src/views/chat-test
- frontend/src/services/chatTest.ts
- frontend/src/types/chatTest.ts
- docs/modules/chat-test/phase-2-4-real-run-api.md
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：启动后端并配置 LLM 环境变量后访问 `/chat-test`，输入测试内容并点击运行，确认页面展示真实 output，最近测试记录出现后端返回的新 record
- 异常验证路径：后端未配置 `LLM_API_KEY` 时，确认前端出现清晰错误提示

### 2026-05-30：Phase 2.5 ChatTest 真实流式输出

内容：
- 新增 `POST /api/v1/chat-test/stream`，后端使用 FastAPI `StreamingResponse` 返回 `application/x-ndjson`
- 扩展 `llm_provider`，支持 OpenAI-compatible `stream: true` 调用，解析上游 `data: {...}` 和 `data: [DONE]`
- 扩展 ChatTest 后端 service，流式过程中累积完整 output，正常完成后保存 `success` TestRecord，并通过 `done` 行返回 record 和 durationMs
- 扩展前端 ChatTest service，新增 `runPromptTestStreamApi()`，通过 fetch + ReadableStream + TextDecoder 按行解析 NDJSON
- 完善 ChatTest 页面，默认使用真实 fetch stream，支持逐段展示 output、AbortController 停止生成和组件卸载清理
- 更新结果面板文案，明确当前为真实流式输出，不再展示 mock streaming
- 新增 Phase 2.5 模块文档，并同步 README、backend README、roadmap、模块索引和 chat-test interview notes
- 当前不是原生 EventSource SSE，不做真实 RAG，不做 ModelConfig / Prompt / Knowledge 后端化；用户主动停止时 v1 不保存 stopped 记录

影响范围：
- backend/app/modules/llm_provider/service.py
- backend/app/modules/chat_test
- backend/app/api/v1/chat_test.py
- frontend/src/services/chatTest.ts
- frontend/src/types/chatTest.ts
- frontend/src/views/chat-test
- docs/modules/chat-test/phase-2-5-stream.md
- docs/modules/README.md
- docs/roadmap.md
- README.md
- backend/README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd backend && python -m compileall app` 通过
- `cd frontend && npm run build` 通过
- 当前未配置真实 `LLM_API_KEY`，未验证真实外部 LLM 流式 output

### 2026-05-31：Phase 2.5.1 前端 API baseURL 与请求封装修复

内容：
- 为 `frontend/vite.config.ts` 增加开发期 `/api -> http://127.0.0.1:8000` proxy，修复前端 dev server 下 `/api/v1/...` 无法自动转发到后端的问题
- 新增 `frontend/src/services/request.ts`，封装普通 JSON API 的 baseURL 拼接、请求体序列化、响应解析和基础错误对象，并支持 `VITE_API_BASE_URL`
- 调整 `frontend/src/services/chatTest.ts`：非流式 run 接口走普通 request 封装；stream 接口继续使用 fetch + ReadableStream，只复用统一 URL 拼接
- 本次不修改后端代码，不新增依赖，不在前端写 `LLM_API_KEY` 或真实模型服务 baseURL，不改变业务功能

影响范围：
- frontend/vite.config.ts
- frontend/src/services/request.ts
- frontend/src/services/chatTest.ts
- docs/modules/chat-test/phase-2-5-stream.md
- README.md

验证方式：
- `cd frontend && npm run build`
- 本地联调时先启动后端 `cd backend && python -m uvicorn app.main:app --reload`，再启动前端 `cd frontend && npm run dev`，访问 `/chat-test` 验证 `/api/v1/...` 请求由 Vite proxy 转发

### 2026-05-31：Phase 2.5.2 后端 .env 加载与本地生成物忽略整理

内容：
- 在 `backend/app/core/config.py` 中通过 `python-dotenv` 启动时加载 `backend/.env`，继续保留 `os.getenv` 读取 LLM 配置
- 新增 `backend/.env.example`，提供 LLM 本地环境变量示例，不包含真实 API Key
- 更新 `backend/requirements.txt`，新增 `python-dotenv`
- 整理 `.gitignore`，明确忽略 Python 缓存、`backend/prompthub.db`、真实 `.env`、`backend/.env`、IDE 配置
- 更新 README 与 backend README，说明真实 API Key 写入 `backend/.env`，`backend/.env` 不提交，`.env.example` 可提交，修改 `.env` 后需要重启 uvicorn
- 本次不修改前端业务代码，不修改 ChatTest 业务逻辑，不写入真实 API Key

影响范围：
- backend/app/core/config.py
- backend/requirements.txt
- backend/.env.example
- .gitignore
- README.md
- backend/README.md
- docs/development-log.md

验证方式：
- `cd backend && python -m compileall app`
- `cd backend && python -c "from app.core.config import settings; print(bool(settings.llm_api_key))"`
- 不要求真实调用外部 LLM

### 2026-06-01：Phase 2.6 TestRecord 详情 Drawer

内容：
- 新增 `frontend/src/views/chat-test/components/TestRecordDetailDrawer.vue`，使用 Element Plus Drawer / Descriptions / Card 展示 TestRecord 完整详情
- 扩展 `frontend/src/services/chatTest.ts`，新增 `getTestRecordDetail(id)`，通过普通 JSON request 封装调用 `GET /api/v1/test-records/{id}`，并处理 404、网络异常和响应结构异常
- 更新 `ChatTestView.vue`，由父组件管理详情 Drawer 的 visible、loading、error、empty 和 detail 状态
- 更新 `TestRecordTable.vue`，增加“详情”操作列，只 emit record id，不在表格组件内请求详情
- 列表仍只展示 `outputPreview`，完整 `output` 仅在打开详情 Drawer 时按需加载
- 新增 Phase 2.6 模块文档，并同步 README、roadmap、模块索引和 chat-test interview notes
- 本阶段不修改后端业务逻辑，不做多记录对比，不做多模型并发，不做真实 RAG / ModelConfig / auth / 多租户

影响范围：
- frontend/src/services/chatTest.ts
- frontend/components.d.ts
- frontend/src/views/chat-test/ChatTestView.vue
- frontend/src/views/chat-test/components/TestRecordTable.vue
- frontend/src/views/chat-test/components/TestRecordDetailDrawer.vue
- docs/modules/chat-test/phase-2-6-record-detail-drawer.md
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：启动后端和前端，访问 `/chat-test`，确保已有测试记录或先运行一次生成记录，点击最近测试记录的“详情”，确认 Drawer 展示完整 output、userInput、params、knowledgeTitles、durationMs 和 createdAt
- 异常验证路径：请求不存在的 record id 时，Drawer 内展示“测试记录不存在或已被删除”

### 2026-06-01：Phase 2.7 TestRecord 双记录对比

内容：
- 更新 `TestRecordTable.vue`，在最近测试记录表格中增加 selection 列，最多选择 2 条记录，并新增“对比选中记录”入口
- 新增 `TestRecordCompareDrawer.vue`，并排展示两条历史 TestRecord 的模型、参数、知识库上下文、耗时、用户输入和完整 output
- 更新 `ChatTestView.vue`，由父组件管理 compare Drawer 的 visible、loading、error、empty 和 records 状态，并分别调用 `GET /api/v1/test-records/{id}` 获取两条完整记录
- 新增 Phase 2.7 模块文档，并同步 README、roadmap、模块索引和 chat-test interview notes
- 本阶段不修改后端代码，不新增 compareGroup 表，不做多模型并发生成，不做多路 stream，不做真实 RAG / ModelConfig / auth / 多租户

影响范围：
- frontend/src/views/chat-test
- docs/modules/chat-test/phase-2-7-record-compare.md
- docs/modules/README.md
- docs/development-log.md
- docs/roadmap.md
- README.md
- notes/interview/chat-test-notes.md
- notes/interview/chat-test-qa.md

验证方式：
- `cd frontend && npm run build`
- 人工验证路径：启动后端和前端，访问 `/chat-test`，确保已有至少 2 条 TestRecord，在最近测试记录中选择 2 条并点击“对比选中记录”，确认 Compare Drawer 展示完整 output、userInput、params、knowledgeTitles、durationMs 和 createdAt
- 交互验证路径：只选 0 或 1 条时对比按钮禁用；尝试选择第 3 条时被限制；关闭 Compare Drawer 后仍可继续 stream 测试；单条详情 Drawer 仍可正常使用
