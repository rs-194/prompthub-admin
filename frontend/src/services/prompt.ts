import type { PromptCategory, PromptFormData, PromptItem } from '@/types/prompt';

// 当前分类来自前端 mock 数据，后端接入后会替换为真实分类接口。
const promptCategories: PromptCategory[] = [
  { label: '通用助手', value: 'general-assistant' },
  { label: '内容创作', value: 'content-creation' },
  { label: '代码开发', value: 'code-development' },
  { label: '客服回复', value: 'customer-service' },
  { label: '学习总结', value: 'study-summary' },
];

// 当前为前端 mock 数据，刷新页面后会恢复初始数组；后端待接入，尚不做持久化。
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

/**
 * 生成 mock 提示词数据的更新时间文本。
 *
 * 当前 mock service 用本地时间模拟后端返回的 updatedAt 字段；
 * 刷新页面后 mock 数据会恢复初始值，不会持久化该时间。
 *
 * @returns 格式化后的当前时间字符串
 */
function getCurrentTimeText() {
  // mock CRUD 用本地时间模拟后端返回的 updatedAt。
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

/**
 * 生成下一条提示词 mock 数据的 id。
 *
 * 当前根据内存数组中的最大 id 加 1，模拟后端创建数据时生成主键；
 * 后续接入后端后，这个逻辑会替换为接口返回的真实 id。
 *
 * @returns 下一条提示词可使用的 mock id
 */
function getNextPromptId() {
  // mock 新增时用当前最大 id + 1 模拟后端生成主键。
  return Math.max(0, ...promptList.map((prompt) => prompt.id)) + 1;
}

/**
 * 获取提示词分类 mock 列表。
 *
 * 当前从前端内存数组读取分类数据，刷新页面后会恢复初始 mock 数据；
 * 后续接入后端时，这里会替换为分类查询接口。
 *
 * @returns 提示词分类列表的浅拷贝
 */
export function getPromptCategories(): Promise<PromptCategory[]> {
  // 返回浅拷贝，避免页面直接持有并修改 service 内部分类数组。
  return Promise.resolve([...promptCategories]);
}

/**
 * 获取提示词 mock 列表。
 *
 * 当前读取前端内存数组，新增、编辑、删除只在运行期间生效，
 * 刷新页面后会恢复初始 mock 数据。返回列表项和 tags 的浅拷贝，
 * 是为了避免页面层直接修改 service 内部 mock 数据源。
 * 后续接入后端时，这里会替换为列表查询接口。
 *
 * @returns 提示词列表数据的浅拷贝
 */
export function getPromptList(): Promise<PromptItem[]> {
  // 列表项和 tags 都做浅拷贝，避免页面直接修改 service 内部 mock 数组。
  return Promise.resolve(promptList.map((prompt) => ({ ...prompt, tags: [...prompt.tags] })));
}

/**
 * 创建一条新的提示词 mock 数据。
 *
 * 当前只写入前端内存数组，刷新页面后会恢复初始 mock 数据；
 * 后续接入后端时，这里会替换为 POST 请求。
 *
 * @param data 表单提交的提示词数据，不包含 id 和 updatedAt
 * @returns 创建后的完整提示词数据
 */
export function createPrompt(data: PromptFormData): Promise<PromptItem> {
  const now = getCurrentTimeText();
  const createdPrompt: PromptItem = {
    ...data,
    tags: [...data.tags],
    id: getNextPromptId(),
    updatedAt: now,
  };

  // mock 新增直接写入本地数组，id 和 updatedAt 在这里模拟后端生成。
  promptList.unshift(createdPrompt);
  return Promise.resolve({ ...createdPrompt, tags: [...createdPrompt.tags] });
}

/**
 * 更新一条已有提示词 mock 数据。
 *
 * 当前根据 id 在前端内存数组中查找并替换对应项，同时刷新 updatedAt；
 * 刷新页面后修改不会持久化。后续接入后端时，这里会替换为 PUT/PATCH 请求。
 *
 * @param id 要更新的提示词 id
 * @param data 编辑弹窗提交的提示词表单数据
 * @returns 更新后的完整提示词数据；未找到时返回 undefined
 */
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

  // mock 编辑只更新内存数组中的对应项，并刷新 updatedAt；后端接入后替换为接口请求。
  promptList.splice(targetIndex, 1, updatedPrompt);
  return Promise.resolve({ ...updatedPrompt, tags: [...updatedPrompt.tags] });
}

/**
 * 删除一条提示词 mock 数据。
 *
 * 当前只从前端内存数组移除对应项，刷新页面后会恢复初始 mock 数据；
 * 后续接入后端时，这里会替换为 DELETE 请求。
 *
 * @param id 要删除的提示词 id
 * @returns 删除操作完成后的空结果
 */
export function deletePrompt(id: number): Promise<void> {
  const targetIndex = promptList.findIndex((prompt) => prompt.id === id);

  if (targetIndex !== -1) {
    // mock 删除只移除当前内存数组中的数据，后端接入后会替换为接口请求。
    promptList.splice(targetIndex, 1);
  }

  return Promise.resolve();
}
