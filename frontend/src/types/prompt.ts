export interface PromptTemplateListItem {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  scenario: string | null;
  enabled: boolean;
  contentPreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateDetail extends PromptTemplateListItem {
  content: string;
}

export interface PromptTemplateCreateRequest {
  title: string;
  content: string;
  description?: string | null;
  category?: string | null;
  tags: string[];
  scenario?: string | null;
  enabled: boolean;
}

export type PromptTemplateUpdateRequest = PromptTemplateCreateRequest;

export interface PromptTemplateListResponse {
  items: PromptTemplateListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PromptTemplateListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  enabled?: boolean;
}

export type PromptTemplateFormData = PromptTemplateCreateRequest;
export type PromptDialogMode = 'create' | 'edit';
