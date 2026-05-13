<template>
  <div class="page-card">
    <div class="knowledge-header">
      <div>
        <h1>知识库管理</h1>
        <p>
          用于维护后续 RAG 上下文准备区的文档 mock 元数据；当前不上传文件、不切片、不向量化、不做真实检索。
        </p>
      </div>
      <el-button type="primary" @click="handleOpenCreate">
        新增文档
      </el-button>
    </div>

    <el-alert
      class="knowledge-mock-alert"
      show-icon
      title="v1 mock 阶段仅维护文档元数据，chunkCount 和 vectorStatus 均为 mock 字段，不代表真实上传、解析、切片、embedding 或 RAG 结果。"
      type="info"
      :closable="false"
    />

    <div class="knowledge-filters">
      <el-input
        v-model="searchKeyword"
        class="knowledge-filters__search"
        clearable
        placeholder="搜索标题、摘要、来源或标签"
      />
      <el-select
        v-model="selectedCategory"
        class="knowledge-filters__select"
        clearable
        placeholder="选择分类"
      >
        <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </el-select>
      <el-select
        v-model="selectedStatus"
        class="knowledge-filters__select"
        clearable
        placeholder="启用状态"
      >
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
      </el-select>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <div v-if="loading" class="knowledge-loading">知识库文档加载中...</div>

    <el-table v-else :data="filteredDocuments" stripe>
      <el-table-column prop="title" label="文档标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="分类" min-width="110">
        <template #default="{ row }">
          {{ getCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column label="来源" min-width="170" show-overflow-tooltip>
        <template #default="{ row }">
          {{ getSourceTypeLabel(row.sourceType) }} / {{ row.sourceName }}
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          <div class="knowledge-tags">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              effect="plain"
              size="small"
            >
              {{ tag }}
            </el-tag>
            <span v-if="row.tags.length === 0" class="knowledge-tags__empty">
              -
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="mock 切片数" width="120">
        <template #default="{ row }">
          {{ row.chunkCount }}
        </template>
      </el-table-column>
      <el-table-column label="mock 向量化" width="130">
        <template #default="{ row }">
          <el-tag :type="getVectorStatusTagType(row.vectorStatus)" size="small">
            {{ getVectorStatusLabel(row.vectorStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            @change="handleSwitchChange(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
      <el-table-column label="操作" fixed="right" width="210">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleOpenPreview(row)">
            查看
          </el-button>
          <el-button link type="primary" @click="handleOpenEdit(row)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <knowledge-form-dialog
      v-model:visible="dialogVisible"
      :categories="categories"
      :initial-data="currentFormData"
      :mode="dialogMode"
      @submit="handleSubmit"
    />

    <knowledge-preview-drawer
      :visible="previewVisible"
      :category-label="previewCategoryLabel"
      :document="currentPreviewDocument"
      :source-type-label="previewSourceTypeLabel"
      :vector-status-label="previewVectorStatusLabel"
      @update:visible="handlePreviewVisibleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeCategories,
  getKnowledgeDocumentList,
  toggleKnowledgeDocumentEnabled,
  updateKnowledgeDocument,
} from '@/services/knowledge';
import type {
  KnowledgeCategory,
  KnowledgeDialogMode,
  KnowledgeDocumentFormData,
  KnowledgeDocumentItem,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeVectorStatus,
} from '@/types/knowledge';
import KnowledgeFormDialog from './components/KnowledgeFormDialog.vue';
import KnowledgePreviewDrawer from './components/KnowledgePreviewDrawer.vue';

const documents = ref<KnowledgeDocumentItem[]>([]);
const categories = ref<KnowledgeCategory[]>([]);
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedStatus = ref<'' | KnowledgeStatus>('');
const dialogVisible = ref(false);
const dialogMode = ref<KnowledgeDialogMode>('create');
const currentFormData = ref<KnowledgeDocumentFormData | null>(null);
const currentEditId = ref<number | null>(null);
const previewVisible = ref(false);
const currentPreviewDocument = ref<KnowledgeDocumentItem | null>(null);
const loading = ref(false);

const sourceTypeLabelMap: Record<KnowledgeSourceType, string> = {
  manual: '手工录入',
  pdf: 'PDF 文档',
  web: '网页来源',
  markdown: 'Markdown',
};

const vectorStatusLabelMap: Record<KnowledgeVectorStatus, string> = {
  not_started: '未开始',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

const vectorStatusTagTypeMap: Record<
  KnowledgeVectorStatus,
  'success' | 'warning' | 'info' | 'danger'
> = {
  not_started: 'info',
  processing: 'warning',
  completed: 'success',
  failed: 'danger',
};

const categoryLabelMap = computed(() => {
  return categories.value.reduce<Record<string, string>>((map, category) => {
    map[category.value] = category.label;
    return map;
  }, {});
});

/**
 * 根据原始文档列表和筛选条件派生表格展示数据。
 *
 * 搜索匹配 title、summary、sourceName 和 tags；分类筛选匹配 category；
 * 状态筛选使用明确的 KnowledgeStatus：enabled 对应 enabled === true，
 * disabled 对应 enabled === false，空字符串表示不过滤。这里使用 computed，
 * 不额外用 watch 维护一份筛选后列表。
 */
const filteredDocuments = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return documents.value.filter((document) => {
    const matchesKeyword =
      keyword.length === 0 ||
      document.title.toLowerCase().includes(keyword) ||
      document.summary.toLowerCase().includes(keyword) ||
      document.sourceName.toLowerCase().includes(keyword) ||
      document.tags.some((tag) => tag.toLowerCase().includes(keyword));
    const matchesCategory =
      selectedCategory.value.length === 0 ||
      document.category === selectedCategory.value;
    const matchesStatus =
      selectedStatus.value === '' ||
      (selectedStatus.value === 'enabled' && document.enabled) ||
      (selectedStatus.value === 'disabled' && !document.enabled);

    return matchesKeyword && matchesCategory && matchesStatus;
  });
});

const previewCategoryLabel = computed(() => {
  if (!currentPreviewDocument.value) {
    return '';
  }

  return getCategoryLabel(currentPreviewDocument.value.category);
});

const previewSourceTypeLabel = computed(() => {
  if (!currentPreviewDocument.value) {
    return '';
  }

  return getSourceTypeLabel(currentPreviewDocument.value.sourceType);
});

const previewVectorStatusLabel = computed(() => {
  if (!currentPreviewDocument.value) {
    return '';
  }

  return getVectorStatusLabel(currentPreviewDocument.value.vectorStatus);
});

/**
 * 加载知识库文档列表和分类数据。
 *
 * 页面挂载时调用，新增、编辑、删除、启用 / 停用后也会重新调用；
 * 当前读取前端 mock service，不接后端、不上传文件、不切片、不向量化。
 * 后续接入真实后端时，优先替换 service 内部实现。
 */
async function loadKnowledgeData() {
  loading.value = true;

  try {
    const [nextCategories, nextDocuments] = await Promise.all([
      getKnowledgeCategories(),
      getKnowledgeDocumentList(),
    ]);

    categories.value = nextCategories;
    documents.value = nextDocuments;
  } finally {
    loading.value = false;
  }
}

/**
 * 获取分类 value 对应的展示文案。
 *
 * 表格和预览抽屉展示分类时调用，优先从 categoryLabelMap 中读取 label；
 * 如果 mock 数据中出现未知分类，则回退展示原始 value，避免页面空白。
 *
 * @param category 知识库文档中的分类 value
 * @returns 分类展示文案
 */
function getCategoryLabel(category: string) {
  return categoryLabelMap.value[category] || category;
}

function getSourceTypeLabel(sourceType: KnowledgeSourceType) {
  return sourceTypeLabelMap[sourceType];
}

/**
 * 获取 mock 向量化状态对应的展示文案。
 *
 * 表格和预览抽屉展示 vectorStatus 时调用；当前只是 mock 状态映射，
 * 不代表真实 embedding 或向量数据库写入结果。
 *
 * @param vectorStatus 知识库文档中的 mock 向量化状态
 * @returns mock 向量化状态展示文案
 */
function getVectorStatusLabel(vectorStatus: KnowledgeVectorStatus) {
  return vectorStatusLabelMap[vectorStatus];
}

function getVectorStatusTagType(vectorStatus: KnowledgeVectorStatus) {
  return vectorStatusTagTypeMap[vectorStatus];
}

/**
 * 重置知识库列表筛选条件。
 *
 * 用户点击“重置”时调用，清空搜索关键词、分类筛选和启用状态筛选；
 * filteredDocuments 会根据最新筛选条件自动恢复为完整 mock 列表。
 */
function handleReset() {
  searchKeyword.value = '';
  selectedCategory.value = '';
  selectedStatus.value = '';
}

function toFormData(
  document: KnowledgeDocumentItem,
): KnowledgeDocumentFormData {
  return {
    title: document.title,
    category: document.category,
    sourceType: document.sourceType,
    sourceName: document.sourceName,
    summary: document.summary,
    tags: [...document.tags],
    chunkCount: document.chunkCount,
    vectorStatus: document.vectorStatus,
    enabled: document.enabled,
  };
}

/**
 * 打开新增知识库文档弹窗。
 *
 * 用户点击“新增文档”时调用，设置弹窗模式为 create，清空当前编辑 id 和表单回填数据；
 * 弹窗会使用默认空表单，新增时仍然只创建 mock 元数据，不上传真实文件。
 */
function handleOpenCreate() {
  dialogMode.value = 'create';
  currentEditId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

/**
 * 打开编辑知识库文档弹窗。
 *
 * 用户点击表格行“编辑”时调用，记录当前文档 id，并把当前行转换成表单数据传给弹窗；
 * 子组件通过 watch 回填本地表单，避免直接修改父组件传入的 props。
 *
 * @param document 当前要编辑的知识库文档
 */
function handleOpenEdit(document: KnowledgeDocumentItem) {
  dialogMode.value = 'edit';
  currentEditId.value = document.id;
  currentFormData.value = toFormData(document);
  dialogVisible.value = true;
}

/**
 * 处理新增 / 编辑弹窗提交。
 *
 * 子组件只提交表单数据，父组件根据 dialogMode 调用 create 或 update service；
 * 操作成功后关闭弹窗并重新 loadKnowledgeData，确保 CRUD 后列表、搜索和筛选都基于
 * 最新 mock service 数据。当前只维护元数据，不真实上传、切片、向量化或 RAG。
 *
 * @param data 子组件提交的知识库文档表单数据
 */
async function handleSubmit(data: KnowledgeDocumentFormData) {
  if (dialogMode.value === 'create') {
    await createKnowledgeDocument(data);
    ElMessage.success('新增知识库文档成功');
  } else if (currentEditId.value !== null) {
    await updateKnowledgeDocument(currentEditId.value, data);
    ElMessage.success('编辑知识库文档成功');
  }

  dialogVisible.value = false;
  await loadKnowledgeData();
}

/**
 * 删除知识库文档记录。
 *
 * 用户点击删除时先弹出 Element Plus 确认框，确认后调用 mock service 删除；
 * 当前只删除前端内存里的文档元数据，不删除真实文件或向量数据。删除后重新加载列表，
 * 保证筛选结果继续基于最新 mock 数据计算。
 *
 * @param document 当前要删除的知识库文档
 */
async function handleDelete(document: KnowledgeDocumentItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除“${document.title}”吗？`,
      '删除知识库文档',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await deleteKnowledgeDocument(document.id);
    ElMessage.success('删除知识库文档成功');
    await loadKnowledgeData();
  } catch {
    // 用户取消删除时不需要额外提示。
  }
}

/**
 * 切换知识库文档启用 / 停用状态。
 *
 * 用户切换列表开关时调用，当前 mock service 只更新 enabled 和 updatedAt；
 * 不触发真实向量库状态变更，也不联动 Prompt 调试台。切换后重新加载列表，
 * 让更新时间和当前筛选结果保持最新。
 *
 * @param document 当前要切换状态的知识库文档
 * @param enabled 目标启用状态，true 表示启用，false 表示停用
 */
async function handleToggleEnabled(
  document: KnowledgeDocumentItem,
  enabled: boolean,
) {
  await toggleKnowledgeDocumentEnabled(document.id, enabled);
  ElMessage.success(enabled ? '已启用知识库文档' : '已停用知识库文档');
  await loadKnowledgeData();
}

function handleSwitchChange(
  document: KnowledgeDocumentItem,
  enabled: string | number | boolean,
) {
  return handleToggleEnabled(document, Boolean(enabled));
}

/**
 * 打开知识库文档预览抽屉。
 *
 * 用户点击“查看”时调用，只把当前行文档传给 Drawer 展示摘要、标签、来源、
 * mock 切片数量和 mock 向量化状态；不调用 service，不做真实文件预览或 RAG 检索。
 *
 * @param document 当前要预览的知识库文档
 */
function handleOpenPreview(document: KnowledgeDocumentItem) {
  currentPreviewDocument.value = document;
  previewVisible.value = true;
}

/**
 * 关闭知识库文档预览抽屉。
 *
 * 抽屉关闭时调用，同时清空 currentPreviewDocument，避免下次打开前短暂显示旧文档；
 * 当前预览只展示 mock 摘要、mock 切片数量和 mock 向量化状态，不做真实 RAG 检索。
 */
function handleClosePreview() {
  previewVisible.value = false;
  currentPreviewDocument.value = null;
}

function handlePreviewVisibleChange(visible: boolean) {
  if (!visible) {
    handleClosePreview();
    return;
  }

  previewVisible.value = true;
}

onMounted(loadKnowledgeData);
</script>

<style scoped>
.knowledge-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.knowledge-header p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.knowledge-mock-alert {
  margin-bottom: 18px;
}

.knowledge-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.knowledge-filters__search {
  width: 320px;
}

.knowledge-filters__select {
  width: 180px;
}

.knowledge-loading {
  padding: 28px 0;
  color: #606266;
  text-align: center;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.knowledge-tags__empty {
  color: #909399;
}

@media (max-width: 640px) {
  .knowledge-header {
    flex-direction: column;
  }

  .knowledge-filters,
  .knowledge-filters__search,
  .knowledge-filters__select {
    width: 100%;
  }
}
</style>
