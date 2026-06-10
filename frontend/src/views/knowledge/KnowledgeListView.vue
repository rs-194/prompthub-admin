<template>
  <div class="page-card">
    <div class="knowledge-header">
      <div>
        <h1>知识库管理</h1>
        <p>
          维护后端持久化知识库文档，供 ChatTest 手动选择为上下文；当前不是 RAG，不做 embedding、向量检索或自动召回。
        </p>
      </div>
      <el-button type="primary" @click="handleOpenCreate">
        新增文档
      </el-button>
    </div>

    <el-alert
      class="knowledge-alert"
      show-icon
      title="Phase 2.9 仅提供手工文档 CRUD 与上下文选择，不支持文件上传、自动摘要、文档解析或真实 RAG。"
      type="info"
      :closable="false"
    />

    <div class="knowledge-filters">
      <el-input
        v-model="searchKeyword"
        class="knowledge-filters__search"
        clearable
        placeholder="输入关键词后自动搜索"
        @input="handleKeywordInput"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="selectedSearchScope"
        class="knowledge-filters__scope"
        @change="handleSearchScopeChange"
      >
        <el-option label="标题/摘要" value="basic" />
        <el-option label="全文" value="fullText" />
      </el-select>
      <el-select
        v-model="selectedEnabled"
        class="knowledge-filters__select"
        clearable
        placeholder="启用状态"
        @change="handleFilterChange"
      >
        <el-option label="启用" value="enabled" />
        <el-option label="停用" value="disabled" />
      </el-select>
      <el-button type="primary" plain @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <div
      v-if="selectedSearchScope === 'fullText'"
      class="knowledge-search-tip"
    >
      全文搜索会匹配正文内容，结果可能更宽。
    </div>

    <el-alert
      v-if="errorMessage"
      class="knowledge-error"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <div v-if="loading" class="knowledge-loading">知识库文档加载中...</div>

    <el-table v-else :data="documents" stripe empty-text="暂无知识库文档">
      <el-table-column prop="title" label="文档标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="摘要 / 正文预览" min-width="260">
        <template #default="{ row }">
          <div v-if="row.matchSnippet" class="knowledge-match">
            <el-tag size="small" type="success" effect="plain">匹配</el-tag>
            <span>{{ row.matchSnippet }}</span>
          </div>
          <span v-else>{{ row.summary || row.contentPreview || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.sourceName || '-' }}
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
            <span v-if="row.tags.length === 0" class="knowledge-tags__empty">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            :loading="togglingId === row.id"
            @change="handleSwitchChange(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="210">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleOpenPreview(row.id)">
            查看
          </el-button>
          <el-button link type="primary" @click="handleOpenEdit(row.id)">
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            :loading="deletingId === row.id"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="knowledge-pagination">
      <span>共 {{ total }} 条</span>
      <el-select
        v-model="pageSize"
        class="knowledge-pagination__size"
        @change="handlePageSizeChange"
      >
        <el-option :value="10" label="10 条 / 页" />
        <el-option :value="20" label="20 条 / 页" />
        <el-option :value="50" label="50 条 / 页" />
        <el-option :value="100" label="100 条 / 页" />
      </el-select>
      <el-button :disabled="page <= 1" @click="handlePreviousPage">
        上一页
      </el-button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <el-button :disabled="page >= totalPages" @click="handleNextPage">
        下一页
      </el-button>
    </div>

    <knowledge-form-dialog
      v-model:visible="dialogVisible"
      :initial-data="currentFormData"
      :mode="dialogMode"
      :submitting="submitting"
      @submit="handleSubmit"
    />

    <knowledge-preview-drawer
      :visible="previewVisible"
      :document="currentPreviewDocument"
      :loading="previewLoading"
      :error-message="previewError"
      @update:visible="handlePreviewVisibleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import { debounce } from '@/utils/debounce';
import {
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  getKnowledgeDocumentDetail,
  getKnowledgeDocumentList,
  KnowledgeApiError,
  updateKnowledgeDocument,
} from '@/services/knowledge';
import type {
  KnowledgeDialogMode,
  KnowledgeDocumentDetail,
  KnowledgeDocumentFormData,
  KnowledgeDocumentListItem,
  KnowledgeSearchScope,
} from '@/types/knowledge';
import KnowledgeFormDialog from './components/KnowledgeFormDialog.vue';
import KnowledgePreviewDrawer from './components/KnowledgePreviewDrawer.vue';

const documents = ref<KnowledgeDocumentListItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const selectedSearchScope = ref<KnowledgeSearchScope>('basic');
const selectedEnabled = ref<'' | 'enabled' | 'disabled'>('');
const loading = ref(false);
const errorMessage = ref('');

const dialogVisible = ref(false);
const dialogMode = ref<KnowledgeDialogMode>('create');
const currentFormData = ref<KnowledgeDocumentFormData | null>(null);
const currentEditId = ref<number | null>(null);
const submitting = ref(false);

const previewVisible = ref(false);
const previewLoading = ref(false);
const previewError = ref('');
const currentPreviewDocument = ref<KnowledgeDocumentDetail | null>(null);
const deletingId = ref<number | null>(null);
const togglingId = ref<number | null>(null);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value)),
);

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof KnowledgeApiError ? error.message : fallback;
}

function getEnabledFilter() {
  if (selectedEnabled.value === 'enabled') {
    return true;
  }

  if (selectedEnabled.value === 'disabled') {
    return false;
  }

  return undefined;
}

