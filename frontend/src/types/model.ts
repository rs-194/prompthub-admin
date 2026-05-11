export type ModelProvider = 'openai-compatible' | 'deepseek' | 'custom';

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

export type ModelConfigDialogMode = 'create' | 'edit';
