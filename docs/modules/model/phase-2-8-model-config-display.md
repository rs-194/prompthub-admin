# Phase 2.8 轻量 ModelConfig 展示

## 0. 文档状态

- 阶段：Phase 2.8
- 状态：已实现
- 适用范围：后端 LLM 环境配置状态读取与前端模型配置页面展示

## 1. 本阶段目标

Phase 2.8 完成轻量 ModelConfig 展示，让模型配置页面从纯前端 mock 展示升级为可以读取后端可信 LLM 配置状态。

后端新增 `GET /api/v1/model-config`，从 `settings` / 环境变量读取当前 LLM 配置，返回 provider、model、baseUrlHost、enabled、apiKeyConfigured、temperature、maxTokens、timeoutSeconds 等脱敏状态字段。

## 2. 本阶段已实现

- 后端通过 `backend/app/modules/model_config/service.py` 组装模型配置状态。
- 后端通过 `backend/app/modules/model_config/schemas.py` 定义响应结构。
- 后端通过 `backend/app/api/v1/model_config.py` 提供 `GET /api/v1/model-config`。
- 前端 `frontend/src/services/model.ts` 新增 `getModelConfig()`，使用现有 request 封装调用接口并校验响应结构。
- 前端 `frontend/src/views/models/ModelConfigView.vue` 顶部展示后端真实调用配置卡片。
- 原前端 mock 模型列表保留为“前端展示用 mock 模型列表”，并明确不控制真实后端 `LLM_MODEL`。

## 3. 安全边界

- 不返回 `LLM_API_KEY` 明文。
- 不返回 Authorization。
- 不返回 headers。
- 前端只显示“API Key 已配置 / 未配置”。
- 不做 API Key 输入框。
- 不做 API Key 加密存储。
- 不做用户级模型配置。
- 不做 ModelConfig CRUD。
- 不做多 provider 管理。

## 4. 调用链路

```text
ModelConfigView
-> frontend/src/services/model.ts getModelConfig()
-> GET /api/v1/model-config
-> backend model_config service
-> app.core.config.settings
-> 后端环境变量 / backend/.env
```

## 5. 字段说明

```json
{
  "provider": "OpenAI-Compatible",
  "model": "deepseek-chat",
  "baseUrlHost": "api.deepseek.com",
  "enabled": true,
  "apiKeyConfigured": true,
  "temperature": 0.7,
  "maxTokens": 1024,
  "timeoutSeconds": 60
}
```

- `provider`：当前固定为 OpenAI-compatible 或基于 host 轻量推断 DeepSeek。
- `model`：来自后端 `LLM_MODEL`。
- `baseUrlHost`：只返回 host，不返回完整 URL 参数。
- `enabled`：`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL` 都存在时为 true。
- `apiKeyConfigured`：只返回布尔值。
- `temperature`、`maxTokens`、`timeoutSeconds`：来自后端默认 LLM 配置。

配置缺失时接口仍正常返回，`enabled=false`，不会因为缺失配置直接返回 503。

## 6. 与 ChatTest 的关系

前端 ChatTest 请求中的 `modelName` 当前主要用于展示和 TestRecord 记录字段，不直接决定真实 LLM 调用模型。

真实调用模型仍由后端环境变量 `LLM_MODEL` 控制。模型配置页面中的 mock 列表只保留为前端展示和页面练习用数据，不能理解为真实后端模型切换能力。

## 7. 后续入口

如果后续做真正的 ModelConfig 后端化，需要重新设计：

- API Key 加密存储。
- API Key 脱敏展示。
- 配置管理权限校验。
- 配置变更审计。
- 多用户或 Workspace 范围隔离。
- provider / model CRUD。
- 与 ChatTest 真实调用链路的配置选择关系。

以上均不属于 Phase 2.8。
