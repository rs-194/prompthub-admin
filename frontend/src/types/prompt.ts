// 提示词分类用于筛选下拉框和表格分类文案映射。
export interface PromptCategory {
  label: string;
  value: string;
}

// 列表项表示 service 返回并在表格中展示的一条完整提示词记录。
export interface PromptItem {
  id: number;
  title: string;
  category: string;
  content: string;
  tags: string[];
  usageScene: string;
  updatedAt: string;
}

// 弹窗模式决定表单是新增空表单，还是编辑回填表单。
export type PromptDialogMode = 'create' | 'edit';

// 表单只提交可编辑字段，id 和 updatedAt 由 mock service 或后端生成。
export type PromptFormData = Pick<
  PromptItem,
  'title' | 'category' | 'content' | 'tags' | 'usageScene'
>;