async function loadKnowledgeDocuments() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await getKnowledgeDocumentList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      searchScope: selectedSearchScope.value,
      enabled: getEnabledFilter(),
    });
    documents.value = response.items;
    total.value = response.total;
    page.value = response.page;
    pageSize.value = response.pageSize;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, '知识库文档加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

const debouncedKeywordSearch = debounce(() => {
  page.value = 1;
  void loadKnowledgeDocuments();
}, 400);

function handleKeywordInput() {
  debouncedKeywordSearch();
}

function handleSearch() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadKnowledgeDocuments();
}

function handleFilterChange() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadKnowledgeDocuments();
}

function handleSearchScopeChange() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadKnowledgeDocuments();
}

function handleReset() {
  debouncedKeywordSearch.cancel();
  searchKeyword.value = '';
  selectedSearchScope.value = 'basic';
  selectedEnabled.value = '';
  page.value = 1;
  void loadKnowledgeDocuments();
}

function handlePageSizeChange() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadKnowledgeDocuments();
}

function handlePreviousPage() {
  if (page.value > 1) {
    debouncedKeywordSearch.cancel();
    page.value -= 1;
    void loadKnowledgeDocuments();
  }
}

function handleNextPage() {
  if (page.value < totalPages.value) {
    debouncedKeywordSearch.cancel();
    page.value += 1;
    void loadKnowledgeDocuments();
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function toFormData(
  document: KnowledgeDocumentDetail,
): KnowledgeDocumentFormData {
  return {
    title: document.title,
    content: document.content,
    summary: document.summary,
    sourceName: document.sourceName,
    tags: [...document.tags],
    enabled: document.enabled,
  };
}

function handleOpenCreate() {
  dialogMode.value = 'create';
  currentEditId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

async function handleOpenEdit(documentId: number) {
  try {
    const detail = await getKnowledgeDocumentDetail(documentId);
    dialogMode.value = 'edit';
    currentEditId.value = documentId;
    currentFormData.value = toFormData(detail);
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '文档详情加载失败，请稍后重试'));
  }
}

async function handleSubmit(data: KnowledgeDocumentFormData) {
  submitting.value = true;

  try {
    if (dialogMode.value === 'create') {
      await createKnowledgeDocument(data);
      ElMessage.success('新增知识库文档成功');
    } else if (currentEditId.value !== null) {
      await updateKnowledgeDocument(currentEditId.value, data);
      ElMessage.success('编辑知识库文档成功');
    }

    dialogVisible.value = false;
    await loadKnowledgeDocuments();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '知识库文档保存失败，请稍后重试'));
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(document: KnowledgeDocumentListItem) {
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
  } catch {
    return;
  }

  deletingId.value = document.id;

  try {
    await deleteKnowledgeDocument(document.id);
    if (documents.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    ElMessage.success('删除知识库文档成功');
    await loadKnowledgeDocuments();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '删除知识库文档失败，请稍后重试'));
  } finally {
    deletingId.value = null;
  }
}

async function handleToggleEnabled(
  document: KnowledgeDocumentListItem,
  enabled: boolean,
) {
  togglingId.value = document.id;

  try {
    const detail = await getKnowledgeDocumentDetail(document.id);
    await updateKnowledgeDocument(document.id, {
      title: detail.title,
      content: detail.content,
      summary: detail.summary,
      sourceName: detail.sourceName,
      tags: [...detail.tags],
      enabled,
    });
    ElMessage.success(enabled ? '已启用知识库文档' : '已停用知识库文档');
    await loadKnowledgeDocuments();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '更新启用状态失败，请稍后重试'));
  } finally {
    togglingId.value = null;
  }
}

function handleSwitchChange(
  document: KnowledgeDocumentListItem,
  enabled: string | number | boolean,
) {
  void handleToggleEnabled(document, Boolean(enabled));
}

async function handleOpenPreview(documentId: number) {
  previewVisible.value = true;
  previewLoading.value = true;
  previewError.value = '';
  currentPreviewDocument.value = null;

  try {
    currentPreviewDocument.value = await getKnowledgeDocumentDetail(documentId);
  } catch (error) {
    previewError.value = getErrorMessage(error, '文档详情加载失败，请稍后重试');
  } finally {
    previewLoading.value = false;
  }
}

function handlePreviewVisibleChange(visible: boolean) {
  previewVisible.value = visible;
  if (!visible) {
    currentPreviewDocument.value = null;
    previewError.value = '';
  }
}

onMounted(() => {
  void loadKnowledgeDocuments();
});

onBeforeUnmount(() => {
  debouncedKeywordSearch.cancel();
});
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

.knowledge-alert,
.knowledge-error {
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

.knowledge-filters__scope {
  width: 130px;
}

.knowledge-filters__select {
  width: 180px;
}

.knowledge-search-tip {
  margin: -10px 0 18px;
  color: #909399;
  font-size: 12px;
}

.knowledge-match {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
}

.knowledge-match .el-tag {
  flex: none;
  margin-top: 2px;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.knowledge-tags__empty {
  color: #909399;
}

.knowledge-loading {
  padding: 32px 0;
  color: #606266;
  text-align: center;
}

.knowledge-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}

.knowledge-pagination__size {
  width: 120px;
}

@media (max-width: 640px) {
  .knowledge-header {
    flex-direction: column;
  }

  .knowledge-filters,
  .knowledge-filters__search,
  .knowledge-filters__scope,
  .knowledge-filters__select {
    width: 100%;
  }

  .knowledge-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
