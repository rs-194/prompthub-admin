export interface DashboardStatItem {
  label: string;
  value: number | string;
  unit?: string;
  description?: string;
}

export interface DashboardCountSummary {
  total: number;
  enabled: number;
}

export type DashboardRecordStatus = 'success' | 'failed' | 'stopped';

export interface DashboardTestRecordSummary {
  total: number;
  success: number;
  failed: number;
  stopped: number;
  latestCreatedAt: string | null;
}

export interface DashboardModelConfigSummary {
  enabled: boolean;
  provider: string;
  model: string;
  apiKeyConfigured: boolean;
}

export interface DashboardRecentRecord {
  id: number;
  promptTitle: string;
  modelName: string;
  outputPreview: string;
  status: DashboardRecordStatus;
  durationMs: number;
  createdAt: string;
}

export interface DashboardSummary {
  prompt: DashboardCountSummary;
  knowledge: DashboardCountSummary;
  testRecord: DashboardTestRecordSummary;
  modelConfig: DashboardModelConfigSummary;
  recentRecords: DashboardRecentRecord[];
}
