<script setup lang="ts">
import { computed } from 'vue';
import type { ComponentSize } from 'element-plus';
import type { TestRecordDetail } from '@/types/chatTest';

const props = defineProps<{
  visible: boolean;
  records: TestRecordDetail[];
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

const comparePair = computed(() => {
  if (props.records.length !== 2) {
    return null;
  }

  return [props.records[0]!, props.records[1]!] as const;
});

const compareRecordsForView = computed(() => (comparePair.value ? [...comparePair.value] : []));

const statusLabelMap: Record<TestRecordDetail['status'], string> = {
  success: '成功',
  failed: '失败',
  stopped: '已停止',
};

function getStatusTagType(status: TestRecordDetail['status']) {
  if (status === 'success') {
    return 'success';
  }

  if (status === 'stopped') {
    return 'warning';
  }

  return 'danger';
}

function formatKnowledgeTitles(record: TestRecordDetail) {
  if (record.knowledgeTitles.length === 0) {
    return '未使用知识库上下文';
  }

  return record.knowledgeTitles.join('、');
}

function normalizeTitles(titles: string[]) {
  return [...titles].sort().join('|');
}

const diffTips = computed(() => {
  if (!comparePair.value) {
    return [];
  }

  const [left, right] = comparePair.value;
  const tips: string[] = [];

  if (left.modelName !== right.modelName) {
    tips.push('模型不同');
  }

  if (
    left.temperature !== right.temperature ||
    left.maxTokens !== right.maxTokens ||
    left.outputFormat !== right.outputFormat
  ) {
    tips.push('参数不同');
  }

  if (normalizeTitles(left.knowledgeTitles) !== normalizeTitles(right.knowledgeTitles)) {
    tips.push('知识库上下文不同');
  }

  if (left.durationMs !== right.durationMs) {
    const diff = Math.abs(left.durationMs - right.durationMs);
    const fasterRecord = left.durationMs < right.durationMs ? 'Record A' : 'Record B';
    tips.push(`${fasterRecord} 快 ${diff}ms`);
  }

  return tips;
});

const descriptionSize: ComponentSize = 'default';
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="测试记录对比"
    size="80%"
    destroy-on-close
  >
    <div v-if="loading" class="drawer-state">
      <el-skeleton :rows="10" animated />
    </div>

    <el-alert
      v-else-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-empty
      v-else-if="!comparePair"
      description="暂无对比数据，请选择 2 条测试记录"
    />

    <div v-else class="compare-content">
      <el-alert
        v-if="diffTips.length > 0"
        type="info"
        show-icon
        :closable="false"
      >
        <template #title>
          <span class="diff-tips">
            <el-tag
              v-for="tip in diffTips"
              :key="tip"
              size="small"
              effect="plain"
            >
              {{ tip }}
            </el-tag>
          </span>
        </template>
      </el-alert>

      <div class="compare-grid">
        <section
        v-for="(record, index) in compareRecordsForView"
          :key="record.id"
          class="record-panel"
        >
          <div class="record-heading">
            <h3>{{ index === 0 ? 'Record A' : 'Record B' }}</h3>
            <el-tag :type="getStatusTagType(record.status)" size="small">
              {{ statusLabelMap[record.status] }}
            </el-tag>
          </div>

          <el-card shadow="never">
            <template #header>
              <span>基本信息</span>
            </template>
            <el-descriptions :column="1" border :size="descriptionSize">
              <el-descriptions-item label="Prompt 标题">
                {{ record.promptTitle }}
              </el-descriptions-item>
              <el-descriptions-item label="模型名称">
                {{ record.modelName }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ record.createdAt }}
              </el-descriptions-item>
              <el-descriptions-item label="耗时">
                {{ record.durationMs }}ms
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card shadow="never">
            <template #header>
              <span>参数信息</span>
            </template>
            <el-descriptions :column="1" border :size="descriptionSize">
              <el-descriptions-item label="temperature">
                {{ record.temperature }}
              </el-descriptions-item>
              <el-descriptions-item label="maxTokens">
                {{ record.maxTokens }}
              </el-descriptions-item>
              <el-descriptions-item label="outputFormat">
                {{ record.outputFormat }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card shadow="never">
            <template #header>
              <span>用户输入</span>
            </template>
            <pre class="text-block">{{ record.userInput }}</pre>
          </el-card>

          <el-card shadow="never">
            <template #header>
              <span>知识库上下文</span>
            </template>
            <div class="knowledge-summary">
              <el-tag type="warning" effect="plain">
                {{ record.knowledgeCount }} 篇
              </el-tag>
              <span>{{ formatKnowledgeTitles(record) }}</span>
            </div>
          </el-card>

          <el-card shadow="never">
            <template #header>
              <span>完整 output</span>
            </template>
            <pre class="text-block output-block">{{ record.output }}</pre>
          </el-card>
        </section>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-state {
  padding: 8px 0;
}

.compare-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diff-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.record-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}

.record-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.record-heading h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.text-block {
  box-sizing: border-box;
  max-width: 100%;
  max-height: 260px;
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

@media (max-width: 960px) {
  :deep(.el-drawer) {
    width: 100% !important;
  }

  .compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>
