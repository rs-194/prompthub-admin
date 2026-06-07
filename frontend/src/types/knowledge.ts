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
