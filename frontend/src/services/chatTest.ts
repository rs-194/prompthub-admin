import { getKnowledgeCategories, getKnowledgeDocumentList } from './knowledge';
import { getModelConfigList } from './model';
import { getPromptList } from './prompt';
import type {
  ChatTestFormData,
  ChatTestKnowledgeOption,
  ChatTestModelOption,
  ChatTestPromptOption,
  ChatTestRecord,
  ChatTestRecordInput,
  ChatTestResult,
} from '@/types/chatTest';

const chatTestRecords: ChatTestRecord[] = [];

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

function getNextRecordId() {
  return Math.max(0, ...chatTestRecords.map((record) => record.id)) + 1;
}

function getNextResultId() {
  return Date.now();
}

function createOutputPreview(output: string) {
  const normalizedOutput = output.trim().replace(/\s+/g, ' ');

  if (normalizedOutput.length <= 60) {
    return normalizedOutput;
  }

  return `${normalizedOutput.slice(0, 60)}...`;
}

function cloneRecord(record: ChatTestRecord): ChatTestRecord {
  return {
    ...record,
    knowledgeTitles: [...record.knowledgeTitles],
  };
}

function buildKnowledgeReferenceText(documents: ChatTestKnowledgeOption[]) {
  if (documents.length === 0) {
    return '';
  }

  return documents
    .map((document, index) => {
      const tagsText = document.tags.length > 0 ? document.tags.join('、') : '无';

      return [
        `${index + 1}. ${document.title}`,
        `分类：${document.categoryLabel}`,
        `来源：${document.sourceName}`,
        `摘要：${document.summary}`,
        `标签：${tagsText}`,
      ].join('\n');
    })
    .join('\n\n');
}

/**
 * 获取调试台可选提示词。
 *
 * 页面初始化时调用，当前优先复用提示词管理模块的 getPromptList()，
 * 将已有 mock 提示词转换为调试台选项；后续接后端时优先替换 getPromptList()
 * 或在这里改为调用后端提供的调试台提示词选项接口。
 *
 * @returns 可用于 Prompt 调试台选择器的提示词选项列表
 */
export async function getChatTestPromptOptions(): Promise<ChatTestPromptOption[]> {
  const prompts = await getPromptList();

  return prompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    category: prompt.category,
    content: prompt.content,
  }));
}

/**
 * 获取调试台可选模型配置。
 *
 * 页面初始化时调用，当前优先复用模型配置模块的 getModelConfigList()，
 * 并只保留 enabled 为 true 的模型配置；provider 字段沿用模型配置模块已有类型。
 * 后续接后端时优先替换 getModelConfigList() 或在这里改为调用调试台模型选项接口。
 *
 * @returns 已启用的模型配置选项列表
 */
export async function getChatTestModelOptions(): Promise<ChatTestModelOption[]> {
  const models = await getModelConfigList();

  return models
    .filter((model) => model.enabled)
    .map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      modelName: model.modelName,
      enabled: model.enabled,
    }));
}

/**
 * 获取调试台可选知识库文档。
 *
 * 页面初始化时调用，当前复用知识库模块已有 getKnowledgeDocumentList()，只读取 enabled 为 true 的文档，
 * 并转换为 Prompt 调试台可展示和组装 mock context 的选项。当前不是 RAG，不做后端请求、
 * embedding、向量库或真实文本切片；这里只是读取知识库 mock 元数据。后续真实 RAG 接入时，
 * 优先替换本函数的数据来源或替换 service 内部上下文组装逻辑。
 *
 * @returns 已启用的知识库 mock context 选项
 */
export async function getChatTestKnowledgeOptions(): Promise<ChatTestKnowledgeOption[]> {
  const [documents, categories] = await Promise.all([
    getKnowledgeDocumentList(),
    getKnowledgeCategories(),
  ]);
  const categoryLabelMap = new Map(
    categories.map((category) => [category.value, category.label]),
  );

  return documents
    .filter((document) => document.enabled)
    .map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      categoryLabel: categoryLabelMap.get(document.category) ?? '未分类',
      sourceName: document.sourceName,
      summary: document.summary,
      tags: [...document.tags],
      chunkCount: document.chunkCount,
      vectorStatus: document.vectorStatus,
      enabled: document.enabled,
    }));
}

