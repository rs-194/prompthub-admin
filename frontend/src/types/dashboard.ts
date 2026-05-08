export interface DashboardStatItem {
  label: string;
  value: number;
  unit?: string;
  description?: string;
}

export type DashboardOperationStatus = 'success' | 'warning' | 'info';

export interface DashboardOperationRecord {
  id: number;
  time: string;
  type: string;
  target: string;
  status: DashboardOperationStatus;
  statusText: string;
}

export interface DashboardOverview {
  stats: DashboardStatItem[];
  recentOperations: DashboardOperationRecord[];
}
