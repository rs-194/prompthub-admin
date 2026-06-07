# Phase 2.11：Prompt 后端化轻量版

## 0. 文档状态

- 阶段：backend lite
- 状态：已实现
- 适用范围：PromptTemplate CRUD、后端持久化、ChatTest 后端 Prompt 模板选择

## 1. 阶段目标

Phase 2.11 将 Prompt 管理从前端内存 mock 数据迁移到 FastAPI + SQLite 持久化数据源，并让 ChatTest 从后端启用中的 Prompt 模板选择 Prompt。

ChatTest 运行时会按需请求 Prompt 详情，使用详情接口返回的完整 `content` 作为 `systemPrompt`。列表接口只返回 `contentPreview`，不返回超长完整内容。

## 2. 后端数据与接口

`prompt_templates` 表保存：

- `title`
- `content`
- `description`
- `category`
- `tags`：内部为 JSON 字符串，对外为 `string[]`
- `scenario`
- `enabled`
- `created_at`
- `updated_at`

接口：

```text
GET    /api/v1/prompt-templates
GET    /api/v1/prompt-templates/{id}
POST   /api/v1/prompt-templates
PUT    /api/v1/prompt-templates/{id}
DELETE /api/v1/prompt-templates/{id}
```

列表支持 `page`、`pageSize`、`keyword`、`category` 和 `enabled`。`pageSize` 最大为 100。

keyword 使用轻量 SQL `LIKE` 查询，可匹配 `title`、`description`、`category`、`scenario` 和完整 `content`，但列表响应只返回 `contentPreview`。

## 3. Prompt 页面

Prompt 管理页面已改为后端数据源，支持：

- 服务端分页
- keyword 搜索
- category 筛选
- enabled 筛选
- 创建、编辑、删除
- 启用、停用
- 编辑和启停前按需加载完整详情
- loading 与 error 状态

表单字段包括 `title`、`content`、`description`、`category`、`tags`、`scenario` 和 `enabled`。

## 4. ChatTest 接入

ChatTest 初始化时请求 `enabled=true` 的 Prompt 列表。

用户选择 Prompt 后，前端按需请求详情并缓存。运行 stream 前会确保已选 Prompt 详情已加载完成，再构造：

```text
promptTitle = Prompt 详情 title
systemPrompt = Prompt 详情完整 content
```

Prompt 加载失败不会阻塞 Knowledge 初始化。没有启用中的 Prompt 或详情加载失败时，运行前会给出明确提示。

本阶段没有修改 ChatTest stream 协议、TestRecord 表结构、详情 Drawer、双记录对比、Knowledge 手动上下文语义或 ModelConfig 只读展示语义。

## 5. 非目标

- 不做 Prompt 版本管理
- 不做 Prompt diff
- 不做 Prompt 变量解析引擎
- 不做 Prompt marketplace
- 不做 Prompt 审核流
- 不做多租户、Workspace、auth、JWT 或 RBAC
- 不做 RAG、embedding、向量数据库或文件上传
- 不新增依赖
- 不引入 Alembic

## 6. 验证

- `cd backend && python -m compileall app`
- FastAPI TestClient：create、list、keyword、category、enabled、detail、update、404、delete
- 确认列表项没有 `content`，详情有完整 `content`
- `cd frontend && npm run build`
- `git diff --check`
- 人工路径：访问 `/prompts` 完成 CRUD；访问 `/chat-test` 选择启用 Prompt 并运行

没有真实 LLM API Key 时，只验证 Prompt CRUD 与 ChatTest payload 构造，不宣称真实模型调用成功。

## 7. 后续入口

后续如果要做版本、变量、审核或 marketplace，需要单独设计数据模型、兼容策略和 UI 流程，不应直接叠加到本阶段轻量 CRUD 中。
