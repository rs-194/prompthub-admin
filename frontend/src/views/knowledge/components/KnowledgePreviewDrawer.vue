<template>
  <el-drawer
    :model-value="visible"
    title="知识库文档摘要"
    size="420px"
    @close="handleClose"
  >
    <el-empty v-if="!document" description="暂无文档预览信息" />

    <div v-else class="knowledge-preview">
      <el-alert
        show-icon
        title="当前展示的是 mock 切片数量与 mock 向量化状态，不代表真实 RAG 处理结果。"
        type="warning"
        :closable="false"
      />

      <section class="knowledge-preview__section">
        <h3>{{ document.title }}</h3>
        <p>{{ document.summary }}</p>
      </section>

      <section class="knowledge-preview__section">
        <div class="knowledge-preview__meta">
          <div class="knowledge-preview__meta-row">
            <span>分类</span>
            <strong>{{ categoryLabel }}</strong>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>来源类型</span>
            <strong>{{ sourceTypeLabel }}</strong>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>来源名称</span>
            <strong>{{ document.sourceName }}</strong>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>mock 切片数量</span>
            <strong>{{ document.chunkCount }}</strong>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>mock 向量化状态</span>
            <el-tag :type="vectorStatusTagType">
              {{ vectorStatusLabel }}
            </el-tag>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>启用状态</span>
            <el-tag :type="document.enabled ? 'success' : 'info'">
              {{ document.enabled ? '启用' : '停用' }}
            </el-tag>
          </div>
          <div class="knowledge-preview__meta-row">
            <span>更新时间</span>
            <strong>{{ document.updatedAt }}</strong>
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
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { KnowledgeDocumentItem } from '@/types/knowledge';

// 预览抽屉只展示父组件传入的 props，不调用 service，也不维护本地 document 副本。
const props = defineProps<{
  visible: boolean;
  document: KnowledgeDocumentItem | null;
  categoryLabel: string;
  sourceTypeLabel: string;
  vectorStatusLabel: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const vectorStatusTagType = computed(() => {
  if (!props.document) {
    return 'info';
  }

  const tagTypeMap = {
    not_started: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger',
  } as const;

  return tagTypeMap[props.document.vectorStatus];
});

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

.knowledge-preview__section h3,
.knowledge-preview__section h4 {
  margin: 0 0 10px;
}

.knowledge-preview__section p {
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
  grid-template-columns: 120px 1fr;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

.knowledge-preview__meta-row:last-child {
  border-bottom: 0;
}

.knowledge-preview__meta-row span {
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

.knowledge-preview__empty {
  color: #909399;
  font-size: 14px;
}
</style>
