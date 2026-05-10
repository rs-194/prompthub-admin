import type { PromptCategory, PromptFormData, PromptItem } from '@/types/prompt';

// 当前为 mock 数据，后端待接入。
const promptCategories: PromptCategory[] = [
  { label: '通用助手', value: 'general-assistant' },
  { label: '内容创作', value: 'content-creation' },
  { label: '代码开发', value: 'code-development' },
  { label: '客服回复', value: 'customer-service' },
  { label: '学习总结', value: 'study-summary' },
];

// 当前为 mock 数据，刷新页面后会恢复初始数组；后端待接入。
const promptList: PromptItem[] = [
  {
    id: 1,
    title: '日常任务规划助手',
    category: 'general-assistant',
    content: '请根据用户目标拆解今日任务，输出优先级、预计耗时和下一步行动。',
    tags: ['规划', '效率'],
    usageScene: '个人工作计划与每日待办整理',
    updatedAt: '2026-05-08 09:30',
  },
  {
    id: 2,
    title: '小红书文案生成',
    category: 'content-creation',
    content: '围绕给定主题生成自然、有记忆点的小红书笔记标题、正文和标签。',
    tags: ['文案', '社媒'],
    usageScene: '内容运营与社交媒体发布',
    updatedAt: '2026-05-07 16:20',
  },
  {
    id: 3,
    title: 'Vue 代码审查助手',
    category: 'code-development',
    content: '请从可维护性、类型安全、组件职责和潜在 bug 角度审查 Vue 代码。',
    tags: ['Vue', '代码审查'],
    usageScene: '前端代码 review 与质量检查',
    updatedAt: '2026-05-06 18:10',
  },
  {
    id: 4,
    title: '售后问题安抚回复',
    category: 'customer-service',
    content: '请用友好、负责的语气回复用户售后问题，并给出明确处理步骤。',
    tags: ['客服', '售后'],
    usageScene: '客服工单初步回复',
    updatedAt: '2026-05-05 11:45',
  },
  {
    id: 5,
    title: '课程笔记总结',
    category: 'study-summary',
    content: '请将课程内容整理为知识框架、重点概念、易错点和复习清单。',
    tags: ['学习', '总结'],
    usageScene: '课程学习后的结构化复盘',
    updatedAt: '2026-05-04 20:15',
  },
  {
    id: 6,
    title: '接口联调排查助手',
    category: 'code-development',
    content: '请根据请求参数、响应结果和错误日志，定位接口联调问题并给出排查顺序。',
    tags: ['接口', '调试'],
    usageScene: '前后端接口联调问题排查',
    updatedAt: '2026-05-03 14:05',
  },
];

function getCurrentTimeText() {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date()).replace(/\//g, '-');
}

function getNextPromptId() {
  return Math.max(0, ...promptList.map((prompt) => prompt.id)) + 1;
}

export function getPromptCategories(): Promise<PromptCategory[]> {
  return Promise.resolve([...promptCategories]);
}
//拉取prompt列表
export function getPromptList(): Promise<PromptItem[]> {
  return Promise.resolve(promptList.map((prompt) => ({ ...prompt, tags: [...prompt.tags] })));
}
//创造新的prompt（前端创建后，后期需要同步到后端）
export function createPrompt(data: PromptFormData): Promise<PromptItem> {
  const now = getCurrentTimeText();
  const createdPrompt: PromptItem = {
    ...data,
    tags: [...data.tags],
    id: getNextPromptId(),
    updatedAt: now,
  };

  // mock CRUD 直接操作本地数组，模拟后端新增接口的返回结果。
  promptList.unshift(createdPrompt);
  return Promise.resolve({ ...createdPrompt, tags: [...createdPrompt.tags] });
}
// 更新prompt列表（前端更改后，后期需要同步到后端）
export function updatePrompt(
  id: number,
  data: PromptFormData,
): Promise<PromptItem | undefined> {
  const targetIndex = promptList.findIndex((prompt) => prompt.id === id);

  if (targetIndex === -1) {
    return Promise.resolve(undefined);
  }

  const currentPrompt = promptList[targetIndex];
  if (!currentPrompt) {
    return Promise.resolve(undefined);
  }

  const updatedPrompt: PromptItem = {
    ...currentPrompt,
    ...data,
    tags: [...data.tags],
    updatedAt: getCurrentTimeText(),
  };

  // mock 编辑只更新内存数组中的对应项，刷新页面后不保证持久化。
  promptList.splice(targetIndex, 1, updatedPrompt);
  return Promise.resolve({ ...updatedPrompt, tags: [...updatedPrompt.tags] });
}
//删除prompt（前端删除后，后期需要同步到后端）
export function deletePrompt(id: number): Promise<void> {
  const targetIndex = promptList.findIndex((prompt) => prompt.id === id);

  if (targetIndex !== -1) {
    // mock 删除只移除当前内存数组中的数据，后端接入后会替换为接口请求。
    promptList.splice(targetIndex, 1);
  }

  return Promise.resolve();
}
