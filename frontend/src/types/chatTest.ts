import type { ModelProvider } from './model';

export interface ChatTestPromptOption {
  id: number;
  title: string;
  category: string | null;
  contentPreview: string;
}

export interface ChatTestModelOption {
  id: number;
  name: string;
  provider: ModelProvider;
  modelName: string;
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

export interface ChatTestStreamChunkEvent {
  type: 'chunk';
  content: string;
}

export interface ChatTestStreamDoneEvent {
  type: 'done';
  record: TestRecordDetail;
  durationMs: number;
}

export interface ChatTestStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ChatTestStreamEvent =
  | ChatTestStreamChunkEvent
  | ChatTestStreamDoneEvent
  | ChatTestStreamErrorEvent;

export interface ChatTestStreamCallbacks {
  onChunk: (content: string) => void;
  onDone: (record: TestRecordDetail, durationMs: number) => void;
  onError: (message: string) => void;
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
