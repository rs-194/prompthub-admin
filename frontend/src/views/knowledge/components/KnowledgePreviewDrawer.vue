<template>
  <el-drawer
    :model-value="visible"
    title="知识库文档详情"
    size="520px"
    @close="handleClose"
  >
    <div v-if="loading" class="knowledge-preview__state">
      文档详情加载中...
    </div>

    <el-alert
      v-else-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-empty v-else-if="!document" description="暂无文档详情" />

    <div v-else class="knowledge-preview">
      <el-alert
        show-icon
        title="这是可由 ChatTest 手动选择的后端文档，不是 embedding、向量检索或自动召回结果。"
        type="info"
        :closable="false"
      />

      <section class="knowledge-preview__section">
        <h3>{{ document.title }}</h3>
        <p class="knowledge-preview__summary">
          {{ document.summary || '未填写摘要' }}
        </p>
      </section>

      <section class="knowledge-preview__section">
        <div class="knowledge-preview__meta">
          <div class="knowledge-preview__meta-row">
            <span>来源名称</span>
            <strong>{{ document.sourceName || '-' }}</strong>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>启用状态</span>
            <el-tag :type="document.enabled ? 'success' : 'info'">
              {{ document.enabled ? '启用' : '停用' }}
            </el-tag>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>创建时间</span>
            <strong>{{ formatDateTime(document.createdAt) }}</strong>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>更新时间</span>
            <strong>{{ formatDateTime(document.updatedAt) }}</strong>
          </div>
        </div>
      </section>

      <section class="knowledge-preview__section">
        <h4>标签</h4>
        <div class="knowledge-preview__tags">
          <el-tag
            v-for="tag in document.tags"
            :key="tag"
            effect="plain"
            size="small"
          >
            {{ tag }}
          </el-tag>
          <span v-if="document.tags.length === 0" class="knowledge-preview__empty">
            暂无标签
          </span>
        </div>
      </section>

      <section class="knowledge-preview__section">
        <h4>文档正文</h4>
        <pre class="knowledge-preview__content">{{ document.content }}</pre>
      </section>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { KnowledgeDocumentDetail } from '@/types/knowledge';

defineProps<{
  visible: boolean;
  document: KnowledgeDocumentDetail | null;
  loading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function handleClose() {
  emit('update:visible', false);
}
</script>

<style scoped>
.knowledge-preview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.knowledge-preview__state {
  padding: 32px 0;
  color: #606266;
  text-align: center;
}

.knowledge-preview__section h3,
.knowledge-preview__section h4 {
  margin: 0 0 10px;
}

.knowledge-preview__summary {
  margin: 0;
  color: #606266;
  line-height: 1.7;
}

.knowledge-preview__meta {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.knowledge-preview__meta-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

.knowledge-preview__meta-row:last-child {
  border-bottom: 0;
}

.knowledge-preview__meta-row span,
.knowledge-preview__empty {
  color: #909399;
}

.knowledge-preview__meta-row strong {
  color: #303133;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.knowledge-preview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-preview__content {
  margin: 0;
  padding: 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
  color: #303133;
  font-family: inherit;
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
