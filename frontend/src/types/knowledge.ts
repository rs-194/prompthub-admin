export interface KnowledgeDocumentListItem {
  id: number;
  title: string;
  summary: string | null;
  contentPreview: string;
  sourceName: string | null;
  tags: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentListItem {
  content: string;
}

export interface KnowledgeDocumentCreateRequest {
  title: string;
  content: string;
  summary?: string | null;
  sourceName?: string | null;
  tags: string[];
  enabled: boolean;
}

export type KnowledgeDocumentUpdateRequest = KnowledgeDocumentCreateRequest;

export interface KnowledgeDocumentListResponse {
  items: KnowledgeDocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface KnowledgeDocumentListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  enabled?: boolean;
}

export type KnowledgeDocumentFormData = KnowledgeDocumentCreateRequest;
export type KnowledgeDialogMode = 'create' | 'edit';

// Legacy types remain exported for the older mock helper functions in chatTest.ts.
// Phase 2.9 ChatTest no longer uses these fields as its knowledge source.
export interface KnowledgeCategory {
  label: string;
  value: string;
}

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
