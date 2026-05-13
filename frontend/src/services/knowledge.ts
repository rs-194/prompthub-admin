import type {
  KnowledgeCategory,
  KnowledgeDocumentFormData,
  KnowledgeDocumentItem,
} from '@/types/knowledge';

const knowledgeCategories: KnowledgeCategory[] = [
  { label: '产品文档', value: 'product' },
  { label: '技术文档', value: 'technical' },
  { label: '运营知识', value: 'operation' },
  { label: '客服问答', value: 'support' },
];

// 当前为前端 mock 数据：不真实上传文件、不真实解析文件、不真实切片、不调用 embedding、不接向量数据库。
const knowledgeDocumentList: KnowledgeDocumentItem[] = [
  {
    id: 1,
    title: 'PromptHub 产品介绍',
    category: 'product',
    sourceType: 'manual',
    sourceName: '手工录入 / 产品说明',
    summary:
      '介绍 PromptHub Admin 的模块定位、提示词管理、模型配置和后续知识库能力规划。',
    tags: ['产品', '后台', 'PromptHub'],
    chunkCount: 8,
    vectorStatus: 'completed',
    enabled: true,
    updatedAt: '2026-05-10 10:20',
  },
  {
    id: 2,
    title: 'RAG 接入预研笔记',
    category: 'technical',
    sourceType: 'markdown',
    sourceName: 'rag-research.md',
    summary:
      '整理后续接入文档上传、文本切片、embedding 和向量检索时需要考虑的技术边界。',
    tags: ['RAG', 'embedding', '向量检索'],
    chunkCount: 15,
    vectorStatus: 'processing',
    enabled: true,
    updatedAt: '2026-05-11 15:45',
  },
  {
    id: 3,
    title: '客服常见问题草稿',
    category: 'support',
    sourceType: 'pdf',
    sourceName: 'faq-draft.pdf',
    summary:
      '模拟客服 FAQ 文档元数据，用于验证知识库文档列表、摘要查看和启用停用流程。',
    tags: ['FAQ', '客服', 'mock'],
    chunkCount: 0,
    vectorStatus: 'not_started',
    enabled: false,
    updatedAt: '2026-05-12 09:30',
  },
  {
    id: 4,
    title: '运营活动规则说明',
    category: 'operation',
    sourceType: 'web',
    sourceName: 'https://example.com/operation/rules',
    summary:
      '用于演示网页来源类型的知识库记录，当前仅维护来源名称和摘要，不抓取真实网页内容。',
    tags: ['运营', '活动规则'],
    chunkCount: 6,
    vectorStatus: 'failed',
    enabled: true,
    updatedAt: '2026-05-12 17:05',
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

function getNextKnowledgeDocumentId() {
  return Math.max(0, ...knowledgeDocumentList.map((document) => document.id)) + 1;
}

function cloneKnowledgeDocument(
  document: KnowledgeDocumentItem,
): KnowledgeDocumentItem {
  return {
    ...document,
    tags: [...document.tags],
  };
}

/**
 * 获取知识库分类 mock 列表。
 *
 * 页面初始化加载筛选项时调用，返回分类对象的浅拷贝，避免页面直接修改 service 内部数组。
 * 当前分类只服务于前端 mock 筛选；后续接后端时，这里优先替换为分类查询接口。
 *
 * @returns 知识库分类列表的浅拷贝
 */
export function getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  return Promise.resolve(
    knowledgeCategories.map((category) => ({ ...category })),
  );
}

/**
 * 获取知识库文档 mock 列表。
 *
 * 页面初始化和 CRUD 操作后调用。当前只读取前端内存数组，不接后端、不真实上传、
 * 不真实切片、不做 embedding，也不接向量数据库。返回对象和 tags 数组的拷贝，
 * 避免 View 直接修改 service 内部 mock 数据。后续接后端时，这里替换为列表查询接口。
 *
 * @returns 知识库文档列表的拷贝
 */
export function getKnowledgeDocumentList(): Promise<KnowledgeDocumentItem[]> {
  return Promise.resolve(knowledgeDocumentList.map(cloneKnowledgeDocument));
}

/**
 * 创建知识库文档 mock 记录。
 *
 * 用户在新增弹窗提交时调用。当前只把表单元数据写入前端内存数组，由 service 模拟生成
 * id 和 updatedAt；不上传文件、不解析文件、不切片、不向量化。后续接后端时，这里替换为
 * 创建文档记录或上传后的创建接口。
 *
 * @param data 新增弹窗提交的知识库文档元数据，不包含 id 和 updatedAt
 * @returns 创建后的完整知识库文档记录拷贝
 */
export function createKnowledgeDocument(
  data: KnowledgeDocumentFormData,
): Promise<KnowledgeDocumentItem> {
  const createdDocument: KnowledgeDocumentItem = {
    ...data,
    tags: [...data.tags],
    id: getNextKnowledgeDocumentId(),
    updatedAt: getCurrentTimeText(),
  };

  knowledgeDocumentList.unshift(createdDocument);
  return Promise.resolve(cloneKnowledgeDocument(createdDocument));
}

/**
 * 更新知识库文档 mock 记录。
 *
 * 用户在编辑弹窗提交时调用。当前根据 id 更新前端内存数组中的元数据，并刷新 updatedAt；
 * 不重新上传文件、不重新解析、不重新切片、不重新向量化。后续接后端时，这里替换为
 * 文档元数据更新接口。
 *
 * @param id 要更新的知识库文档 id
 * @param data 编辑弹窗提交的知识库文档元数据
 * @returns 更新后的完整知识库文档记录拷贝；未找到时返回 undefined
 */
export function updateKnowledgeDocument(
  id: number,
  data: KnowledgeDocumentFormData,
): Promise<KnowledgeDocumentItem | undefined> {
  const targetIndex = knowledgeDocumentList.findIndex(
    (document) => document.id === id,
  );

  if (targetIndex === -1) {
    return Promise.resolve(undefined);
  }

  const currentDocument = knowledgeDocumentList[targetIndex];
  if (!currentDocument) {
    return Promise.resolve(undefined);
  }

  const updatedDocument: KnowledgeDocumentItem = {
    ...currentDocument,
    ...data,
    tags: [...data.tags],
    updatedAt: getCurrentTimeText(),
  };

  knowledgeDocumentList.splice(targetIndex, 1, updatedDocument);
  return Promise.resolve(cloneKnowledgeDocument(updatedDocument));
}

/**
 * 删除知识库文档 mock 记录。
 *
 * 用户确认删除时调用。当前只从前端内存数组中移除对应记录，刷新页面后会恢复初始 mock 数据；
 * 不删除真实文件、不删除真实向量。后续接后端和向量库后，这里需要替换为删除文档记录、
 * 文件资源和向量索引的接口调用链。
 *
 * @param id 要删除的知识库文档 id
 * @returns 删除完成后的空结果
 */
export function deleteKnowledgeDocument(id: number): Promise<void> {
  const targetIndex = knowledgeDocumentList.findIndex(
    (document) => document.id === id,
  );

  if (targetIndex !== -1) {
    knowledgeDocumentList.splice(targetIndex, 1);
  }

  return Promise.resolve();
}

/**
 * 切换知识库文档启用状态。
 *
 * 用户在列表中切换启用 / 停用开关时调用。当前只更新 enabled 和 updatedAt，
 * 不触发真实检索索引变更、不调用向量数据库，也不联动 Prompt 调试台。后续接后端和 RAG 后，
 * 这里可替换为启用 / 停用文档检索状态的接口。
 *
 * @param id 要切换状态的知识库文档 id
 * @param enabled 目标启用状态，true 表示启用，false 表示停用
 * @returns 更新后的完整知识库文档记录拷贝；未找到时返回 undefined
 */
export function toggleKnowledgeDocumentEnabled(
  id: number,
  enabled: boolean,
): Promise<KnowledgeDocumentItem | undefined> {
  const targetIndex = knowledgeDocumentList.findIndex(
    (document) => document.id === id,
  );

  if (targetIndex === -1) {
    return Promise.resolve(undefined);
  }

  const currentDocument = knowledgeDocumentList[targetIndex];
  if (!currentDocument) {
    return Promise.resolve(undefined);
  }

  const updatedDocument: KnowledgeDocumentItem = {
    ...currentDocument,
    enabled,
    updatedAt: getCurrentTimeText(),
  };

  knowledgeDocumentList.splice(targetIndex, 1, updatedDocument);
  return Promise.resolve(cloneKnowledgeDocument(updatedDocument));
}
