<script setup lang="ts">
import { computed } from 'vue';
import type {
  KnowledgeDocumentDetail,
  KnowledgeDocumentListItem,
} from '@/types/knowledge';

const props = defineProps<{
  documents: KnowledgeDocumentListItem[];
  details: KnowledgeDocumentDetail[];
  loadingIds: number[];
  errorMessage: string;
}>();

const detailMap = computed(
  () => new Map(props.details.map((detail) => [detail.id, detail])),
);
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>手动 Knowledge 上下文</span>
        <el-tag size="small" type="warning" effect="plain">不是 RAG</el-tag>
      </div>
    </template>

    <el-alert
      title="这里会把手动选择的后端 Knowledge 文档正文拼入本次请求上下文。"
      description="不选择也可以运行基础 Prompt 调试；当前不做 embedding、向量检索或自动召回。"
      type="info"
      show-icon
      :closable="false"
      class="context-alert"
    />

    <el-alert
      v-if="errorMessage"
      title="Knowledge 详情暂时无法加载"
      :description="errorMessage"
      type="warning"
      show-icon
      :closable="false"
      class="context-alert"
    />

    <el-empty
      v-if="documents.length === 0"
      description="未选择 Knowledge；可以直接运行基础 Prompt 调试"
    />

    <div v-else class="context-list">
      <div v-for="document in documents" :key="document.id" class="context-item">
        <div class="context-title">
          <strong>{{ document.title }}</strong>
          <el-tag size="small">{{ document.sourceName || '手工录入' }}</el-tag>
        </div>

        <div
          v-if="loadingIds.includes(document.id)"
          class="context-loading"
        >
          正在加载文档正文...
        </div>

        <template v-else>
          <p class="context-summary">
            {{ document.summary || document.contentPreview }}
          </p>

          <pre v-if="detailMap.get(document.id)" class="context-content">{{
            detailMap.get(document.id)?.content
          }}</pre>
        </template>

        <div v-if="document.tags.length > 0" class="tag-list">
          <el-tag
            v-for="tag in document.tags"
            :key="tag"
            size="small"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.context-alert {
  margin-bottom: 16px;
}

.context-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.context-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
}

.context-title,
.context-meta,
.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.context-title {
  justify-content: space-between;
}

.context-summary {
  margin: 0;
  color: #303133;
  line-height: 1.7;
}

.context-loading {
  color: #909399;
  font-size: 13px;
}

.context-content {
  max-height: 180px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
