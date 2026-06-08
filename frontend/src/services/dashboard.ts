import { request } from './request';
import type {
  DashboardCountSummary,
  DashboardModelConfigSummary,
  DashboardRecentRecord,
  DashboardRecordStatus,
  DashboardSummary,
  DashboardTestRecordSummary,
} from '@/types/dashboard';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDashboardCountSummary(data: unknown): data is DashboardCountSummary {
  if (!isRecord(data)) {
    return false;
  }

  return typeof data.total === 'number' && typeof data.enabled === 'number';
}

function isDashboardRecordStatus(status: unknown): status is DashboardRecordStatus {
  return status === 'success' || status === 'failed' || status === 'stopped';
}

function isDashboardTestRecordSummary(
  data: unknown,
): data is DashboardTestRecordSummary {
  if (!isRecord(data)) {
    return false;
  }

  return (
    typeof data.total === 'number' &&
    typeof data.success === 'number' &&
    typeof data.failed === 'number' &&
    typeof data.stopped === 'number' &&
    (typeof data.latestCreatedAt === 'string' || data.latestCreatedAt === null)
  );
}

function isDashboardModelConfigSummary(
  data: unknown,
): data is DashboardModelConfigSummary {
  if (!isRecord(data)) {
    return false;
  }

  return (
    typeof data.enabled === 'boolean' &&
    typeof data.provider === 'string' &&
    typeof data.model === 'string' &&
    typeof data.apiKeyConfigured === 'boolean'
  );
}

function isDashboardRecentRecord(data: unknown): data is DashboardRecentRecord {
  if (!isRecord(data)) {
    return false;
  }

  return (
    typeof data.id === 'number' &&
    typeof data.promptTitle === 'string' &&
    typeof data.modelName === 'string' &&
    typeof data.outputPreview === 'string' &&
    isDashboardRecordStatus(data.status) &&
    typeof data.durationMs === 'number' &&
    typeof data.createdAt === 'string' &&
    !('output' in data)
  );
}

function isDashboardSummary(data: unknown): data is DashboardSummary {
  if (!isRecord(data) || !Array.isArray(data.recentRecords)) {
    return false;
  }

  return (
    isDashboardCountSummary(data.prompt) &&
    isDashboardCountSummary(data.knowledge) &&
    isDashboardTestRecordSummary(data.testRecord) &&
    isDashboardModelConfigSummary(data.modelConfig) &&
    data.recentRecords.every(isDashboardRecentRecord)
  );
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const data = await request<unknown>('/api/v1/dashboard/summary');

  if (!isDashboardSummary(data)) {
    throw new Error('Invalid dashboard summary response');
  }

  return data;
}
