import type {
  PromptTemplateCreateRequest,
  PromptTemplateDetail,
  PromptTemplateListItem,
  PromptTemplateListParams,
  PromptTemplateListResponse,
  PromptTemplateUpdateRequest,
} from '@/types/prompt';
import { request, RequestError } from './request';

const PROMPT_TEMPLATE_API_PATH = '/api/v1/prompt-templates';

interface PromptRequestOptions extends Omit<RequestInit, 'body'> {
  body?: object | null;
}

export class PromptApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PromptApiError';
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isPromptTemplateListItem(
  value: unknown,
): value is PromptTemplateListItem {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    isNullableString(value.description) &&
    isNullableString(value.category) &&
    isStringArray(value.tags) &&
    isNullableString(value.scenario) &&
    typeof value.enabled === 'boolean' &&
    typeof value.contentPreview === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isPromptTemplateDetail(value: unknown): value is PromptTemplateDetail {
  return (
    isRecord(value) &&
    isPromptTemplateListItem(value) &&
    typeof value.content === 'string'
  );
}

function isPromptTemplateListResponse(
  value: unknown,
): value is PromptTemplateListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isPromptTemplateListItem) &&
    typeof value.total === 'number' &&
    typeof value.page === 'number' &&
    typeof value.pageSize === 'number'
  );
}

function getPromptErrorMessage(status: number, action: string) {
  if (status === 0) {
    return '网络异常，无法连接后端 Prompt 服务';
  }

  if (status === 404) {
    return 'Prompt 模板不存在或已被删除';
  }

  if (status === 422) {
    return 'Prompt 模板参数不完整，请检查后重试';
  }

  return `${action}失败，请稍后重试`;
}

async function requestPrompt<T>(
  action: string,
  path: string,
  options?: PromptRequestOptions,
): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch (error) {
    if (error instanceof RequestError) {
      throw new PromptApiError(
        getPromptErrorMessage(error.status, action),
        error.status,
      );
    }

    throw error;
  }
}

function buildListPath(params: PromptTemplateListParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 10));

  const keyword = params.keyword?.trim();
  if (keyword) {
    searchParams.set('keyword', keyword);
  }

  const category = params.category?.trim();
  if (category) {
    searchParams.set('category', category);
  }

  if (params.enabled !== undefined) {
    searchParams.set('enabled', String(params.enabled));
  }

  return `${PROMPT_TEMPLATE_API_PATH}?${searchParams.toString()}`;
}

export async function getPromptTemplateList(
  params: PromptTemplateListParams,
): Promise<PromptTemplateListResponse> {
  const data = await requestPrompt<unknown>(
    '加载 Prompt 模板',
    buildListPath(params),
  );
  if (!isPromptTemplateListResponse(data)) {
    throw new PromptApiError('后端返回 Prompt 模板列表结构异常', 200);
  }

  return data;
}

export async function getPromptTemplateDetail(
  id: number,
): Promise<PromptTemplateDetail> {
  const data = await requestPrompt<unknown>(
    '加载 Prompt 模板详情',
    `${PROMPT_TEMPLATE_API_PATH}/${id}`,
  );
  if (!isPromptTemplateDetail(data)) {
    throw new PromptApiError('后端返回 Prompt 模板详情结构异常', 200);
  }

  return data;
}

export async function createPromptTemplate(
  data: PromptTemplateCreateRequest,
): Promise<PromptTemplateDetail> {
  const response = await requestPrompt<unknown>(
    '创建 Prompt 模板',
    PROMPT_TEMPLATE_API_PATH,
    { method: 'POST', body: data },
  );
  if (!isPromptTemplateDetail(response)) {
    throw new PromptApiError('后端返回 Prompt 模板详情结构异常', 200);
  }

  return response;
}

export async function updatePromptTemplate(
  id: number,
  data: PromptTemplateUpdateRequest,
): Promise<PromptTemplateDetail> {
  const response = await requestPrompt<unknown>(
    '更新 Prompt 模板',
    `${PROMPT_TEMPLATE_API_PATH}/${id}`,
    { method: 'PUT', body: data },
  );
  if (!isPromptTemplateDetail(response)) {
    throw new PromptApiError('后端返回 Prompt 模板详情结构异常', 200);
  }

  return response;
}

export async function deletePromptTemplate(id: number): Promise<void> {
  await requestPrompt<unknown>(
    '删除 Prompt 模板',
    `${PROMPT_TEMPLATE_API_PATH}/${id}`,
    { method: 'DELETE' },
  );
}
