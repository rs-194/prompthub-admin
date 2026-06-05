// 供应商枚举用于限制列表筛选、表单选择和 service 数据的可选范围。
export type ModelProvider = 'openai-compatible' | 'deepseek' | 'custom';

// 列表项表示页面展示的一条完整模型配置；当前不包含真实 API Key 字段。
export interface ModelConfigItem {
  id: number;
  name: string;
  provider: ModelProvider;
  baseUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  remark: string;
  updatedAt: string;
}

// 表单只提交可编辑配置项，id 和 updatedAt 由 mock service 或后端生成。
// 本阶段刻意不实现 API Key 管理，后续应由后端负责安全保存或密钥托管。
export type ModelConfigFormData = Pick<
  ModelConfigItem,
  | 'name'
  | 'provider'
  | 'baseUrl'
  | 'modelName'
  | 'temperature'
  | 'maxTokens'
  | 'enabled'
  | 'remark'
>;

// 弹窗模式决定表单是新增默认值，还是编辑回填已有配置。
export type ModelConfigDialogMode = 'create' | 'edit';

export interface BackendModelConfigStatus {
  provider: string;
  model: string;
  baseUrlHost: string;
  enabled: boolean;
  apiKeyConfigured: boolean;
  temperature: number;
  maxTokens: number;
  timeoutSeconds: number;
}
