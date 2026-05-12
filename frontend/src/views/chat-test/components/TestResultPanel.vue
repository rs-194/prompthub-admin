<script setup lang="ts">
import type { ChatTestResult } from '@/types/chatTest';

// 展示 Prompt 调试台的运行结果状态，本组件只接收 props，不调用 service。
defineProps<{
  result: ChatTestResult | null;
  loading: boolean;
  errorMessage: string;
}>();
</script>

<template>
  <el-card class="result-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>输出结果</span>
        <el-tag size="small" type="info">Mock</el-tag>
      </div>
    </template>

    <div v-if="loading" class="result-state">
      <el-skeleton :rows="5" animated />
    </div>

    <el-alert
      v-else-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-empty
      v-else-if="!result"
      description="暂无测试结果，请选择提示词和模型后运行测试"
    />

    <div v-else class="result-content">
      <div class="result-meta">
        <span>提示词：{{ result.usedPromptTitle }}</span>
        <span>模型：{{ result.usedModelName }}</span>
        <span>耗时：{{ result.durationMs }}ms</span>
        <span>时间：{{ result.createdAt }}</span>
      </div>
      <pre class="result-output">{{ result.output }}</pre>
    </div>
  </el-card>
</template>

<style scoped>
.result-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-state {
  padding: 8px 0;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: #606266;
  font-size: 13px;
}

.result-output {
  margin: 0;
  padding: 16px;
  min-height: 180px;
  border-radius: 6px;
  background: #f7f8fa;
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}
</style>