/**
 * 运行一次 mock Prompt 测试。
 *
 * 用户点击“运行测试”后由 View 调用，参数包含当前选择的 prompt、model、用户输入和手动选择的知识库文档。
 * 当前不是 RAG，不做后端请求、不调用真实模型 API、不做 embedding、不接向量数据库，也不做真实文本切片；
 * 当前只是把用户手动选择的知识库 summary 等 mock 元数据拼成 mock context。后续真实 RAG / LLM API
 * 接入时，优先替换本函数内部的上下文组装和模型调用逻辑。
 *
 * @param data 本次测试的提示词、模型配置、用户输入和已选知识库 mock context 信息
 * @returns mock 测试结果
 */
export async function runMockPromptTest(data: ChatTestFormData): Promise<ChatTestResult> {
  const [prompts, models] = await Promise.all([
    getChatTestPromptOptions(),
    getChatTestModelOptions(),
  ]);
  const prompt = prompts.find((item) => item.id === data.promptId);
  const model = models.find((item) => item.id === data.modelId);

  if (!prompt || !model || !data.userInput.trim()) {
    throw new Error('请先选择提示词、模型配置并输入测试内容');
  }

  const durationMs = 640 + Math.floor(Math.random() * 420);
  const usedKnowledgeTitles = data.selectedKnowledgeDocs.map((document) => document.title);
  const knowledgeReferenceText = buildKnowledgeReferenceText(data.selectedKnowledgeDocs);
  const output = [
    `【Mock 输出】已使用「${prompt.title}」和模型配置「${model.name}」生成测试结果。`,
    usedKnowledgeTitles.length > 0
      ? `本次参考了知识库 mock context：${usedKnowledgeTitles.join('、')}。这些内容来自手动选择的文档摘要，不是真实检索结果。`
      : '本次未选择知识库文档，按基础 Prompt 测试流程生成 mock 输出。',
    '',
    `用户输入：${data.userInput.trim()}`,
    '',
    ...(knowledgeReferenceText
      ? ['知识库 mock context 摘要：', knowledgeReferenceText, '']
      : []),
    '模拟回答：',
    '根据当前提示词要求，我会围绕输入内容给出结构化回复。这里是前端 mock 结果，用于验证调试台流程、结果展示和测试记录闭环；当前没有调用真实模型 API。',
    '',
    `参考提示词片段：${prompt.content.slice(0, 80)}`,
  ].join('\n');

  return {
    id: getNextResultId(),
    output,
    usedPromptTitle: prompt.title,
    usedModelName: `${model.name} / ${model.modelName}`,
    usedKnowledgeTitles,
    contextPreview: data.contextPreview,
    durationMs,
    createdAt: getCurrentTimeText(),
  };
}

/**
 * 保存一条 mock 测试记录。
 *
 * 运行测试成功后由 View 调用，View 只传入保存记录需要的基础数据、知识库标题和 mock contextPreview；
 * id、createdAt、outputPreview、status 和 knowledgeCount 由 service 统一生成。当前记录只保存在前端内存中，
 * 且知识库信息只是手动选择文档的 mock context 记录，不是真实 RAG 结果。后续接后端时替换为持久化接口。
 *
 * @param data 保存测试记录所需的基础输入、输出和知识库 mock context 信息
 * @returns 保存后的完整测试记录
 */
export function saveChatTestRecord(data: ChatTestRecordInput): Promise<ChatTestRecord> {
  const record: ChatTestRecord = {
    id: getNextRecordId(),
    promptTitle: data.promptTitle,
    modelName: data.modelName,
    userInput: data.userInput,
    outputPreview: createOutputPreview(data.output),
    durationMs: data.durationMs,
    createdAt: getCurrentTimeText(),
    status: 'success',
    knowledgeTitles: [...data.knowledgeTitles],
    knowledgeCount: data.knowledgeTitles.length,
    contextPreview: data.contextPreview,
  };

  chatTestRecords.unshift(record);
  return Promise.resolve(cloneRecord(record));
}

/**
 * 获取最近测试记录。
 *
 * 页面初始化和保存记录后调用，当前读取前端内存 mock 记录并返回浅拷贝，
 * 避免页面直接修改 service 内部数组；后续接后端时替换为测试记录查询接口。
 *
 * @returns 最近测试记录列表
 */
export function getChatTestRecords(): Promise<ChatTestRecord[]> {
  return Promise.resolve(chatTestRecords.map(cloneRecord));
}
