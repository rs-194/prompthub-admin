//StatCard.vue
<template>
  <el-card class="stat-card" shadow="hover">
    <div class="stat-card__label">{{ item.label }}</div>
    <div class="stat-card__value">
      <span>{{ item.value }}</span>
      <small v-if="item.unit">{{ item.unit }}</small>
    </div>
    <div v-if="item.description" class="stat-card__description">
      {{ item.description }}
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ElCard } from 'element-plus';

import type { DashboardStatItem } from '@/types/dashboard';

defineOptions({
  name: 'StatCard',
});

defineProps<{
  item: DashboardStatItem;
}>();
</script>

<style scoped>
.stat-card {
  height: 100%;
}

.stat-card__label {
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.stat-card__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 12px;
  color: #303133;
}

.stat-card__value span {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
}

.stat-card__value small {
  color: #909399;
  font-size: 14px;
}

.stat-card__description {
  margin-top: 10px;
  color: #909399;
  font-size: 13px;
  line-height: 20px;
}
</style>
