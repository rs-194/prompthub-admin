// dashboard.ts(service for dashboard data fetching and processing)
import type { DashboardOverview } from '@/types/dashboard';

// 当前为 mock 数据，后端待接入；后续可替换为真实 Dashboard 概览接口。
const dashboardOverview: DashboardOverview = {
  stats: [
    {
      label: '提示词数量',
      value: 24,
      unit: '个',
      description: '当前已维护的提示词总量',
    },
    {
      label: '知识库文档',
      value: 8,
      unit: '篇',
      description: '当前已整理的知识库文档',
    },
    {
      label: '已配置模型',
      value: 3,
      unit: '个',
      description: '当前可用于测试的模型配置',
    },
    {
      label: '今日测试次数',
      value: 16,
      unit: '次',
      description: '今日对话测试调用记录',
    },
  ],
  recentOperations: [
    {
      id: 1,
      time: '2026-05-08 14:20',
      type: '新增提示词',
      target: '客服回复优化',
      status: 'success',
      statusText: '成功',
    },
    {
      id: 2,
      time: '2026-05-08 13:45',
      type: '上传文档',
      target: '产品说明知识库',
      status: 'success',
      statusText: '成功',
    },
    {
      id: 3,
      time: '2026-05-08 11:10',
      type: '模型配置',
      target: 'GPT 测试模型',
      status: 'warning',
      statusText: '待验证',
    },
    {
      id: 4,
      time: '2026-05-08 09:35',
      type: '对话测试',
      target: '提示词效果检查',
      status: 'info',
      statusText: '已记录',
    },
  ],
};
// 当前使用本地 mock 数据模拟接口返回；后续接入后端后，只替换 getDashboardOverview 内部实现。
export function getDashboardOverview(): Promise<DashboardOverview> {
  return Promise.resolve(dashboardOverview);
}
