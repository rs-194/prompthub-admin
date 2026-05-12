import { getModelConfigList } from './model';
import { getPromptList } from './prompt';
import type {
  ChatTestFormData,
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
  return { ...record };
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
 * 运行一次 mock Prompt 测试。
 *
 * 用户点击“运行测试”后由 View 调用，参数是当前选择的 promptId、modelId
 * 和用户输入。当前只根据 mock 数据生成模拟输出，不接后端、不调用真实模型 API；
 * 后续接入真实 LLM 时，优先替换本函数内部实现。
 *
 * @param data 本次测试的提示词、模型配置和用户输入
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
  const output = [
    `【Mock 输出】已使用「${prompt.title}」和模型配置「${model.name}」生成测试结果。`,
    '',
    `用户输入：${data.userInput.trim()}`,
    '',
    '模拟回答：',
    `根据当前提示词要求，我会围绕输入内容给出结构化回复。这里是前端 mock 结果，用于验证调试台流程、结果展示和测试记录闭环；当前没有调用真实模型 API。`,
    '',
    `参考提示词片段：${prompt.content.slice(0, 80)}`,
  ].join('\n');

  return {
    id: getNextResultId(),
    output,
    usedPromptTitle: prompt.title,
    usedModelName: `${model.name} / ${model.modelName}`,
    durationMs,
    createdAt: getCurrentTimeText(),
  };
}

/**
 * 保存一条 mock 测试记录。
 *
 * 运行测试成功后由 View 调用，View 只传入保存记录需要的基础数据；
 * id、createdAt、outputPreview 和 status 由 service 统一生成，避免页面拼完整记录。
 * 当前记录只保存在前端内存中，刷新页面会恢复初始状态；后续接后端时替换为持久化接口。
 *
 * @param data 保存测试记录所需的基础输入数据
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
