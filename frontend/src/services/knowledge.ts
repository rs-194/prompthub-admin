import type {
  KnowledgeDocumentCreateRequest,
  KnowledgeDocumentDetail,
  KnowledgeDocumentListItem,
  KnowledgeDocumentListParams,
  KnowledgeDocumentListResponse,
  KnowledgeDocumentResponseBase,
  KnowledgeDocumentUpdateRequest,
} from '@/types/knowledge';
import { request, RequestError } from './request';

const KNOWLEDGE_API_PATH = '/api/v1/knowledge-documents';

interface KnowledgeRequestOptions extends Omit<RequestInit, 'body'> {
  body?: object | null;
}

export class KnowledgeApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'KnowledgeApiError';
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

function isKnowledgeDocumentResponseBase(
  value: unknown,
): value is KnowledgeDocumentResponseBase {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    isNullableString(value.summary) &&
    typeof value.contentPreview === 'string' &&
    isNullableString(value.sourceName) &&
    isStringArray(value.tags) &&
    typeof value.enabled === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isKnowledgeDocumentListItem(
  value: unknown,
): value is KnowledgeDocumentListItem {
  if (!isKnowledgeDocumentResponseBase(value) || !isRecord(value)) {
    return false;
  }

  return (
    value.matchSnippet === undefined ||
    typeof value.matchSnippet === 'string'
  );
}

function isKnowledgeDocumentDetail(
  value: unknown,
): value is KnowledgeDocumentDetail {
  return (
    isRecord(value) &&
    isKnowledgeDocumentResponseBase(value) &&
    typeof value.content === 'string'
  );
}

function isKnowledgeDocumentListResponse(
  value: unknown,
): value is KnowledgeDocumentListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isKnowledgeDocumentListItem) &&
    typeof value.total === 'number' &&
    typeof value.page === 'number' &&
    typeof value.pageSize === 'number'
  );
}

function getKnowledgeErrorMessage(status: number, action: string) {
  if (status === 0) {
    return `网络异常，无法连接后端 Knowledge 服务`;
  }

  if (status === 404) {
    return '知识库文档不存在或已被删除';
  }

  if (status === 422) {
    return '知识库文档参数不完整，请检查后重试';
  }

  return `${action}失败，请稍后重试`;
}

async function requestKnowledge<T>(
  action: string,
  path: string,
  options?: KnowledgeRequestOptions,
): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch (error) {
    if (error instanceof RequestError) {
      throw new KnowledgeApiError(
        getKnowledgeErrorMessage(error.status, action),
        error.status,
      );
    }

    throw error;
  }
}

function buildListPath(params: KnowledgeDocumentListParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 10));

  const keyword = params.keyword?.trim();
  if (keyword) {
    searchParams.set('keyword', keyword);
  }

  searchParams.set('searchScope', params.searchScope ?? 'basic');

  if (params.enabled !== undefined) {
    searchParams.set('enabled', String(params.enabled));
  }

  return `${KNOWLEDGE_API_PATH}?${searchParams.toString()}`;
}

async function fetchKnowledgeDocumentList(
  params: KnowledgeDocumentListParams,
): Promise<KnowledgeDocumentListResponse> {
  const data = await requestKnowledge<unknown>(
    '加载知识库文档',
    buildListPath(params),
  );
  if (!isKnowledgeDocumentListResponse(data)) {
    throw new KnowledgeApiError('后端返回知识库列表结构异常', 200);
  }

  return data;
}

export async function getKnowledgeDocumentList(
  params: KnowledgeDocumentListParams,
): Promise<KnowledgeDocumentListResponse> {
  return fetchKnowledgeDocumentList(params);
}

export async function getKnowledgeDocumentDetail(
  id: number,
): Promise<KnowledgeDocumentDetail> {
  const data = await requestKnowledge<unknown>(
    '加载知识库文档详情',
    `${KNOWLEDGE_API_PATH}/${id}`,
  );
  if (!isKnowledgeDocumentDetail(data)) {
    throw new KnowledgeApiError('后端返回知识库详情结构异常', 200);
  }

  return data;
}

export async function createKnowledgeDocument(
  data: KnowledgeDocumentCreateRequest,
): Promise<KnowledgeDocumentDetail> {
  const response = await requestKnowledge<unknown>(
    '创建知识库文档',
    KNOWLEDGE_API_PATH,
    { method: 'POST', body: data },
  );
  if (!isKnowledgeDocumentDetail(response)) {
    throw new KnowledgeApiError('后端返回知识库详情结构异常', 200);
  }

  return response;
}

export async function updateKnowledgeDocument(
  id: number,
  data: KnowledgeDocumentUpdateRequest,
): Promise<KnowledgeDocumentDetail> {
  const response = await requestKnowledge<unknown>(
    '更新知识库文档',
    `${KNOWLEDGE_API_PATH}/${id}`,
    { method: 'PUT', body: data },
  );
  if (!isKnowledgeDocumentDetail(response)) {
    throw new KnowledgeApiError('后端返回知识库详情结构异常', 200);
  }

  return response;
}

export async function deleteKnowledgeDocument(id: number): Promise<void> {
  await requestKnowledge<unknown>(
    '删除知识库文档',
    `${KNOWLEDGE_API_PATH}/${id}`,
    { method: 'DELETE' },
  );
}
