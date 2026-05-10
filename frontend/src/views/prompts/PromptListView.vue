<template>
  <div class="page-card">
    <div class="prompt-header">
      <div>
        <h1>提示词管理</h1>
        <p>用于维护不同场景下的大模型提示词模板</p>
      </div>
      <el-button type="primary" @click="handleCreate">新增提示词</el-button>
    </div>

    <div class="prompt-filters">
      <el-input
        v-model="searchKeyword"
        class="prompt-filters__search"
        clearable
        placeholder="搜索标题、内容或使用场景"
      />
      <el-select
        v-model="selectedCategory"
        class="prompt-filters__category"
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
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="filteredPrompts" stripe>
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column label="分类" min-width="120">
        <template #default="{ row }">
          {{ getCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="usageScene" label="使用场景" min-width="220" />
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          <div class="prompt-tags">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              effect="light"
              size="small"
            >
              {{ tag }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <prompt-form-dialog
      v-model:visible="dialogVisible"
      :categories="categories"
      :initial-data="currentFormData"
      :mode="dialogMode"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import {
  createPrompt,
  deletePrompt,
  getPromptCategories,
  getPromptList,
  updatePrompt,
} from '@/services/prompt';
import type {
  PromptCategory,
  PromptDialogMode,
  PromptFormData,
  PromptItem,
} from '@/types/prompt';
import PromptFormDialog from './components/PromptFormDialog.vue';

const searchKeyword = ref('');
const selectedCategory = ref('');
const categories = ref<PromptCategory[]>([]);
const prompts = ref<PromptItem[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<PromptDialogMode>('create');
const editingPromptId = ref<number | null>(null);
const currentFormData = ref<PromptFormData | null>(null);

const categoryLabelMap = computed(() => {
  return categories.value.reduce<Record<string, string>>((map, category) => {
    map[category.value] = category.label;
    return map;
  }, {});
});

const filteredPrompts = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return prompts.value.filter((prompt) => {
    const matchesKeyword =
      keyword.length === 0 ||
      prompt.title.toLowerCase().includes(keyword) ||
      prompt.content.toLowerCase().includes(keyword) ||
      prompt.usageScene.toLowerCase().includes(keyword);
    const matchesCategory =
      selectedCategory.value.length === 0 ||
      prompt.category === selectedCategory.value;

    return matchesKeyword && matchesCategory;
  });
});

function getCategoryLabel(category: string) {
  return categoryLabelMap.value[category] ?? category;
}

function handleReset() {
  searchKeyword.value = '';
  selectedCategory.value = '';
}

async function loadPromptData() {
  const [categoryData, promptData] = await Promise.all([
    getPromptCategories(),
    getPromptList(),
  ]);

  categories.value = categoryData;
  prompts.value = promptData;
}

function toFormData(prompt: PromptItem): PromptFormData {
  return {
    title: prompt.title,
    category: prompt.category,
    content: prompt.content,
    tags: [...prompt.tags],
    usageScene: prompt.usageScene,
  };
}

function handleCreate() {
  dialogMode.value = 'create';
  editingPromptId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

function handleEdit(prompt: PromptItem) {
  dialogMode.value = 'edit';
  editingPromptId.value = prompt.id;
  currentFormData.value = toFormData(prompt);
  dialogVisible.value = true;
}

async function handleSubmit(data: PromptFormData) {
  if (dialogMode.value === 'create') {
    await createPrompt(data);
    ElMessage.success('新增提示词成功');
  } else if (editingPromptId.value !== null) {
    // 新增/编辑共用弹窗，提交时通过 mode 判断调用哪个 mock CRUD 方法。
    await updatePrompt(editingPromptId.value, data);
    ElMessage.success('编辑提示词成功');
  }

  dialogVisible.value = false;
  // CRUD 后重新读取 service 数据，确保搜索和分类筛选基于最新列表计算。
  await loadPromptData();
}

async function handleDelete(prompt: PromptItem) {
  try {
    // 删除前用确认弹窗避免误删；当前删除只影响前端 mock 内存数据。
    await ElMessageBox.confirm(
      `确认删除“${prompt.title}”吗？`,
      '删除提示词',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
    await deletePrompt(prompt.id);
    ElMessage.success('删除提示词成功');
    // 删除后刷新列表，保持表格、搜索、分类筛选都读取最新数据。
    await loadPromptData();
  } catch {
    // 用户取消删除时不需要额外提示。
  }
}

onMounted(loadPromptData);
</script>

<style scoped>
.prompt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.prompt-header p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
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

.prompt-filters__category {
  width: 180px;
}

.prompt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 640px) {
  .prompt-header {
    flex-direction: column;
  }

  .prompt-filters,
  .prompt-filters__search,
  .prompt-filters__category {
    width: 100%;
  }
}
</style>
