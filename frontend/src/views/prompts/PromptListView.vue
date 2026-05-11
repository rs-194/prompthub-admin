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

// 页面状态只负责当前列表页的交互：搜索、分类筛选、列表数据、弹窗显隐和当前编辑项。
const searchKeyword = ref('');
const selectedCategory = ref('');
const categories = ref<PromptCategory[]>([]);
const prompts = ref<PromptItem[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<PromptDialogMode>('create');
const editingPromptId = ref<number | null>(null);
const currentFormData = ref<PromptFormData | null>(null);

// 分类 label 是由分类列表派生出来的映射，用 computed 避免手动维护一份重复状态。
/**
 * 根据分类列表派生分类 value 到 label 的映射。
 *
 * 这是由 categories 计算出来的展示辅助数据，不是独立状态；
 * 分类列表变化时会自动重新计算，表格展示分类名称时通过它取中文 label。
 */
const categoryLabelMap = computed(() => {
  return categories.value.reduce<Record<string, string>>((map, category) => {
    map[category.value] = category.label;
    return map;
  }, {});
});

// 表格展示数据由原始列表、搜索词和分类筛选共同推导，因此使用 computed 自动随依赖更新。
/**
 * 根据原始提示词列表、搜索词和分类筛选派生表格最终数据。
 *
 * computed 只负责派生展示结果，不额外保存一份列表状态；
 * 搜索会匹配标题、内容和使用场景，分类筛选会匹配 category，
 * 两个条件同时满足时才会出现在当前表格中。
 */
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

/**
 * 获取分类 value 对应的展示文案。
 *
 * 表格渲染分类列时调用，优先从 categoryLabelMap 中取中文 label；
 * 如果分类值暂时没有匹配项，则回退展示原始 category。
 *
 * @param category 提示词数据中的分类 value
 * @returns 分类中文 label 或原始分类 value
 */
function getCategoryLabel(category: string) {
  return categoryLabelMap.value[category] ?? category;
}

/**
 * 重置提示词列表筛选条件。
 *
 * 用户点击“重置”时调用，只清空搜索词和分类筛选；
 * filteredPrompts 会根据最新条件自动恢复为当前 service 列表的完整展示结果。
 */
function handleReset() {
  searchKeyword.value = '';
  selectedCategory.value = '';
}

/**
 * 加载提示词管理页所需的分类和列表数据。
 *
 * 页面挂载后调用，新增、编辑、删除成功后也会再次调用；
 * 当前通过 mock service 获取数据，后续接入后端后优先替换 service 内部实现。
 * 操作后重新加载列表，是为了让页面展示和 service 数据源保持一致，
 * 并让搜索、筛选继续基于最新列表派生结果。
 */
async function loadPromptData() {
  // 当前从前端 mock service 读取数据；后端接入后优先替换 service 内部实现。
  const [categoryData, promptData] = await Promise.all([
    getPromptCategories(),
    getPromptList(),
  ]);

  categories.value = categoryData;
  prompts.value = promptData;
}

/**
 * 将表格行数据转换为弹窗表单数据。
 *
 * 点击编辑时调用，只提取表单需要维护的业务字段；
 * id 和 updatedAt 仍由父页面/service 负责，不传入子组件表单。
 *
 * @param prompt 当前要编辑的提示词列表项
 * @returns 可传给 PromptFormDialog 的表单数据
 */
function toFormData(prompt: PromptItem): PromptFormData {
  // 编辑弹窗只需要表单字段，所以把列表行数据转换为 PromptFormData，避免把 id/updatedAt 传入表单。
  return {
    title: prompt.title,
    category: prompt.category,
    content: prompt.content,
    tags: [...prompt.tags],
    usageScene: prompt.usageScene,
  };
}

/**
 * 打开新增提示词弹窗。
 *
 * 用户点击“新增提示词”时调用，父组件将弹窗模式设为 create，
 * 清空当前编辑 id 和回填数据，让子组件展示空表单。
 */
function handleCreate() {
  // create 模式不需要当前编辑 id 和回填数据，弹窗会显示空表单。
  dialogMode.value = 'create';
  editingPromptId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

/**
 * 打开编辑提示词弹窗。
 *
 * 用户点击表格行“编辑”时调用，父组件记录当前行 id，
 * 并把列表项转换为表单数据传给子组件用于回填。
 *
 * @param prompt 当前要编辑的提示词列表项
 */
function handleEdit(prompt: PromptItem) {
  // edit 模式记录当前行 id，并把行数据转换成表单数据交给弹窗回填。
  dialogMode.value = 'edit';
  editingPromptId.value = prompt.id;
  currentFormData.value = toFormData(prompt);
  dialogVisible.value = true;
}

/**
 * 根据当前弹窗模式处理子组件提交的表单数据。
 *
 * PromptFormDialog 通过 submit emit 把表单结果交回父组件；
 * 父组件根据 dialogMode 决定调用新增或编辑 service。
 * 提交成功后关闭弹窗并重新加载列表，让当前表格与 mock service 数据源保持一致。
 *
 * @param data 新增或编辑弹窗提交的提示词表单数据
 */
async function handleSubmit(data: PromptFormData) {
  // 新增/编辑共用提交入口，通过 mode 决定调用 create 还是 update 的 mock CRUD 方法。
  if (dialogMode.value === 'create') {
    await createPrompt(data);
    ElMessage.success('新增提示词成功');
  } else if (editingPromptId.value !== null) {
    await updatePrompt(editingPromptId.value, data);
    ElMessage.success('编辑提示词成功');
  }

  dialogVisible.value = false;
  // CRUD 后重新读取 service 数据，确保搜索和分类筛选基于最新列表计算。
  await loadPromptData();
}

/**
 * 删除一条提示词数据。
 *
 * 用户点击表格行“删除”时调用；删除前先弹出确认框，
 * 是为了避免误删当前 mock 列表中的数据。确认后调用 service 删除，
 * 再重新加载列表，让搜索和分类筛选基于最新数据继续生效。
 *
 * @param prompt 当前要删除的提示词列表项
 */
async function handleDelete(prompt: PromptItem) {
  try {
    // 删除前先让用户确认，避免误操作；当前删除只影响前端 mock 内存数据。
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
