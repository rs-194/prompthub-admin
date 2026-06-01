<script setup lang="ts">
import { computed } from 'vue';
import type { TestRecordDetail } from '@/types/chatTest';

const props = defineProps<{
  visible: boolean;
  detail: TestRecordDetail | null;
  loading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

const statusTagType = computed(() => {
  if (!props.detail) {
    return 'info';
  }

  if (props.detail.status === 'success') {
    return 'success';
  }

  if (props.detail.status === 'stopped') {
    return 'warning';
  }

  return 'danger';
});

const statusLabel = computed(() => {
  if (!props.detail) {
    return '-';
  }

  const labelMap: Record<TestRecordDetail['status'], string> = {
    success: '成功',
    failed: '失败',
    stopped: '已停止',
  };

  return labelMap[props.detail.status];
});

const knowledgeText = computed(() => {
  if (!props.detail || props.detail.knowledgeTitles.length === 0) {
    return '未使用知识库上下文';
  }

  return props.detail.knowledgeTitles.join('、');
});
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="测试记录详情"
    size="720px"
    destroy-on-close
  >
    <div v-if="loading" class="drawer-state">
      <el-skeleton :rows="8" animated />
    </div>

    <el-alert
      v-else-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-empty
      v-else-if="!detail"
      description="暂无测试记录详情"
    />

    <div v-else class="detail-content">
      <el-card shadow="never">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Prompt 标题">
            {{ detail.promptTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="模型名称">
            {{ detail.modelName }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType" size="small">
              {{ statusLabel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ detail.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="耗时">
            {{ detail.durationMs }}ms
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span>参数信息</span>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="temperature">
            {{ detail.temperature }}
          </el-descriptions-item>
          <el-descriptions-item label="maxTokens">
            {{ detail.maxTokens }}
          </el-descriptions-item>
          <el-descriptions-item label="outputFormat">
            {{ detail.outputFormat }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span>用户输入</span>
        </template>
        <pre class="text-block">{{ detail.userInput }}</pre>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span>知识库上下文</span>
        </template>
        <div class="knowledge-summary">
          <el-tag type="warning" effect="plain">
            {{ detail.knowledgeCount }} 篇
          </el-tag>
          <span>{{ knowledgeText }}</span>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span>输出结果</span>
        </template>
        <pre class="text-block output-block">{{ detail.output }}</pre>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span>输出摘要</span>
        </template>
        <pre class="text-block">{{ detail.outputPreview }}</pre>
      </el-card>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-state {
  padding: 8px 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-block {
  box-sizing: border-box;
  max-width: 100%;
  max-height: 360px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  border-radius: 6px;
  background: #f7f8fa;
  color: #303133;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-block {
  max-height: 520px;
}

.knowledge-summary {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #606266;
  line-height: 1.7;
  word-break: break-word;
}

@media (max-width: 720px) {
  :deep(.el-drawer) {
    width: 100% !important;
  }
}
</style>
