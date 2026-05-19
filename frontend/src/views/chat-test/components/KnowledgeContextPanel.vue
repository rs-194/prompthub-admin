<script setup lang="ts">
import type { ChatTestKnowledgeOption } from '@/types/chatTest';
import type { KnowledgeVectorStatus } from '@/types/knowledge';

// 展示已选知识库 mock context，本组件只接收 props，不调用 service、不维护业务状态、不修改传入数据。
defineProps<{
  documents: ChatTestKnowledgeOption[];
}>();

const vectorStatusLabelMap: Record<KnowledgeVectorStatus, string> = {
  not_started: '未开始',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>知识库 mock context 预览</span>
        <el-tag size="small" type="warning" effect="plain">非真实检索结果</el-tag>
      </div>
    </template>

    <el-alert
      title="当前为手动选择文档后拼接的 mock context，仅用于演示 Prompt + 模型 + 知识库上下文的调试闭环。"
      type="warning"
      show-icon
      :closable="false"
      class="context-alert"
    />

    <el-empty
      v-if="documents.length === 0"
      description="未选择知识库，将按基础 Prompt 测试运行"
    />

    <div v-else class="context-list">
      <div v-for="document in documents" :key="document.id" class="context-item">
        <div class="context-title">
          <strong>{{ document.title }}</strong>
          <el-tag size="small">{{ document.categoryLabel }}</el-tag>
        </div>

        <p class="context-summary">{{ document.summary }}</p>

        <div class="context-meta">
          <span>来源：{{ document.sourceName }}</span>
          <span>mock 切片数：{{ document.chunkCount }}</span>
          <span>mock 向量状态：{{ vectorStatusLabelMap[document.vectorStatus] }}</span>
        </div>

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

.context-meta {
  color: #606266;
  font-size: 12px;
}
</style>
