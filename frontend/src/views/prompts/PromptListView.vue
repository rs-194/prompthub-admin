<template>
  <div class="page-card">
    <div class="prompt-header">
      <div>
        <h1>提示词管理</h1>
        <p>维护后端持久化 Prompt 模板，供 ChatTest 选择并使用完整内容运行。</p>
      </div>
      <el-button type="primary" @click="handleOpenCreate">
        新增 Prompt
      </el-button>
    </div>

    <el-alert
      class="prompt-alert"
      show-icon
      title="Phase 2.11 仅提供 Prompt 后端化轻量 CRUD，不做版本管理、变量引擎、审核流或 marketplace。"
      type="info"
      :closable="false"
    />

    <div class="prompt-filters">
      <el-input
        v-model="searchKeyword"
        class="prompt-filters__search"
        clearable
        placeholder="输入关键词后自动搜索"
        @input="handleKeywordInput"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="selectedCategory"
        class="prompt-filters__category"
        clearable
        placeholder="分类"
        @keyup.enter="handleFilterChange"
        @clear="handleFilterChange"
      />
      <el-select
        v-model="selectedEnabled"
        class="prompt-filters__select"
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

    <el-alert
      v-if="errorMessage"
      class="prompt-error"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <div v-if="loading" class="prompt-loading">Prompt 模板加载中...</div>

    <el-table v-else :data="templates" stripe empty-text="暂无 Prompt 模板">
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="描述" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="分类" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.category || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="170">
        <template #default="{ row }">
          <div class="prompt-tags">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              effect="plain"
              size="small"
            >
              {{ tag }}
            </el-tag>
            <span v-if="row.tags.length === 0" class="prompt-tags__empty">-</span>
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
      <el-table-column prop="contentPreview" label="内容预览" min-width="260" show-overflow-tooltip />
      <el-table-column label="创建时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="160">
        <template #default="{ row }">
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

    <div class="prompt-pagination">
      <span>共 {{ total }} 条</span>
      <el-select
        v-model="pageSize"
        class="prompt-pagination__size"
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

    <prompt-form-dialog
      v-model:visible="dialogVisible"
      :initial-data="currentFormData"
      :mode="dialogMode"
      :submitting="submitting"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import { debounce } from '@/utils/debounce';
import {
  createPromptTemplate,
  deletePromptTemplate,
  getPromptTemplateDetail,
  getPromptTemplateList,
  PromptApiError,
  updatePromptTemplate,
} from '@/services/prompt';
import type {
  PromptDialogMode,
  PromptTemplateDetail,
  PromptTemplateFormData,
  PromptTemplateListItem,
} from '@/types/prompt';
import PromptFormDialog from './components/PromptFormDialog.vue';

const templates = ref<PromptTemplateListItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const selectedCategory = ref('');
const selectedEnabled = ref<'' | 'enabled' | 'disabled'>('');
const loading = ref(false);
const errorMessage = ref('');

const dialogVisible = ref(false);
const dialogMode = ref<PromptDialogMode>('create');
const currentFormData = ref<PromptTemplateFormData | null>(null);
const currentEditId = ref<number | null>(null);
const submitting = ref(false);
const deletingId = ref<number | null>(null);
const togglingId = ref<number | null>(null);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value)),
);

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof PromptApiError ? error.message : fallback;
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

async function loadPromptTemplates() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await getPromptTemplateList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      category: selectedCategory.value,
      enabled: getEnabledFilter(),
    });
    templates.value = response.items;
    total.value = response.total;
    page.value = response.page;
    pageSize.value = response.pageSize;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Prompt 模板加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

const debouncedKeywordSearch = debounce(() => {
  page.value = 1;
  void loadPromptTemplates();
}, 400);

function handleKeywordInput() {
  debouncedKeywordSearch();
}

function handleSearch() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadPromptTemplates();
}

function handleFilterChange() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadPromptTemplates();
}

