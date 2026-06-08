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

## 18. 停止生成怎么做？

前端使用 AbortController，中止当前 fetch stream；UI 状态从 streaming 回到可操作状态。后续可以补 stopped TestRecord 保存策略。

## 19. 为什么用 NDJSON？

因为流式输出需要一段一段返回，NDJSON 每行都是一个可独立解析的 JSON，前端按行解析比较简单，也比一次性返回完整 JSON 更适合长文本生成。

## 20. 这个项目和普通 CRUD 最大区别是什么？

CRUD 只是管理 Prompt 和 Knowledge；真正的主链路是把 Prompt、Knowledge、ModelConfig 组合进 ChatTest，运行真实流式调试，并把结果沉淀成 TestRecord 做复盘和对比。

## 21. fetch stream 解析时为什么需要 buffer？

fetch stream 读取的是 `ReadableStream` 里的二进制 chunk，chunk 到达边界由网络和运行时决定，不保证刚好是一行完整 JSON。前端用 `TextDecoder` 解码后，可能拿到半行、几行，或者一行半的数据。

所以需要 buffer 暂存还没解析完的内容。每次新 chunk 到达后先拼到 buffer，再按换行拆分；完整行拿去 `JSON.parse`，最后剩下的半行继续留在 buffer 里等下一次 chunk。

## 22. 如果后端返回半行 JSON，前端怎么处理？

前端不会立刻解析半行 JSON，而是把它留在 buffer 里。只有遇到换行符，确认这一行已经完整，才把这一行当成一条 NDJSON 事件解析。

如果强行对半行做 `JSON.parse`，会出现解析错误，而且这不是后端数据一定错了，而是流式传输本身就可能把一条 JSON 拆成多个 chunk。buffer 的作用就是把这种网络层边界和业务事件边界隔离开。

## 23. AbortController 中断后，后端会不会继续生成？

`AbortController` 能保证前端主动中断当前 fetch 请求，页面不再继续读取 stream，UI 也会从 streaming 状态恢复。但后端和模型服务是否完全停止，要看后端是否感知到客户端断开，以及它是否继续取消上游 LLM 请求。

当前项目先保证前端请求和界面状态可中断，不把它包装成完整的后端任务取消系统。后续如果要做得更完整，可以在后端检测断开、取消 httpx 上游请求，并设计 stopped TestRecord 保存策略。

## 24. 为什么用 NDJSON，而不是直接返回纯文本流？

纯文本流适合只展示模型输出，但这个项目不只需要文本，还需要区分 `chunk`、`done`、`error` 这类事件。NDJSON 每一行都是独立 JSON，可以在同一条 stream 里表达不同事件类型和附加字段。

比如 `chunk` 用来追加输出，`done` 可以带保存后的 `TestRecord`，`error` 可以带错误信息。这样前端解析逻辑更清晰，也比自己约定文本分隔符可靠。

## 25. done 事件里为什么要带 record？

done 事件带 `record` 是为了让流式完成和记录保存这两个动作在前端看来是同一个完成结果。后端保存成功后，把最终的 TestRecord 返回给前端，前端可以直接更新列表或状态。

如果 done 里不带 record，前端就需要额外请求列表或详情，甚至只能猜测后端有没有保存成功。带 record 可以减少一次请求，也让“生成完成且已沉淀为 TestRecord”这个状态更明确。

## 26. 如果 stream 中途失败，TestRecord 要不要保存？

当前项目是成功完成后保存 success TestRecord，不假装已经完整实现 failed / stopped 记录保存。中途失败或用户主动停止时，前端可以提示失败或停止，但记录沉淀策略还属于后续可补充能力。

如果要做，我会先设计字段和规则，比如 `status`、`errorMessage`、`partialOutput`、`stoppedAt`，以及哪些场景保存、哪些场景不保存。这样后续复盘时能区分成功结果、失败结果和用户停止结果。

## 27. Prompt / Knowledge 列表为什么不直接返回完整 content？

列表页主要负责浏览、筛选和分页，如果每条 PromptTemplate 或 KnowledgeDocument 都返回完整 content，接口响应会变重，页面渲染也会更慢，尤其 Knowledge 正文可能比较长。

所以列表返回 preview 字段，用于快速浏览；用户打开详情、编辑或 ChatTest 真正需要完整内容时，再按需请求详情。这是把列表读取和详情读取分开，避免为了少数操作让列表接口一直很重。

## 28. 启用 / 停用 Prompt 时，为什么要先请求详情再 PUT？

Prompt 列表里只有 `contentPreview`，没有完整 `content`。如果直接拿列表项拼 PUT 请求，很容易把完整内容字段覆盖丢失，尤其后端更新接口需要完整对象时风险更明显。

所以启用 / 停用前先请求详情，拿到完整 PromptTemplate 后只修改 `enabled` 再提交。这个做法看起来多一次请求，但能避免列表 preview 和详情 content 字段不一致导致的数据丢失。

## 29. ChatTest 为什么要缓存 Prompt / Knowledge 详情？

ChatTest 运行时需要完整 Prompt content 和 Knowledge content，但列表只有 preview。如果用户多次选择同一个 PromptTemplate 或 KnowledgeDocument，每次都重新请求详情会浪费接口调用，也会让交互变慢。

缓存详情可以让第一次按需加载，后续复用完整内容。它不是复杂全局缓存，只是服务于当前调试页的局部优化，减少重复请求，同时保证运行时用的是完整上下文。

