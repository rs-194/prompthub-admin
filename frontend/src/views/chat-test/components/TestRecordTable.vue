<script setup lang="ts">
import type { ChatTestRecord } from '@/types/chatTest';

// 展示最近 Prompt 测试记录，本组件只负责表格渲染，不调用 service、不维护业务状态。
defineProps<{
  records: ChatTestRecord[];
}>();
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>最近测试记录</span>
        <el-tag size="small" type="info">{{ records.length }} 条</el-tag>
      </div>
    </template>

    <el-table :data="records" empty-text="暂无测试记录" stripe>
      <el-table-column prop="promptTitle" label="提示词" min-width="140" />
      <el-table-column prop="modelName" label="模型配置" min-width="150" />
      <el-table-column label="知识库" width="130">
        <template #default="{ row }">
          <span v-if="row.knowledgeCount === 0" class="empty-knowledge">未使用</span>
          <span
            v-else
            :title="row.knowledgeTitles.join('、')"
          >
            <el-tag size="small" type="warning" effect="plain">
              已用 {{ row.knowledgeCount }} 篇
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="userInput" label="测试输入" min-width="180" show-overflow-tooltip />
      <el-table-column prop="outputPreview" label="输出摘要" min-width="220" show-overflow-tooltip />
      <el-table-column prop="durationMs" label="耗时" width="100">
        <template #default="{ row }">
          {{ row.durationMs }}ms
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
            {{ row.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" />
    </el-table>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.empty-knowledge {
  color: #909399;
  font-size: 12px;
}
</style>
