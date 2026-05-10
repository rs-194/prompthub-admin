export interface PromptCategory {
  label: string;
  value: string;
}

export interface PromptItem {
  id: number;
  title: string;
  category: string;
  content: string;
  tags: string[];
  usageScene: string;
  updatedAt: string;
}

export type PromptDialogMode = 'create' | 'edit';

export type PromptFormData = Pick<
  PromptItem,
  'title' | 'category' | 'content' | 'tags' | 'usageScene'
>;
