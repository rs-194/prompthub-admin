// prompt.ts (TypeScript types for prompt management data structures)
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
