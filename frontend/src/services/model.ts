import type { ModelConfigFormData, ModelConfigItem } from '@/types/model';

// 当前为 mock 数据，刷新页面后会恢复为初始数组；后端待接入，不真实调用大模型 API。
const modelConfigList: ModelConfigItem[] = [
  {
    id: 1,
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    modelName: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4096,
    enabled: true,
    remark: '用于日常 Prompt 调试的 DeepSeek 示例配置',
    updatedAt: '2026-05-10 10:30',
  },
  {
    id: 2,
    name: 'OpenAI Compatible Demo',
    provider: 'openai-compatible',
    baseUrl: 'https://api.example.com/v1',
    modelName: 'gpt-compatible-demo',
    temperature: 0.5,
    maxTokens: 2048,
    enabled: true,
    remark: 'OpenAI 兼容接口示例，当前不包含真实 API Key',
    updatedAt: '2026-05-09 16:20',
  },
  {
    id: 3,
    name: 'Local Custom Model',
    provider: 'custom',
    baseUrl: 'http://localhost:8000/v1',
    modelName: 'local-custom-model',
    temperature: 0.2,
    maxTokens: 1024,
    enabled: false,
    remark: '本地自定义模型示例，后续可替换为真实服务地址',
    updatedAt: '2026-05-08 14:05',
  },
];

function getCurrentTimeText() {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date()).replace(/\//g, '-');
}

function getNextModelConfigId() {
  return Math.max(0, ...modelConfigList.map((model) => model.id)) + 1;
}

function cloneModelConfig(model: ModelConfigItem): ModelConfigItem {
  return { ...model };
}

export function getModelConfigList(): Promise<ModelConfigItem[]> {
  // 返回浅拷贝，避免页面直接修改 service 内部 mock 数组。
  return Promise.resolve(modelConfigList.map(cloneModelConfig));
}

export function createModelConfig(
  data: ModelConfigFormData,
): Promise<ModelConfigItem> {
  const createdModel: ModelConfigItem = {
    ...data,
    id: getNextModelConfigId(),
    updatedAt: getCurrentTimeText(),
  };

  // mock CRUD 直接操作本地数组，用来模拟后端新增接口返回最新数据。
  modelConfigList.unshift(createdModel);
  return Promise.resolve(cloneModelConfig(createdModel));
}

export function updateModelConfig(
  id: number,
  data: ModelConfigFormData,
): Promise<ModelConfigItem | undefined> {
  const targetIndex = modelConfigList.findIndex((model) => model.id === id);

  if (targetIndex === -1) {
    return Promise.resolve(undefined);
  }

  const currentModel = modelConfigList[targetIndex];
  if (!currentModel) {
    return Promise.resolve(undefined);
  }

  const updatedModel: ModelConfigItem = {
    ...currentModel,
    ...data,
    updatedAt: getCurrentTimeText(),
  };

  // mock 编辑只更新当前内存数组中的对应项，后端接入后会替换为接口请求。
  modelConfigList.splice(targetIndex, 1, updatedModel);
  return Promise.resolve(cloneModelConfig(updatedModel));
}

export function deleteModelConfig(id: number): Promise<void> {
  const targetIndex = modelConfigList.findIndex((model) => model.id === id);

  if (targetIndex !== -1) {
    // mock 删除只影响前端内存数据，刷新页面后不保证持久化。
    modelConfigList.splice(targetIndex, 1);
  }

  return Promise.resolve();
}

export function toggleModelConfigEnabled(
  id: number,
  enabled: boolean,
): Promise<ModelConfigItem | undefined> {
  const targetIndex = modelConfigList.findIndex((model) => model.id === id);

  if (targetIndex === -1) {
    return Promise.resolve(undefined);
  }

  const currentModel = modelConfigList[targetIndex];
  if (!currentModel) {
    return Promise.resolve(undefined);
  }

  const updatedModel: ModelConfigItem = {
    ...currentModel,
    enabled,
    updatedAt: getCurrentTimeText(),
  };

  // 启用/停用只更新状态和更新时间，避免误改其他模型配置字段。
  modelConfigList.splice(targetIndex, 1, updatedModel);
  return Promise.resolve(cloneModelConfig(updatedModel));
}
