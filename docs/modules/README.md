# 模块文档索引

本目录保存项目模块的阶段文档。公开索引优先展示当前真实主链路，早期 mock 文档仅作为历史实现记录保留。

## 当前公开模块

| 模块 | 当前阶段 | 文档 | 状态 |
| --- | --- | --- | --- |
| Dashboard 首页 | Phase 2.13B summary 接入 | [phase-2-13-dashboard-summary.md](dashboard/phase-2-13-dashboard-summary.md) | 已实现 |
| 提示词管理 | Phase 2.11 backend lite | [phase-2-11-prompt-backend-lite.md](prompt/phase-2-11-prompt-backend-lite.md) | 已实现 |
| 知识库管理 | Phase 2.9 backend lite | [phase-2-9-knowledge-backend-lite.md](knowledge/phase-2-9-knowledge-backend-lite.md) | 已实现 |
| 模型配置 | Phase 2.8 可信状态展示 | [phase-2-8-model-config-display.md](model/phase-2-8-model-config-display.md) | 已实现 |
| ChatTest | Phase 2.5 真实流式输出 | [phase-2-5-stream.md](chat-test/phase-2-5-stream.md) | 已实现 |
| TestRecord | Phase 2.6 详情 Drawer | [phase-2-6-record-detail-drawer.md](chat-test/phase-2-6-record-detail-drawer.md) | 已实现 |
| TestRecord | Phase 2.7 双记录对比 | [phase-2-7-record-compare.md](chat-test/phase-2-7-record-compare.md) | 已实现 |

## 支撑阶段文档

- `backend/`：FastAPI 骨架、TestRecord 持久化和真实 LLM 调用阶段记录。
- `chat-test/phase-2-4-real-run-api.md`：前端接入真实 run 接口。
- `chat-test/v1-mock-design.md`、`v2-knowledge-context-mock.md`、`v3-params-and-mock-streaming.md`：早期 mock 演进记录。
- `knowledge/v1-mock-design.md`：Knowledge 早期 mock 设计记录。
- `auth/v1-mock-design.md`：mock 访问控制历史设计，不代表真实认证已完成。

## 当前真实边界

- Prompt 和 Knowledge 已使用后端 SQLite 持久化 CRUD。
- ChatTest 已使用 FastAPI StreamingResponse 和 NDJSON 真实流式输出。
- TestRecord 已支持保存、详情按需加载和历史双记录对比。
- ModelConfig 只返回脱敏配置状态，不返回 API Key，也不提供 CRUD。
- Knowledge 当前是手动上下文，不是 RAG。
- 当前没有真实 JWT、RBAC、多租户、Workspace 或多 provider 管理。

## 后续顺序

1. 补充真实项目截图和部署说明。
2. 完善 failed / stopped TestRecord 保存策略和 stream 错误恢复。
3. 增加 Prompt 版本管理、变量填充或简单检索增强。
4. 设计 Knowledge 文件上传、embedding 和 RAG 链路。
5. 评估真实认证、Workspace、多租户、多 provider、权限和审计。
