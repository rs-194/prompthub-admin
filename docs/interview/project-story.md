# PromptHub Admin 面试讲解稿

## 1. 项目背景

我做 PromptHub Admin 的原因是：普通 AI 对话不方便管理 Prompt、知识库上下文、测试记录和结果对比。真实开发大模型应用时，开发者经常需要反复调整 system prompt、参考资料和生成参数，也需要知道某次输出当时用了什么配置。

所以我把项目定位成面向大模型应用开发的 Prompt 调试平台，而不是普通聊天页面。当前主链路是：后端 Prompt 模板 + 手动 Knowledge 上下文 + 后端可信 ModelConfig 状态进入 ChatTest，后端代理真实 LLM API，前端用 NDJSON 做流式渲染，完成后保存 TestRecord，再通过详情和对比做复盘。

## 2. 我的主要工作

从前端角度，我主要做了这些工作：

- 负责页面模块拆分，围绕 Prompt、Knowledge、Model、ChatTest、TestRecord 组织页面和组件。
- 按 service / types / components 分层，把接口请求、类型定义和 UI 组件职责拆开。
- 在 ChatTest 中实现 fetch stream / ReadableStream 流式输出渲染，逐段追加模型输出。
- 处理 Drawer / Dialog / Table 等后台交互，包括 TestRecord 详情 Drawer 和双记录对比 Drawer。
- 维护 loading / error / empty / result 等状态，避免页面只有“成功态”。
- 与 FastAPI 后端接口对接，包括 PromptTemplate、KnowledgeDocument、ModelConfig、ChatTest stream 和 TestRecord。
- 保持 API Key 不进入前端，前端只调用后端 `/api` 接口，由后端环境变量托管真实 key。

## 3. 技术难点

### 流式输出解析与逐段渲染

ChatTest 使用 fetch stream 读取后端 StreamingResponse 返回的 `application/x-ndjson`。前端需要用 reader 和 TextDecoder 解码 chunk，再用 buffer 处理半行 JSON，按行解析后把 `chunk` 内容追加到页面。完成时处理 `done` 事件并刷新 TestRecord，错误时展示可读错误。

### Prompt / Knowledge / Model 三类配置源组合进 ChatTest

ChatTest 不是单纯输入框。它需要组合后端 PromptTemplate 的完整 content、用户手动选择的 KnowledgeDocument 正文、后端 ModelConfig 的可信状态，以及 temperature / maxTokens / outputFormat 参数。这里要区分真实调用字段和展示字段，例如真实 API Key 与真实模型配置由后端控制，前端不直接接触。

### TestRecord 复盘与双记录对比

TestRecord 列表只展示 `outputPreview`，详情 Drawer 再按需请求完整 `output`，避免列表接口过重。双记录对比则复用详情接口，选择两条历史记录后并排展示输入、参数、上下文和完整输出。这个能力是历史复盘，不是多模型并发生成。

### 前后端类型对齐

前端通过 types 定义请求和响应结构，后端通过 schemas 约束接口字段。列表和详情的轻重字段要明确，比如 Prompt / Knowledge 列表是 `contentPreview`，详情才有完整 `content`；TestRecord 列表是 `outputPreview`，详情才有完整 `output`。

### 不夸大 RAG 的边界控制

当前 Knowledge 是用户手动选择上下文，不做 embedding、向量数据库、自动召回或排序，所以不能说成真实 RAG。面试中我会明确讲这是 manual context，后续如果扩展 RAG，需要单独设计切片、embedding、召回、上下文注入和检索结果追踪。

## 4. 开发问题与排查记录

### 1. Vue 组件中状态或方法没有正确暴露

开发页面时遇到过模板中状态或方法无法正常使用的问题。我当时先通过浏览器控制台查看报错，再回到组件里检查 `<script setup>`、变量声明、模板绑定和组件作用域，最后定位到组件写法或暴露方式不一致。

这个过程让我更理解 `<script setup>` 中顶层声明会暴露给模板使用，也更注意 ref、computed、方法、props、emit 是否处在正确作用域中。

### 2. 父子组件通信字段不一致

拆分 Dialog、Drawer、Panel 组件时，也遇到过父组件传入字段、子组件 props、emit 事件名或 v-model 绑定不一致的问题，表现为弹窗提交后列表没有刷新、选中状态没有同步等。

