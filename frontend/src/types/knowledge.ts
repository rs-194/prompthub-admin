export interface KnowledgeCategory {
  label: string;
  value: string;
}

export type KnowledgeStatus = 'enabled' | 'disabled';

export type KnowledgeVectorStatus =
  | 'not_started'
  | 'processing'
  | 'completed'
  | 'failed';

export type KnowledgeSourceType = 'manual' | 'pdf' | 'web' | 'markdown';

export interface KnowledgeDocumentItem {
  id: number;
  title: string;
  category: string;
  sourceType: KnowledgeSourceType;
  sourceName: string;
  summary: string;
  tags: string[];
  chunkCount: number;
  vectorStatus: KnowledgeVectorStatus;
  enabled: boolean;
  updatedAt: string;
}

export type KnowledgeDocumentFormData = Pick<
  KnowledgeDocumentItem,
  | 'title'
  | 'category'
  | 'sourceType'
  | 'sourceName'
  | 'summary'
  | 'tags'
  | 'chunkCount'
  | 'vectorStatus'
  | 'enabled'
>;

export type KnowledgeDialogMode = 'create' | 'edit';
