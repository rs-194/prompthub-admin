# Phase 2.9：Knowledge 后端化轻量版

## 0. 文档状态

- 阶段：backend lite
- 状态：已实现
- 适用范围：Knowledge 文档 CRUD、后端持久化、ChatTest 手动上下文选择

## 1. 阶段目标

Phase 2.9 将 Knowledge 文档从前端内存 mock 数据迁移到 FastAPI + SQLite 持久化数据源，并让 ChatTest 手动选择启用中的后端文档作为 `knowledgeContext`。

本阶段不是 RAG，不做 embedding、向量数据库、相似度检索、自动召回、联网搜索、文件上传或文档解析。

## 2. 后端数据与接口

`knowledge_documents` 表保存：

- `title`
- `content`
- `summary`
- `source_name`
- `tags`：内部为 JSON 字符串，对外为 `string[]`
- `enabled`
- `created_at`
- `updated_at`

接口：

```text
GET    /api/v1/knowledge-documents
GET    /api/v1/knowledge-documents/{id}
POST   /api/v1/knowledge-documents
PUT    /api/v1/knowledge-documents/{id}
DELETE /api/v1/knowledge-documents/{id}
```

列表支持 `page`、`pageSize`、`keyword`、`searchScope`、`enabled`。`pageSize` 最大为 100。

keyword 使用轻量 SQL `LIKE` 查询：

- `searchScope=basic`：默认范围，只匹配 `title`、`summary`、`source_name` 和 `tags`。
- `searchScope=fullText`：在 basic 范围基础上额外匹配完整 `content`。
- 有 keyword 时，service 层按标题、标签、摘要 / 来源、正文的优先级做轻量排序。
- 列表项返回 `matchSnippet` 说明命中位置，但不会返回完整正文。

当前不是 SQLite FTS、搜索引擎、embedding 检索或 RAG。

## 3. 列表与详情边界

- 列表项只返回 `summary`、后端生成的 `contentPreview` 和 keyword 命中时的 `matchSnippet`。
- 详情接口才返回完整 `content`。
- `matchSnippet` 只属于列表项，不加入详情接口。
- tags JSON 解析失败时返回空数组，避免脏数据导致页面失败。
- 找不到的详情、更新或删除请求返回 404。
- 开发期继续使用 `Base.metadata.create_all()`，不引入 Alembic。

## 4. Knowledge 页面

Knowledge 页面已改为后端数据源，支持：

- 服务端分页
- keyword 搜索
- basic / fullText 搜索范围切换
- keyword 命中片段提示
- enabled 筛选
- 创建、编辑、删除
- 启用、停用
- 详情按需加载完整正文
- loading 与 error 状态

表单只提供手工正文、手工摘要、来源名称、标签和启用状态，不提供文件上传、AI 摘要或自动解析。

## 5. ChatTest 接入

ChatTest 初始化时请求 `enabled=true` 的 Knowledge 列表。

用户选择文档后，前端按需请求详情并缓存。运行 stream 前会确保所有选中文档详情已经加载完成，再构造：

```text
knowledgeContext.titles = 选中文档标题数组
knowledgeContext.content = 选中文档完整正文拼接文本
```

未选择文档时：

```json
{
  "titles": [],
  "content": ""
}
```

这只是手动选择后端知识库文档作为上下文，不是 RAG。现有后端 messages 构造仍会将 `knowledgeContext.content` 截断到 7000 字符，当前未做 tokenizer 或复杂 token 预算。

本阶段没有修改 ChatTest stream、TestRecord 保存、详情 Drawer 或双记录对比的接口契约。

## 6. 非目标

- 不做 embedding
- 不做 SQLite FTS 或外部搜索引擎
- 不做向量数据库
- 不做自动召回或召回排序
- 不做联网搜索
- 不做文件上传
- 不做 PDF / Word 解析
- 不做自动摘要
- 不做多租户、Workspace、auth、JWT 或 RBAC
- 不做多模型并发生成
- 不新增 compareGroup 后端表

## 7. 验证

- `cd backend && python -m compileall app`
- FastAPI TestClient：basic title、basic 排除 content、fullText content、matchSnippet、轻量排序和详情结构
- 确认列表项没有 `content`，`matchSnippet` 不返回完整正文，详情有完整 `content` 且没有 `matchSnippet`
- `cd frontend && npm run build`
- 人工路径：访问 `/knowledge` 完成 CRUD；访问 `/chat-test` 选择启用文档并运行

没有真实 LLM API Key 时，只验证 Knowledge CRUD 与 ChatTest payload 构造，不宣称真实模型调用成功。

## 8. 后续入口

当前轻量 keyword 搜索适合开发期和小数据量。数据量变大后，可以单独评估 SQLite FTS、外部搜索引擎或 embedding 检索方案；进入 RAG 前仍需重新明确切片、索引、召回、token 预算和检索结果追踪边界。
