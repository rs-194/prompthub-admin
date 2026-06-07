# PromptHub Admin 面试问答

## 1. 你这个项目解决什么问题？

它解决的是 Prompt 调试过程难复盘的问题。普通对话只能看到单次输入输出，但开发大模型应用时还需要记录 Prompt、上下文、模型配置、参数和历史结果，所以我做了一个 Prompt 调试与记录管理平台。

## 2. 为什么不直接做普通聊天页面？

普通聊天页面更像体验型功能，项目区分度不高。PromptHub Admin 更偏开发者工具，重点是管理 Prompt、选择上下文、运行真实流式调试、保存 TestRecord，并支持详情和对比复盘。

## 3. ChatTest 流式输出怎么实现？

后端用 FastAPI `StreamingResponse` 返回 `application/x-ndjson`。前端用 fetch 读取 `response.body.getReader()`，通过 TextDecoder 解码 chunk，再按行解析 NDJSON，把 `chunk` 内容逐段追加到页面。

## 4. 为什么不用 EventSource？

当前请求需要 POST 复杂 body，包括 Prompt、userInput、knowledgeContext 和 params。fetch stream 对 POST 更自然，也方便复用 AbortController。这个项目当前明确不是原生 EventSource SSE。

## 5. TestRecord 为什么列表只存 preview / 详情再取完整 output？

完整 output 可能很长，如果列表直接返回完整内容会让接口和页面都变重。列表用 `outputPreview` 方便快速浏览，用户打开详情 Drawer 时再调用详情接口获取完整 `output`。

## 6. Prompt 后端化后，ChatTest 怎么拿完整 Prompt 内容？

Prompt 列表只返回 `contentPreview`。ChatTest 初始化加载启用中的 PromptTemplate，用户选择或运行前按需请求详情并缓存，然后使用详情里的完整 `content` 作为 `systemPrompt`。

## 7. Knowledge 是不是 RAG？

不是。当前 Knowledge 是用户手动选择后端文档，前端拿到完整正文后拼入 `knowledgeContext`。它没有 embedding、向量数据库、相似度召回或自动排序，所以不能说成真实 RAG。

## 8. 为什么现在不做 embedding？

当前阶段目标是先打通 Prompt 调试主链路和记录复盘。embedding 涉及文档切片、向量库、召回策略、token 预算和检索结果追踪，应该单独设计，不适合在轻量 CRUD 阶段硬塞进去。

## 9. API Key 为什么不放前端？

API Key 放前端会暴露在浏览器和网络请求里，风险很高。当前项目由后端 `.env` / 环境变量托管 key，前端只调用后端接口，ModelConfig 页面也只展示是否已配置，不返回明文。

## 10. ModelConfig 页面为什么只展示状态？

当前项目先保证真实 LLM 调用配置可信，前端只需要知道后端当前配置是否可用。完整的 API Key 管理、多 provider、加密存储和用户级配置复杂度更高，后续再单独做。

## 11. 双记录对比怎么做？

用户在 TestRecord 列表选择两条历史记录，前端分别调用 `GET /api/v1/test-records/{id}` 获取完整详情，然后在 Compare Drawer 中并排展示 prompt、model、params、knowledge、userInput 和 output。它不是多模型并发生成。

## 12. 你作为前端主要做了什么？

我主要负责 Vue3 + TypeScript 前端模块拆分、service / types / components 分层、ChatTest 流式渲染、Drawer / Dialog / Table 交互、loading / error / empty 状态，以及和 FastAPI 后端接口对接。

## 13. 项目里后端部分你怎么定位？

后端是为了支撑前端真实调试链路，不是为了包装成大型后端系统。它提供 Prompt、Knowledge、TestRecord、ChatTest stream 和 ModelConfig 状态接口，并代理真实 LLM API，避免 API Key 进入前端。

## 14. 项目还有哪些不足？

当前没有真实 RAG、文件上传、文档解析、Prompt 版本管理、变量引擎、auth / RBAC、多租户、多 provider 管理和多模型并发生成。用户主动停止或失败记录的保存策略也还可以继续完善。

## 15. 后续如果继续做，你会怎么扩展？

我会先做 UI polish、项目截图、部署说明和 stopped / failed TestRecord 策略；再做简单关键词检索、Prompt 版本管理和变量填充；中长期再设计文件上传、embedding / RAG、多 provider、auth / workspace 和权限审计。

## 16. 前后端类型怎么保持一致？

前端在 `types` 中定义请求和响应结构，service 层负责字段校验和转换；后端用 schemas 定义接口形状。列表和详情的字段差异也会明确命名，比如 `contentPreview` 和完整 `content`、`outputPreview` 和完整 `output`。

## 17. 为什么 TestRecord 对比不新增后端 compare API？

当前对比只是历史记录复盘，复用详情接口就够了。新增 compare API 或 compareGroup 表会引入额外后端设计，但现在还没有多模型并发、对比任务组或复杂 diff 的需求。

18. 停止生成怎么做？
前端使用 AbortController，中止当前 fetch stream；UI 状态从 streaming 回到可操作状态。后续可以补 stopped TestRecord 保存策略。

19. 为什么用 NDJSON？
因为流式输出需要一段一段返回，NDJSON 每行都是一个可独立解析的 JSON，前端按行解析比较简单，也比一次性返回完整 JSON 更适合长文本生成。

20. 这个项目和普通 CRUD 最大区别是什么？
CRUD 只是管理 Prompt 和 Knowledge；真正的主链路是把 Prompt、Knowledge、ModelConfig 组合进 ChatTest，运行真实流式调试，并把结果沉淀成 TestRecord 做复盘和对比。