import type { ModelProvider } from './model';
import type { KnowledgeVectorStatus } from './knowledge';

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

export interface ChatTestKnowledgeOption {
  id: number;
  title: string;
  category: string;
  categoryLabel: string;
  sourceName: string;
  summary: string;
  tags: string[];
  chunkCount: number;
  vectorStatus: KnowledgeVectorStatus;
  enabled: boolean;
}

export type ChatTestOutputFormat = 'text' | 'markdown' | 'json';

export interface ChatTestParams {
  temperature: number;
  maxTokens: number;
  outputFormat: ChatTestOutputFormat;
}

export interface KnowledgeContextPayload {
  titles: string[];
  content: string;
}

export interface ChatTestRunRequest {
  promptTitle: string;
  systemPrompt: string;
  userInput: string;
  modelName: string;
  knowledgeContext: KnowledgeContextPayload;
  params: ChatTestParams;
}

export interface ChatTestFormData {
  promptId: number;
  modelId: number;
  userInput: string;
  knowledgeIds: number[];
  selectedKnowledgeDocs: ChatTestKnowledgeOption[];
  contextPreview: string;
  params: ChatTestParams;
}

export interface ChatTestResult {
  id: number;
  output: string;
  usedPromptTitle: string;
  usedModelName: string;
  usedKnowledgeTitles: string[];
  contextPreview: string;
  durationMs: number;
  createdAt: string;
  params: ChatTestParams;
  paramsSummary: string;
}

export interface ChatTestRecordInput {
  promptTitle: string;
  modelName: string;
  userInput: string;
  output: string;
  durationMs: number;
  knowledgeTitles: string[];
  contextPreview: string;
  params: ChatTestParams;
}

export type ChatTestRecordStatus = 'success' | 'failed' | 'stopped';

export interface TestRecordDetail {
  id: number;
  promptTitle: string;
  modelName: string;
  userInput: string;
  outputPreview: string;
  output: string;
  knowledgeTitles: string[];
  knowledgeCount: number;
  temperature: number;
  maxTokens: number;
  outputFormat: ChatTestOutputFormat;
  durationMs: number;
  status: ChatTestRecordStatus;
  createdAt: string;
}

export interface ChatTestRunResponse {
  output: string;
  record: TestRecordDetail;
  durationMs: number;
}

export interface ChatTestRecord {
  id: number;
  promptTitle: string;
  modelName: string;
  userInput: string;
  outputPreview: string;
  durationMs: number;
  createdAt: string;
  status: ChatTestRecordStatus;
  knowledgeTitles: string[];
  knowledgeCount: number;
  contextPreview: string;
  params: ChatTestParams;
  paramsSummary: string;
}
