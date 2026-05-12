import type { ModelProvider } from './model';

export interface ChatTestPromptOption {
  id: number;
  title: string;
  category: string;
  content: string;
}

export interface ChatTestModelOption {
  id: number;
  name: string;
  provider: ModelProvider;
  modelName: string;
  enabled: boolean;
}

export interface ChatTestFormData {
  promptId: number;
  modelId: number;
  userInput: string;
}

export interface ChatTestResult {
  id: number;
  output: string;
  usedPromptTitle: string;
  usedModelName: string;
  durationMs: number;
  createdAt: string;
}

export interface ChatTestRecordInput {
  promptTitle: string;
  modelName: string;
  userInput: string;
  output: string;
  durationMs: number;
}

export type ChatTestRecordStatus = 'success' | 'failed';

export interface ChatTestRecord {
  id: number;
  promptTitle: string;
  modelName: string;
  userInput: string;
  outputPreview: string;
  durationMs: number;
  createdAt: string;
  status: ChatTestRecordStatus;
}
