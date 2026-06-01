<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, type TableInstance } from 'element-plus';
import type { ChatTestRecord } from '@/types/chatTest';

// 展示最近 Prompt 测试记录，本组件只负责表格渲染，不调用 service、不维护业务状态。
defineProps<{
  records: ChatTestRecord[];
}>();

const emit = defineEmits<{
  viewDetail: [recordId: number];
  selectionChange: [recordIds: number[]];
  compareSelected: [];
}>();

const tableRef = ref<TableInstance>();
const selectedRecords = ref<ChatTestRecord[]>([]);

function canSelectRecord(row: ChatTestRecord) {
  return selectedRecords.value.some((record) => record.id === row.id) || selectedRecords.value.length < 2;
}

function handleSelectionChange(selection: ChatTestRecord[]) {
  if (selection.length > 2) {
    const latestSelection = selection.slice(-2);

    ElMessage.warning('最多只能选择 2 条记录进行对比');
    tableRef.value?.clearSelection();
    latestSelection.forEach((record) => {
      tableRef.value?.toggleRowSelection(record, true);
    });
    return;
  }

  selectedRecords.value = selection;
  emit('selectionChange', selection.map((record) => record.id));
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <div class="header-title">
          <span>最近测试记录</span>
          <el-tag size="small" type="info">{{ records.length }} 条</el-tag>
        </div>
        <el-button
          type="primary"
          plain
          :disabled="selectedRecords.length !== 2"
          title="请选择 2 条记录进行对比"
          @click="emit('compareSelected')"
        >
          对比选中记录
        </el-button>
      </div>
    </template>

    <el-table
      ref="tableRef"
      :data="records"
      row-key="id"
      empty-text="暂无测试记录"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" :selectable="canSelectRecord" />
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
      <el-table-column prop="paramsSummary" label="参数" width="170" show-overflow-tooltip />
      <el-table-column prop="userInput" label="测试输入" min-width="180" show-overflow-tooltip />
      <el-table-column prop="outputPreview" label="输出摘要" min-width="220" show-overflow-tooltip />
      <el-table-column prop="durationMs" label="耗时" width="100">
        <template #default="{ row }">
          {{ row.durationMs }}ms
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'success' ? 'success' : row.status === 'stopped' ? 'warning' : 'danger'"
            size="small"
          >
            {{ row.status === 'success' ? '成功' : row.status === 'stopped' ? '已停止' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="emit('viewDetail', row.id)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-knowledge {
  color: #909399;
  font-size: 12px;
}
</style>