后来我把边界重新梳理清楚：父组件负责页面状态和接口调用，子组件负责局部 UI 和事件抛出。后续通过 props / emits / types 对齐字段，组件通信问题就明显减少了。

### 3. 列表 preview 与详情 content 字段差异

Prompt、Knowledge、TestRecord 都采用列表 preview、详情完整内容的设计。如果编辑或启停时直接使用列表数据，可能因为列表没有完整 content / output 而导致字段丢失。

所以启用、停用或编辑前需要按需请求详情，拿到完整字段后再提交。这个问题让我更清楚地理解了列表接口和详情接口的职责差异：列表负责轻量浏览，详情负责完整编辑和复盘。

### 4. 流式输出中的半包解析问题

ChatTest 的 fetch stream 返回的是二进制 chunk，不保证每个 chunk 都刚好是一整行 JSON。前端需要用 buffer 暂存未解析完的半行 NDJSON，等下一段 chunk 到达后再拼接解析。

这个排查让我理解了流式响应和普通 JSON 响应的区别，也理解了为什么项目中要用 NDJSON 的 `chunk` / `done` / `error` 事件格式，把网络传输边界和业务事件边界分开处理。

## 5. 可以怎么讲

### 1 分钟版本

PromptHub Admin 是我做的一个面向大模型应用开发的 Prompt 调试平台。它不是普通聊天页面，而是围绕 Prompt 调试闭环设计：用户可以管理后端 Prompt 模板和 Knowledge 文档，在 ChatTest 里选择 Prompt、手动选择 Knowledge 上下文、查看后端模型配置状态，然后通过 FastAPI 后端代理真实 LLM API。前端使用 fetch stream 和 ReadableStream 解析 NDJSON，实现模型输出逐段渲染；正常完成后保存 TestRecord。记录列表只展示 outputPreview，详情 Drawer 再按需加载完整 output，还可以选择两条历史记录做对比复盘。当前边界也很明确：Knowledge 不是 RAG，API Key 不进前端，也还没有 auth、多租户和 Prompt 版本管理。

### 3 分钟版本

PromptHub Admin 的背景是我想做一个更贴近 AI 应用开发的前端项目。普通聊天页面只能看到一次回答，但真实调 Prompt 时，开发者更关心这次回答用了哪个 system prompt、哪些知识库上下文、什么模型参数，以及和历史测试结果相比有什么差异。所以我把项目做成 Prompt 调试与记录管理平台。

项目的主链路是：PromptTemplate、KnowledgeDocument 和 ModelConfig 进入 ChatTest。Prompt 和 Knowledge 都已经迁移到 FastAPI + SQLite 的轻量后端 CRUD，列表只返回 preview，详情按需返回完整 content。ModelConfig 当前是后端可信配置状态展示，只告诉前端 provider、model、baseUrlHost、API Key 是否已配置，不返回真实 key。

前端部分我按 Vue3 + TypeScript 做了模块拆分。页面负责交互，service 负责接口，types 负责请求和响应类型，复杂 UI 拆成局部组件，比如参数面板、结果面板、记录表、详情 Drawer、对比 Drawer。ChatTest 的核心难点是流式输出，我用 fetch 读取后端 StreamingResponse，响应格式是 NDJSON，不是 EventSource。前端用 reader 和 TextDecoder 逐段解析，并把 chunk 追加到页面，同时处理 loading、error、停止生成和组件卸载清理。

TestRecord 是复盘链路。正常流式完成后，后端保存 success 记录。列表接口只返回 outputPreview，让列表更轻；点击详情时再请求完整 output。双记录对比不是多模型并发，而是用户选择两条历史记录，前端分别拉详情后并排展示输入、参数、上下文和完整输出。

我在项目里刻意保持边界真实：Knowledge 当前只是手动上下文，不是 RAG；没有 embedding、向量数据库和自动召回；Prompt 也还没有版本管理、变量引擎和审核流；API Key 只在后端环境变量里，前端不输入、不保存、不展示。后续如果继续做，我会先补 stopped / failed 记录策略、项目截图和部署说明，再设计 Prompt 版本、文件上传和 RAG 方案。
