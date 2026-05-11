import type { ModelConfigFormData, ModelConfigItem } from '@/types/model';

// 当前为前端 mock 数据，刷新页面后会恢复为初始数组；后端待接入，不真实调用大模型 API。
// 本阶段刻意不实现 API Key 管理：不保存、不展示、不加密真实 API Key。
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

/**
 * 生成模型配置 mock 数据的更新时间文本。
 *
 * 当前 mock service 用本地时间模拟后端返回的 updatedAt 字段；
 * 刷新页面后 mock 数据会恢复初始值，不会持久化该时间。
 *
 * @returns 格式化后的当前时间字符串
 */
function getCurrentTimeText() {
  // mock CRUD 用本地时间模拟后端返回的 updatedAt。
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

/**
 * 生成下一条模型配置 mock 数据的 id。
 *
 * 当前根据内存数组中的最大 id 加 1，模拟后端创建配置时生成主键；
 * 后续接入后端后，这个逻辑会替换为接口返回的真实 id。
 *
 * @returns 下一条模型配置可使用的 mock id
 */
function getNextModelConfigId() {
  // mock 新增时用当前最大 id + 1 模拟后端生成主键。
  return Math.max(0, ...modelConfigList.map((model) => model.id)) + 1;
}

function cloneModelConfig(model: ModelConfigItem): ModelConfigItem {
  // 返回浅拷贝，避免页面直接修改 service 内部 mock 对象。
  return { ...model };
}

/**
 * 获取模型配置 mock 列表。
 *
 * 当前读取前端内存数组，新增、编辑、删除和启用/停用只在运行期间生效，
 * 刷新页面后会恢复初始 mock 数据。返回浅拷贝是为了避免页面层直接修改
 * service 内部 mock 数据源。后续接入后端时，这里会替换为列表查询接口。
 *
 * @returns 模型配置列表数据的浅拷贝
 */
export function getModelConfigList(): Promise<ModelConfigItem[]> {
  // 返回浅拷贝，避免页面直接修改 service 内部 mock 数组。
  return Promise.resolve(modelConfigList.map(cloneModelConfig));
}

/**
 * 创建一条新的模型配置 mock 数据。
 *
 * 当前只写入前端内存数组，刷新页面后会恢复初始 mock 数据；
 * 本阶段不保存真实 API Key。后续接入后端时，这里会替换为 POST 请求。
 *
 * @param data 表单提交的模型配置数据，不包含 id 和 updatedAt
 * @returns 创建后的完整模型配置数据
 */
export function createModelConfig(
  data: ModelConfigFormData,
): Promise<ModelConfigItem> {
  // mock 新增直接写入本地数组，id 和 updatedAt 在这里模拟后端生成。
  const createdModel: ModelConfigItem = {
    ...data,
    id: getNextModelConfigId(),
    updatedAt: getCurrentTimeText(),
  };

  modelConfigList.unshift(createdModel);
  return Promise.resolve(cloneModelConfig(createdModel));
}

/**
 * 更新一条已有模型配置 mock 数据。
 *
 * 当前根据 id 在前端内存数组中查找并替换对应项，同时刷新 updatedAt；
 * 本阶段不处理真实 API Key，刷新页面后修改不会持久化。
 * 后续接入后端时，这里会替换为 PUT/PATCH 请求。
 *
 * @param id 要更新的模型配置 id
 * @param data 编辑弹窗提交的模型配置表单数据
 * @returns 更新后的完整模型配置数据；未找到时返回 undefined
 */
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

  // mock 编辑只更新当前内存数组中的对应项，并刷新 updatedAt；后端接入后替换为接口请求。
  modelConfigList.splice(targetIndex, 1, updatedModel);
  return Promise.resolve(cloneModelConfig(updatedModel));
}

/**
 * 删除一条模型配置 mock 数据。
 *
 * 当前只从前端内存数组移除对应项，刷新页面后会恢复初始 mock 数据；
 * 后续接入后端时，这里会替换为 DELETE 请求。
 *
 * @param id 要删除的模型配置 id
 * @returns 删除操作完成后的空结果
 */
export function deleteModelConfig(id: number): Promise<void> {
  const targetIndex = modelConfigList.findIndex((model) => model.id === id);

  if (targetIndex !== -1) {
    // mock 删除只影响前端内存数据，刷新页面后不保证持久化。
    modelConfigList.splice(targetIndex, 1);
  }

  return Promise.resolve();
}

/**
 * 切换模型配置的启用状态。
 *
 * 当前 mock 阶段只更新 enabled 字段和 updatedAt，不做真实模型连通性测试，
 * 也不调用任何模型 API。后续接入后端时，这里会替换为启用/停用接口。
 *
 * @param id 要切换状态的模型配置 id
 * @param enabled 目标启用状态，true 表示启用，false 表示停用
 * @returns 更新后的完整模型配置数据；未找到时返回 undefined
 */
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

  // mock toggle 只更新 enabled 和 updatedAt，模拟后端的启用/停用接口。
  modelConfigList.splice(targetIndex, 1, updatedModel);
  return Promise.resolve(cloneModelConfig(updatedModel));
}
