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

export interface ChatTestFormData {
  promptId: number;
  modelId: number;
  userInput: string;
  knowledgeIds: number[];
  selectedKnowledgeDocs: ChatTestKnowledgeOption[];
  contextPreview: string;
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
}

export interface ChatTestRecordInput {
  promptTitle: string;
  modelName: string;
  userInput: string;
  output: string;
  durationMs: number;
  knowledgeTitles: string[];
  contextPreview: string;
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
  knowledgeTitles: string[];
  knowledgeCount: number;
  contextPreview: string;
}
