export interface KnowledgeDocumentResponseBase {
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

export interface KnowledgeDocumentListItem extends KnowledgeDocumentResponseBase {
  matchSnippet?: string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentResponseBase {
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
  searchScope?: KnowledgeSearchScope;
  enabled?: boolean;
}

export type KnowledgeSearchScope = 'basic' | 'fullText';
export type KnowledgeDocumentFormData = KnowledgeDocumentCreateRequest;
export type KnowledgeDialogMode = 'create' | 'edit';
