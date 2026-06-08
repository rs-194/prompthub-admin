<script setup lang="ts">
import type { ChatTestResult } from '@/types/chatTest';

// 展示 Prompt 调试台运行结果，本组件只接收 props，不调用 service、不维护业务状态。
defineProps<{
  result: ChatTestResult | null;
  loading: boolean;
  streaming: boolean;
  streamingText: string;
  errorMessage: string;
}>();

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString();
}
</script>

<template>
  <el-card class="result-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>输出结果</span>
        <el-tag size="small" type="success" effect="plain">真实流式</el-tag>
      </div>
    </template>

    <el-alert
      v-if="errorMessage"
      title="本次生成未完成"
      :description="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <div v-else-if="streaming || streamingText" class="result-content">
      <div class="streaming-title">
        <span>{{ streaming ? '正在流式生成中...' : '已停止生成，已保留当前片段' }}</span>
        <el-tag size="small" type="success" effect="plain">fetch stream</el-tag>
      </div>
      <pre class="result-output streaming-output">{{ streamingText || '正在等待模型返回首段内容...' }}</pre>
    </div>

    <div v-else-if="loading" class="result-state">
      <el-skeleton :rows="5" animated />
    </div>

    <el-empty
      v-else-if="!result"
      description="暂无输出，选择 Prompt、模型并输入测试内容后即可运行"
    />

    <div v-else class="result-content">
      <div class="result-status">
        <el-tag type="success" effect="plain">生成完成</el-tag>
      </div>
      <div class="result-meta">
        <span>提示词：{{ result.usedPromptTitle }}</span>
        <span>模型：{{ result.usedModelName }}</span>
        <span>耗时：{{ formatDuration(result.durationMs) }}</span>
        <span>时间：{{ formatCreatedAt(result.createdAt) }}</span>
        <span>参数：{{ result.paramsSummary }}</span>
      </div>

      <div v-if="result.usedKnowledgeTitles.length > 0" class="knowledge-summary">
        <div class="knowledge-title">
          <span>手动 Knowledge 上下文</span>
          <el-tag size="small" type="warning" effect="plain">非 RAG</el-tag>
        </div>
        <div class="knowledge-tags">
          <el-tag
            v-for="title in result.usedKnowledgeTitles"
            :key="title"
            size="small"
            effect="plain"
          >
            {{ title }}
          </el-tag>
        </div>
        <pre v-if="result.contextPreview" class="context-preview">{{ result.contextPreview }}</pre>
      </div>

      <pre class="result-output">{{ result.output }}</pre>
    </div>
  </el-card>
</template>

<style scoped>
.result-card {
  height: 100%;
}

.card-header,
.knowledge-title,
.knowledge-tags,
.streaming-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header,
.knowledge-title,
.streaming-title {
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

.result-status {
  display: flex;
  justify-content: flex-start;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: #606266;
  font-size: 13px;
}

.streaming-title {
  color: #303133;
  font-weight: 600;
}

.knowledge-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid #f3d19e;
  border-radius: 6px;
  background: #fdf6ec;
}

.knowledge-title {
  color: #303133;
  font-weight: 600;
}

.knowledge-tags {
  flex-wrap: wrap;
}

.context-preview,
.result-output {
  margin: 0;
  padding: 16px;
  border-radius: 6px;
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.context-preview {
  max-height: 220px;
  overflow: auto;
  background: #fffaf2;
}

.result-output {
  min-height: 180px;
  max-height: 560px;
  overflow: auto;
  background: #f7f8fa;
}

.streaming-output {
  border: 1px dashed #dcdfe6;
}
</style>
