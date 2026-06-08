// DashboardView.vue
<template>
  <div class="page-card">
    <div class="dashboard-hero">
      <div>
        <p class="dashboard-hero__eyebrow">PromptHub Admin</p>
        <h1>AI Prompt 调试与记录管理平台</h1>
        <p>
          Prompt / Knowledge / ModelConfig → ChatTest → TestRecord，
          首页展示当前真实主链路的运行概览。
        </p>
      </div>
      <el-button type="primary" plain @click="goChatTest">前往 ChatTest</el-button>
    </div>

    <el-alert
      v-if="errorMessage"
      class="dashboard-alert"
      title="首页统计加载失败，不影响其他功能使用"
      :description="errorMessage"
      type="warning"
      show-icon
      :closable="false"
    />

    <div class="dashboard-stats" :class="{ 'dashboard-stats--loading': loading }">
      <StatCard
        v-for="item in stats"
        :key="item.label"
        :item="item"
      />
    </div>

    <div class="dashboard-main">
      <section class="dashboard-section dashboard-section--records">
        <div class="dashboard-section__header">
          <div>
            <h2>最近测试记录</h2>
            <p>按创建时间倒序展示最近 5 条记录，仅显示 outputPreview。</p>
          </div>
        </div>

        <el-table
          v-if="recentRecords.length > 0"
          :data="recentRecords"
          stripe
        >
          <el-table-column prop="promptTitle" label="Prompt" min-width="150" />
          <el-table-column label="状态" width="96">
            <template #default="{ row }">
              <el-tag :type="getRecordStatusTagType(row.status)" effect="light">
                {{ getRecordStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="modelName" label="模型" min-width="140" />
          <el-table-column label="耗时" width="96">
            <template #default="{ row }">{{ formatDuration(row.durationMs) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="170">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="outputPreview" label="输出预览" min-width="220" />
        </el-table>

        <div v-else-if="loading" class="dashboard-loading">
          正在加载首页统计...
        </div>

        <el-empty
          v-else
          description="暂无测试记录，前往 ChatTest 运行一次调试。"
        >
          <el-button type="primary" plain @click="goChatTest">去调试</el-button>
        </el-empty>
      </section>

      <aside class="dashboard-side">
        <section class="dashboard-section">
          <div class="dashboard-section__header">
            <div>
              <h2>主链路</h2>
              <p>从素材到调试，再到复盘。</p>
            </div>
          </div>
          <div class="chain-steps">
            <span>Prompt 模板</span>
            <span>Knowledge 上下文</span>
            <span>真实流式调试</span>
            <span>TestRecord 复盘</span>
          </div>
        </section>

        <section class="dashboard-section">
          <div class="dashboard-section__header">
            <div>
              <h2>当前边界</h2>
              <p>保持展示入口简洁，不扩展新业务。</p>
            </div>
          </div>
          <ul class="boundary-list">
            <li>Knowledge 当前是手动上下文，不是完整 RAG。</li>
            <li>API Key 只由后端托管，不进入前端。</li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getDashboardSummary } from '@/services/dashboard';
import type {
  DashboardRecentRecord,
  DashboardRecordStatus,
  DashboardStatItem,
  DashboardSummary,
} from '@/types/dashboard';
import StatCard from './components/StatCard.vue';

const router = useRouter();
const summary = ref<DashboardSummary | null>(null);
const loading = ref(false);
const errorMessage = ref('');

const fallbackStats: DashboardStatItem[] = [
  {
    label: 'Prompt 模板',
    value: 0,
    unit: '个',
    description: '启用 0 个',
  },
  {
    label: 'Knowledge 文档',
    value: 0,
    unit: '篇',
    description: '启用 0 篇',
  },
  {
    label: 'TestRecord',
    value: 0,
    unit: '条',
    description: '成功 0 条',
  },
  {
    label: 'ModelConfig',
    value: 'Not ready',
    description: '后端配置未加载',
  },
];

const stats = computed<DashboardStatItem[]>(() => {
  if (!summary.value) {
    return fallbackStats;
  }

  return [
    {
      label: 'Prompt 模板',
      value: summary.value.prompt.total,
      unit: '个',
      description: `启用 ${summary.value.prompt.enabled} 个`,
    },
    {
      label: 'Knowledge 文档',
      value: summary.value.knowledge.total,
      unit: '篇',
      description: `启用 ${summary.value.knowledge.enabled} 篇`,
    },
    {
      label: 'TestRecord',
      value: summary.value.testRecord.total,
      unit: '条',
      description: `成功 ${summary.value.testRecord.success} 条，失败 ${summary.value.testRecord.failed} 条`,
    },
    {
      label: 'ModelConfig',
      value: summary.value.modelConfig.enabled ? 'Ready' : 'Not ready',
      description: `${summary.value.modelConfig.provider || '未识别 provider'} / ${summary.value.modelConfig.model || '未配置 model'}`,
    },
  ];
});

const recentRecords = computed<DashboardRecentRecord[]>(() => (
  summary.value?.recentRecords ?? []
));

function getRecordStatusText(status: DashboardRecordStatus) {
  const statusMap: Record<DashboardRecordStatus, string> = {
    success: '成功',
    failed: '失败',
    stopped: '停止',
  };

  return statusMap[status];
}

function getRecordStatusTagType(status: DashboardRecordStatus) {
  const typeMap: Record<DashboardRecordStatus, 'success' | 'danger' | 'warning'> = {
    success: 'success',
    failed: 'danger',
    stopped: 'warning',
  };

  return typeMap[status];
}

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).replace(/\//g, '-');
}

async function loadSummary() {
  loading.value = true;
  errorMessage.value = '';

  try {
    summary.value = await getDashboardSummary();
  } catch (error) {
    summary.value = null;
    errorMessage.value = error instanceof Error ? error.message : 'Dashboard summary request failed';
  } finally {
    loading.value = false;
  }
}

function goChatTest() {
  router.push('/chat-test');
}

onMounted(async () => {
  await loadSummary();
});
</script>

<style scoped>
.dashboard-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  padding: 22px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #f8fafc;
}

.dashboard-hero h1 {
  margin: 4px 0 10px;
}

.dashboard-hero p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.dashboard-hero__eyebrow {
  color: #409eff;
  font-weight: 600;
}

.dashboard-alert {
  margin-bottom: 16px;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  min-height: 130px;
}

.dashboard-stats--loading {
  opacity: 0.72;
}

.dashboard-loading {
  padding: 42px 0;
  color: #909399;
  font-size: 14px;
  text-align: center;
}

.dashboard-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
}

.dashboard-side {
  display: grid;
  gap: 20px;
  align-content: start;
}

.dashboard-section {
  padding: 18px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #ffffff;
}

.dashboard-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.dashboard-section h2 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.dashboard-section p {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
  line-height: 20px;
}

.chain-steps {
  display: grid;
  gap: 10px;
}

.chain-steps span {
  position: relative;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #303133;
  font-size: 13px;
}

.chain-steps span:not(:last-child)::after {
  content: '↓';
  position: absolute;
  right: 12px;
  bottom: -14px;
  color: #909399;
}

.boundary-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 18px;
  color: #606266;
  font-size: 13px;
  line-height: 20px;
}

@media (max-width: 1080px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-hero {
    display: grid;
  }

  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
</style>
