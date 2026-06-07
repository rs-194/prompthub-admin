import { getModelConfigList } from './model';
import { getPromptList } from './prompt';
import { buildApiUrl, request, RequestError } from './request';
import type {
  ChatTestModelOption,
  ChatTestParams,
  ChatTestPromptOption,
  ChatTestRecord,
  ChatTestRecordInput,
  ChatTestRecordStatus,
  ChatTestRunRequest,
  ChatTestRunResponse,
  ChatTestStreamCallbacks,
  ChatTestStreamEvent,
  TestRecordDetail,
} from '@/types/chatTest';

const chatTestRecords: ChatTestRecord[] = [];
const CHAT_TEST_RUN_API_PATH = '/api/v1/chat-test/run';
const CHAT_TEST_STREAM_API_PATH = '/api/v1/chat-test/stream';
const TEST_RECORDS_API_PATH = '/api/v1/test-records';

export class ChatTestApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ChatTestApiError';
    this.status = status;
  }
}

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
    params: { ...record.params },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOutputFormat(value: unknown): value is ChatTestParams['outputFormat'] {
  return value === 'text' || value === 'markdown' || value === 'json';
}

function isRecordStatus(value: unknown): value is ChatTestRecordStatus {
  return value === 'success' || value === 'failed' || value === 'stopped';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isTestRecordDetail(value: unknown): value is TestRecordDetail {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    typeof value.promptTitle === 'string' &&
    typeof value.modelName === 'string' &&
    typeof value.userInput === 'string' &&
    typeof value.outputPreview === 'string' &&
    typeof value.output === 'string' &&
    isStringArray(value.knowledgeTitles) &&
    typeof value.knowledgeCount === 'number' &&
    typeof value.temperature === 'number' &&
    typeof value.maxTokens === 'number' &&
    isOutputFormat(value.outputFormat) &&
    typeof value.durationMs === 'number' &&
    isRecordStatus(value.status) &&
    typeof value.createdAt === 'string'
  );
}

function isChatTestRunResponse(value: unknown): value is ChatTestRunResponse {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.output === 'string' &&
    isTestRecordDetail(value.record) &&
    typeof value.durationMs === 'number'
  );
}

function isChatTestStreamEvent(value: unknown): value is ChatTestStreamEvent {
  if (!isObject(value) || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'chunk') {
    return typeof value.content === 'string';
  }

  if (value.type === 'done') {
    return isTestRecordDetail(value.record) && typeof value.durationMs === 'number';
  }

  if (value.type === 'error') {
    return typeof value.message === 'string';
  }

  return false;
}

function getRunApiErrorMessage(status: number) {
  const statusMessageMap: Record<number, string> = {
    422: '输入参数不完整或格式不正确，请检查测试内容后重试',
    502: '模型服务暂时不可用，请稍后重试',
    503: '后端 LLM 环境变量未配置完整，请先配置后端服务',
    504: '模型调用超时，请稍后重试或缩短输入内容',
  };

  return statusMessageMap[status] ?? '运行测试失败，请稍后重试';
}

export function getChatTestApiErrorMessage(error: unknown) {
  if (error instanceof ChatTestApiError) {
    return error.message;
  }

  return '运行测试失败，请检查网络或稍后重试';
}

function getTestRecordDetailErrorMessage(status: number) {
  const statusMessageMap: Record<number, string> = {
    0: '网络异常，无法连接后端测试记录服务',
    404: '测试记录不存在或已被删除',
  };

  return statusMessageMap[status] ?? '获取测试记录详情失败，请稍后重试';
}

export function getTestRecordDetailApiErrorMessage(error: unknown) {
  if (error instanceof ChatTestApiError) {
    return error.message;
  }

  return '获取测试记录详情失败，请检查网络或稍后重试';
}

export async function getTestRecordDetail(id: number): Promise<TestRecordDetail> {
  let responseData: TestRecordDetail;

  try {
    responseData = await request<TestRecordDetail>(`${TEST_RECORDS_API_PATH}/${id}`);
  } catch (error) {
    if (error instanceof RequestError) {
      throw new ChatTestApiError(getTestRecordDetailErrorMessage(error.status), error.status);
    }

    throw error;
  }

  if (!isTestRecordDetail(responseData)) {
    throw new ChatTestApiError('后端返回测试记录详情结构异常，请稍后重试', 200);
  }

  return responseData;
}

export function mapTestRecordDetailToRecord(record: TestRecordDetail): ChatTestRecord {
  const params: ChatTestParams = {
    temperature: record.temperature,
    maxTokens: record.maxTokens,
    outputFormat: record.outputFormat,
  };

  return {
    id: record.id,
    promptTitle: record.promptTitle,
    modelName: record.modelName,
    userInput: record.userInput,
    outputPreview: record.outputPreview,
    durationMs: record.durationMs,
    createdAt: record.createdAt,
    status: record.status,
    knowledgeTitles: [...record.knowledgeTitles],
    knowledgeCount: record.knowledgeCount,
    contextPreview: '',
    params,
    paramsSummary: buildParamsSummary(params),
  };
}

function getOutputFormatLabel(outputFormat: ChatTestParams['outputFormat']) {
  const labelMap: Record<ChatTestParams['outputFormat'], string> = {
    text: 'Text',
    markdown: 'Markdown',
    json: 'JSON',
  };

  return labelMap[outputFormat];
}

/**
 * 生成测试参数摘要。
 *
 * 保存测试记录和展示结果时调用，参数是当前用户在调试台设置的 mock 参数；
 * 返回值是短文本摘要，避免记录表过宽。当前只用于展示和记录，不代表真实 temperature 采样、
 * maxTokens 截断或模型严格遵循输出格式。后续接真实 LLM API 时，可保留该展示函数，
 * 但参数真实生效逻辑应由后端模型调用或流式接口实现。
 *
 * @param params 当前 Prompt 调试台 mock 测试参数
 * @returns 简短参数摘要文本
 */