## 30. Prompt 加载失败和 Knowledge 加载失败为什么处理策略不同？

Prompt 是 ChatTest 的核心输入之一，加载失败会直接影响这次调试能不能正确运行，所以需要明确提示用户，不能安静忽略。

Knowledge 在当前项目里是可选的手动上下文，不是真 RAG 自动召回。某个 KnowledgeDocument 加载失败时，可以 fail-open：提示用户这部分上下文没有加入，但不一定阻断核心 Prompt 调试流程。

## 31. 你怎么避免 View 里堆太多请求逻辑？

我的边界是 View 负责页面状态和交互编排，比如当前选中项、loading、Drawer 开关和错误提示；具体接口请求放在 service 层，类型结构放在 types 层，局部 UI 放到 components 里。

这样 View 里能看出业务流程，但不会到处散落 fetch URL、请求参数拼接和响应字段处理。后续如果接口路径或字段变化，优先改 service 和 types，而不是在页面里全局搜索硬编码。

## 32. service 层和 types 层分别负责什么？

service 层负责封装 API 调用，比如请求哪个接口、用什么 method、如何传 query 或 body、返回什么数据。它让页面不用直接关心底层请求细节。

types 层负责定义请求和响应结构，比如 list item、detail、create request、update request、stream event、TestRecord response 的字段差异。这样 TypeScript 可以提前约束接口契约，减少字段名写错或把 preview 当完整 content 用的问题。

## 33. TypeScript 在这个项目里的价值体现在哪里？

这个项目的对象字段比较多，比如 PromptTemplate、KnowledgeDocument、TestRecord，还有列表和详情两套结构。TypeScript 能把 `contentPreview` 和 `content`、`outputPreview` 和 `output` 这种差异表达清楚，避免前端误用字段。

另外，stream event 也可以用类型区分 `chunk`、`done`、`error`。这样写解析逻辑时，代码能更明确地知道每种事件有哪些字段，减少运行时才发现字段不存在的问题。

## 34. 如果后续做 RAG，你会怎么改数据结构和链路？

我会先明确当前 Knowledge 不是 RAG，它只是手动选择上下文。如果后续做 RAG，需要新增文档上传与解析流程，把文档拆成 chunk 表，再对 chunk 做 embedding，并接入向量数据库或向量索引。

运行链路也要从现在的手动选择，扩展为 `query -> recall -> rerank -> context 注入`。同时 TestRecord 里要记录 retrieval results，比如召回了哪些 chunk、分数是多少、最终注入了哪些上下文，并控制 token budget，方便后续复盘为什么模型这样回答。

## 35. 如果要部署上线，你会注意哪些问题？

我会先区分前后端环境变量，API Key 只放后端，不进入前端构建产物；同时检查 CORS、Vite proxy 到生产反向代理的切换、前端 build 产物部署路径，以及后端启动命令和进程管理。

数据层也要注意 SQLite 文件持久化或后续迁移方案，不能把 `.env`、真实 API Key、sqlite db 提交到仓库。上线后还需要基本日志、错误监控和超时配置，至少能定位 LLM 调用失败、接口异常和流式中断问题。

## 36. 为什么项目里没有使用 axios？

项目里普通 JSON 接口使用原生 fetch 做了轻量 request 封装，流式输出部分则直接使用 fetch + ReadableStream 读取响应体。因为 ChatTest 需要消费后端 StreamingResponse 返回的 NDJSON 流，浏览器端用 fetch 读取 response.body.getReader() 更直接，也方便配合 AbortController 做停止生成和组件卸载清理。

所以我没有额外引入 axios，避免项目里同时存在两套请求风格。这里不是说 axios 不能处理请求，而是当前场景下 fetch 更贴合流式读取需求。

## 37. 项目开发中遇到过什么问题，你是怎么排查的？

我遇到过几类比较典型的问题。第一类是 Vue 组件作用域问题，比如模板里状态或方法没有正常生效。我会先看浏览器控制台报错，再回到组件里检查 `<script setup>`、顶层变量声明、模板绑定和 ref / computed / 方法是否在正确作用域中。

第二类是拆分 Dialog、Drawer、Panel 后，父组件传入字段、子组件 props、emits 或 v-model 名称不一致，导致弹窗提交后列表没有刷新、选中状态没有同步。我后面会沿着数据流方向排查：父组件是否拥有页面状态，子组件是否只负责局部 UI 和事件抛出，字段类型和事件名是否统一。

这个过程让我更重视组件职责边界、类型定义和父子通信约定。后续写组件时，我会先明确 props / emits / v-model 的契约，再实现内部交互，避免靠临时字段把状态串起来。

## 38. 列表 preview 和详情完整内容分离后，开发中要注意什么？

列表接口为了轻量，通常只返回 preview 字段，比如 Prompt / Knowledge 的 `contentPreview`、TestRecord 的 `outputPreview`。这些字段适合浏览和筛选，但不能当成完整内容使用。

所以编辑、启停、详情展示或 ChatTest 真正需要完整 content / output 时，不能直接依赖列表项，而是要按需请求详情。尤其 PUT 更新时，如果拿列表 preview 拼请求，可能会把完整字段覆盖丢失。

这个设计在 Prompt、Knowledge、TestRecord 中都有体现。它的核心是把轻量列表和完整详情职责分开：列表保证页面快速浏览，详情保证编辑、运行和复盘时字段完整。
