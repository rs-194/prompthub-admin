<template>
  <div class="page-card">
    <div class="prompt-header">
      <h1>提示词管理</h1>
      <p>用于维护不同场景下的大模型提示词模板</p>
    </div>

    <div class="prompt-filters">
      <ElInput
        v-model="searchKeyword"
        class="prompt-filters__search"
        clearable
        placeholder="搜索标题、内容或使用场景"
      />
      <ElSelect
        v-model="selectedCategory"
        class="prompt-filters__category"
        clearable
        placeholder="选择分类"
      >
        <ElOption
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </ElSelect>
      <ElButton @click="handleReset">重置</ElButton>
    </div>

    <ElTable :data="filteredPrompts" stripe>
      <ElTableColumn prop="title" label="标题" min-width="180" />
      <ElTableColumn label="分类" min-width="120">
        <template #default="{ row }: { row: PromptItem }">
          {{ getCategoryLabel(row.category) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="usageScene" label="使用场景" min-width="220" />
      <ElTableColumn label="标签" min-width="180">
        <template #default="{ row }: { row: PromptItem }">
          <div class="prompt-tags">
            <ElTag
              v-for="tag in row.tags"
              :key="tag"
              effect="light"
              size="small"
            >
              {{ tag }}
            </ElTag>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="updatedAt" label="更新时间" min-width="160" />
    </ElTable>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  ElButton,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getPromptCategories, getPromptList } from '@/services/prompt';
import type { PromptCategory, PromptItem } from '@/types/prompt';

const searchKeyword = ref('');
const selectedCategory = ref('');
const categories = ref<PromptCategory[]>([]);
const prompts = ref<PromptItem[]>([]);

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

onMounted(async () => {
  const [categoryData, promptData] = await Promise.all([
    getPromptCategories(),
    getPromptList(),
  ]);

  categories.value = categoryData;
  prompts.value = promptData;
});
</script>

<style scoped>
.prompt-header {
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
  .prompt-filters,
  .prompt-filters__search,
  .prompt-filters__category {
    width: 100%;
  }
}
</style>