export function buildParamsSummary(params: ChatTestParams): string {
  return `T=${params.temperature.toFixed(1)} / ${params.maxTokens} tokens / ${getOutputFormatLabel(params.outputFormat)}`;
}

/**
 * 调用后端真实 LLM 非流式 run 接口。
 *
 * 本函数是 Phase 2.4 的真实运行入口，只负责请求 `/api/v1/chat-test/run` 并校验返回结构；
 * Prompt / Model / Knowledge 仍来自前端现有配置源，API Key 和真实模型地址只存在于后端。
 * 当前不是 stream / SSE，不做逐字输出，也不支持前端停止已发出的非流式请求。
 *
 * @param payload 本次 ChatTest 运行请求体
 * @returns 后端返回的完整 output、TestRecord detail 和耗时
 */
export async function runPromptTestApi(
  payload: ChatTestRunRequest,
): Promise<ChatTestRunResponse> {
  let responseData: ChatTestRunResponse;

  try {
    responseData = await request<ChatTestRunResponse>(CHAT_TEST_RUN_API_PATH, {
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 0) {
        throw new ChatTestApiError('网络异常，无法连接后端 ChatTest 服务', 0);
      }

      throw new ChatTestApiError(getRunApiErrorMessage(error.status), error.status);
    }

    throw error;
  }

  if (!isChatTestRunResponse(responseData)) {
    throw new ChatTestApiError('后端返回结构异常，请稍后重试', 200);
  }

  return responseData;
}

function dispatchStreamEvent(
  event: ChatTestStreamEvent,
  callbacks: ChatTestStreamCallbacks,
) {
  if (event.type === 'chunk') {
    callbacks.onChunk(event.content);
    return;
  }

  if (event.type === 'done') {
    callbacks.onDone(event.record, event.durationMs);
    return;
  }

  callbacks.onError(event.message);
}

function parseStreamLine(line: string): ChatTestStreamEvent | null {
  const normalizedLine = line.trim();
  if (!normalizedLine) {
    return null;
  }

  const parsed = JSON.parse(normalizedLine) as unknown;
  if (!isChatTestStreamEvent(parsed)) {
    throw new ChatTestApiError('流式响应格式异常，请稍后重试', 200);
  }

  return parsed;
}

function processStreamBuffer(
  buffer: string,
  callbacks: ChatTestStreamCallbacks,
) {
  const lines = buffer.split('\n');
  const remainingBuffer = lines.pop() ?? '';

  for (const line of lines) {
    const event = parseStreamLine(line);
    if (event) {
      dispatchStreamEvent(event, callbacks);
    }
  }

  return remainingBuffer;
}

/**
 * 调用后端真实 LLM 流式接口。
 *
 * Phase 2.5 使用 fetch stream + FastAPI StreamingResponse + NDJSON，
 * 不是原生 EventSource SSE。函数按行解析后端返回的 NDJSON，逐段分发 chunk，
 * 正常完成时接收后端保存后的 TestRecord；AbortSignal 用于停止生成和组件卸载清理。
 *
 * @param payload 本次 ChatTest 运行请求体
 * @param callbacks 流式事件回调
 * @param abortSignal 当前请求的取消信号
 * @returns 流式读取完成后的空结果
 */
export async function runPromptTestStreamApi(
  payload: ChatTestRunRequest,
  callbacks: ChatTestStreamCallbacks,
  abortSignal: AbortSignal,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(CHAT_TEST_STREAM_API_PATH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: abortSignal,
    });
  } catch (error) {
    if (abortSignal.aborted) {
      throw error;
    }

    throw new ChatTestApiError('网络异常，无法连接后端 ChatTest 流式服务', 0);
  }

  if (!response.ok) {
    throw new ChatTestApiError(getRunApiErrorMessage(response.status), response.status);
  }

  if (!response.body) {
    throw new ChatTestApiError('当前响应不支持流式读取，请稍后重试', response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = processStreamBuffer(buffer, callbacks);
    }

    buffer += decoder.decode();
    const lastEvent = parseStreamLine(buffer);
    if (lastEvent) {
      dispatchStreamEvent(lastEvent, callbacks);
    }
  } catch (error) {
    if (abortSignal.aborted) {
      throw error;
    }

    if (error instanceof ChatTestApiError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new ChatTestApiError('流式响应 JSON 解析失败，请稍后重试', response.status);
    }

    throw new ChatTestApiError('流式读取失败，请检查网络或稍后重试', response.status);
  } finally {
    reader.releaseLock();
  }
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
 * 保存一条 mock 测试记录。
 *
 * 运行测试完整结束后由 View 调用，View 只传入保存记录需要的基础数据、知识库标题、mock contextPreview 和参数；
 * id、createdAt、outputPreview、status、knowledgeCount 和 paramsSummary 由 service 统一生成。当前记录只保存在前端内存中，
 * 且知识库信息只是手动选择文档的 mock context 记录，参数也只用于展示，不是真实 RAG 或真实模型调用结果。
 * 后续接后端时替换为持久化接口，停止生成的中途内容不应作为成功记录保存。
 *
 * @param data 保存测试记录所需的基础输入、输出、知识库 mock context 和参数信息
 * @returns 保存后的完整测试记录
 */
export function saveChatTestRecord(data: ChatTestRecordInput): Promise<ChatTestRecord> {
  const paramsSummary = buildParamsSummary(data.params);
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
    params: { ...data.params },
    paramsSummary,
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
