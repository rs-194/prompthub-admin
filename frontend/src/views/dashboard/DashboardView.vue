// DashboardView.vue
<template>
  <div class="page-card">
    <div class="dashboard-header">
      <h1>首页</h1>
      <p>用于查看提示词、知识库、模型配置和测试记录的概览</p>
    </div>

    <div class="dashboard-stats">
      <StatCard
        v-for="item in overview.stats"
        :key="item.label"
        :item="item"
      />
    </div>

    <el-card class="dashboard-records" shadow="never">
      <template #header>
        <div class="dashboard-records__header">最近操作记录</div>
      </template>

      <el-table :data="overview.recentOperations" stripe>
        <el-table-column prop="time" label="时间" min-width="170" />
        <el-table-column prop="type" label="操作类型" min-width="120" />
        <el-table-column prop="target" label="操作对象" min-width="160" />
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }: { row: DashboardOperationRecord }">
            <el-tag :type="row.status" effect="light">
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { getDashboardOverview } from '@/services/dashboard';
import type { DashboardOperationRecord, DashboardOverview } from '@/types/dashboard';
import StatCard from './components/StatCard.vue';

const overview = ref<DashboardOverview>({
  stats: [],
  recentOperations: [],
});

onMounted(async () => {
  overview.value = await getDashboardOverview();
});
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-records__header {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 1080px) {
  .dashboard-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
</style>
