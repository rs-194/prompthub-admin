# 路线图（Roadmap）

## 已完成主链路

- Dashboard：真实 summary 统计和最近 TestRecord。
- Prompt：后端 PromptTemplate CRUD、分页、筛选和详情加载。
- Knowledge：后端 KnowledgeDocument CRUD、分页、筛选和手动上下文选择。
- ModelConfig：后端可信配置状态展示，不返回 API Key。
- ChatTest：FastAPI StreamingResponse + fetch stream + NDJSON。
- TestRecord：保存、列表 preview、详情 Drawer 和历史双记录对比。

## Phase Public-0：公开仓库清理与截图目录整理

- 状态：已完成。
- 清理 README 和公开文档入口。
- 移除公开仓库中的本地准备资料。
- 建立 `docs/assets/screenshots/` 截图目录占位。
- 更新项目展示页、模块索引、路线图和开发记录。
- 本阶段不修改业务代码。

## 近期规划

- 补充 Dashboard、Prompt、Knowledge、ChatTest 和 TestRecord 真实截图。
- 补充部署说明。
- 完善 failed / stopped TestRecord 保存策略和 stream 错误恢复。

## Phase 2.14A：列表搜索防抖优化

- 状态：已完成。
- Prompt 与 Knowledge 列表 keyword 输入支持 400ms 防抖自动搜索。
- 保留搜索和重置按钮，筛选、分页和组件卸载时会取消待执行搜索。
- TestRecord 当前没有 keyword 搜索入口，本阶段未扩展。
- 本阶段不修改后端、接口契约或依赖。

## Phase 2.14B：Knowledge 搜索体验优化

- 状态：已完成。
- Knowledge keyword 默认只搜索标题、摘要、来源和标签。
- 可切换全文范围，按需增加正文匹配。
- 列表返回轻量匹配提示，并优先展示标题、标签等更相关结果。
- 当前仍是 SQL `LIKE` 与 service 层轻量排序，不是 FTS、embedding 或 RAG。

## 中期规划

- Prompt 版本管理和简单变量填充。
- Knowledge 文件上传与文档解析。
- embedding / RAG 方案设计。

## 长期规划

- 真实 auth、JWT、RBAC 和 Workspace。
- 多 provider 与多模型对比。
- 权限、审计和多租户能力。

## 项目边界

- Knowledge 当前是手动上下文，不是自动 RAG 召回。
- ModelConfig 当前是只读脱敏状态，不是完整配置管理。
- TestRecord 双记录对比基于历史记录，不是多模型并发生成。
- 当前没有真实认证、权限或多租户能力。
