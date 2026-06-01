# Phase 2.7 TestRecord 双记录对比

## 0. 文档状态
- 阶段：Phase 2.7
- 状态：已实现
- 适用范围：ChatTest 最近测试记录列表、历史 TestRecord 详情对比、前端 Drawer 展示

## 1. 阶段目标
Phase 2.7 完成基于历史 TestRecord 的双记录对比能力。用户需要先通过 run / stream 生成或准备至少两条测试记录，再在最近测试记录列表中选择其中 2 条打开对比 Drawer。

本阶段复用现有详情接口：

```text
GET /api/v1/test-records/{id}
```

前端分别请求两条完整记录后，并排展示模型、参数、知识库上下文、耗时、用户输入和完整 output。

## 2. 本阶段范围
- 在最近测试记录表格中增加 selection 列，最多选择 2 条记录。
- 在最近测试记录区域增加“对比选中记录”按钮，未选择 2 条时禁用。
- `ChatTestView` 管理 compare Drawer 的 visible、loading、error、empty 和 records 状态。
- 新增 `TestRecordCompareDrawer`，独立展示两条记录对比，不影响单条详情 Drawer。
- 对比 Drawer 展示轻量差异提示：模型不同、参数不同、知识库上下文不同、耗时差值。
- 支持 loading / error / empty / detail 状态。

## 3. 本阶段不做
- 不修改后端代码。
- 不新增后端 compareGroup 表。
- 不实现一次请求同时生成多个模型结果。
- 不实现多模型并发生成。
- 不实现多路 stream。
- 不做真实 RAG、embedding、向量数据库。
- 不做 ModelConfig 后端化。
- 不做 auth / JWT / RBAC、多租户或 Workspace。

## 4. 用户操作流程
1. 启动后端和前端，进入 ChatTest 页面。
2. 确保已有至少 2 条 TestRecord。
3. 在最近测试记录表格中勾选 2 条记录。
4. 点击“对比选中记录”。
5. 前端并发调用两次 `GET /api/v1/test-records/{id}`。
6. Compare Drawer 展示两条完整记录和轻量差异提示。

## 5. 文件职责
- `TestRecordTable.vue`：负责列表展示、selection 限制、详情事件和对比入口事件，不请求详情。
- `ChatTestView.vue`：负责选择状态、对比 Drawer 状态和两条详情请求。
- `TestRecordCompareDrawer.vue`：负责双列展示、loading / error / empty / detail 状态和差异提示。
- `TestRecordDetailDrawer.vue`：继续只负责单条记录详情。

## 6. 对比字段
每条记录展示：

- Prompt 标题
- 模型名称
- 状态
- 创建时间
- 耗时 `durationMs`
- 参数：`temperature`、`maxTokens`、`outputFormat`
- 用户输入 `userInput`
- 知识库上下文：`knowledgeTitles`、`knowledgeCount`
- 完整 `output`

知识库为空时显示“未使用知识库上下文”。完整 output 使用 `pre-wrap` 和滚动容器展示，避免撑爆 Drawer。

## 7. 错误与边界
- 未选择 2 条记录时，对比按钮禁用；直接触发时显示提示。
- 如果某条记录不存在或已删除，Drawer 内展示安全错误信息。
- 如果网络异常或响应结构异常，Drawer 内展示错误提示，不暴露后端堆栈。
- 关闭 Compare Drawer 时清理对比错误状态，不清空表格选择。

## 8. 后续入口
下一阶段可以考虑：

- 轻量 ModelConfig 展示。
- Knowledge 后端化。
- failed / stopped record 持久化策略。
- stream 错误恢复优化。