function handleReset() {
  debouncedKeywordSearch.cancel();
  searchKeyword.value = '';
  selectedCategory.value = '';
  selectedEnabled.value = '';
  page.value = 1;
  void loadPromptTemplates();
}

function handlePageSizeChange() {
  debouncedKeywordSearch.cancel();
  page.value = 1;
  void loadPromptTemplates();
}

function handlePreviousPage() {
  if (page.value > 1) {
    debouncedKeywordSearch.cancel();
    page.value -= 1;
    void loadPromptTemplates();
  }
}

function handleNextPage() {
  if (page.value < totalPages.value) {
    debouncedKeywordSearch.cancel();
    page.value += 1;
    void loadPromptTemplates();
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function toFormData(template: PromptTemplateDetail): PromptTemplateFormData {
  return {
    title: template.title,
    content: template.content,
    description: template.description,
    category: template.category,
    tags: [...template.tags],
    scenario: template.scenario,
    enabled: template.enabled,
  };
}

function handleOpenCreate() {
  dialogMode.value = 'create';
  currentEditId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

async function handleOpenEdit(templateId: number) {
  try {
    const detail = await getPromptTemplateDetail(templateId);
    dialogMode.value = 'edit';
    currentEditId.value = templateId;
    currentFormData.value = toFormData(detail);
    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Prompt 模板详情加载失败，请稍后重试'));
  }
}

async function handleSubmit(data: PromptTemplateFormData) {
  submitting.value = true;

  try {
    if (dialogMode.value === 'create') {
      await createPromptTemplate(data);
      ElMessage.success('新增 Prompt 模板成功');
    } else if (currentEditId.value !== null) {
      await updatePromptTemplate(currentEditId.value, data);
      ElMessage.success('编辑 Prompt 模板成功');
    }

    dialogVisible.value = false;
    await loadPromptTemplates();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, 'Prompt 模板保存失败，请稍后重试'));
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(template: PromptTemplateListItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除“${template.title}”吗？`,
      '删除 Prompt 模板',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  deletingId.value = template.id;

  try {
    await deletePromptTemplate(template.id);
    if (templates.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    ElMessage.success('删除 Prompt 模板成功');
    await loadPromptTemplates();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '删除 Prompt 模板失败，请稍后重试'));
  } finally {
    deletingId.value = null;
  }
}

async function handleToggleEnabled(
  template: PromptTemplateListItem,
  enabled: boolean,
) {
  togglingId.value = template.id;

  try {
    const detail = await getPromptTemplateDetail(template.id);
    await updatePromptTemplate(template.id, {
      title: detail.title,
      content: detail.content,
      description: detail.description,
      category: detail.category,
      tags: [...detail.tags],
      scenario: detail.scenario,
      enabled,
    });
    ElMessage.success(enabled ? '已启用 Prompt 模板' : '已停用 Prompt 模板');
    await loadPromptTemplates();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '更新启用状态失败，请稍后重试'));
  } finally {
    togglingId.value = null;
  }
}

function handleSwitchChange(
  template: PromptTemplateListItem,
  enabled: string | number | boolean,
) {
  void handleToggleEnabled(template, Boolean(enabled));
}

onMounted(() => {
  void loadPromptTemplates();
});

onBeforeUnmount(() => {
  debouncedKeywordSearch.cancel();
});
</script>

<style scoped>
.prompt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.prompt-header p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.prompt-alert,
.prompt-error {
  margin-bottom: 18px;
}

.prompt-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.prompt-filters__search {
  width: 320px;
}

.prompt-filters__category,
.prompt-filters__select {
  width: 180px;
}

.prompt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prompt-tags__empty {
  color: #909399;
}

.prompt-loading {
  padding: 32px 0;
  color: #606266;
  text-align: center;
}

.prompt-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}

.prompt-pagination__size {
  width: 120px;
}

@media (max-width: 640px) {
  .prompt-header {
    flex-direction: column;
  }

  .prompt-filters,
  .prompt-filters__search,
  .prompt-filters__category,
  .prompt-filters__select {
    width: 100%;
  }

  .prompt-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
