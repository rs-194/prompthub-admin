<template>
  <div class="page-card">
    <div class="model-config-header">
      <div>
        <h1>模型配置</h1>
        <p>用于维护 Prompt 调试台可选择的大模型接口配置</p>
      </div>
      <el-button type="primary" @click="handleCreate">新增模型配置</el-button>
    </div>

    <div class="model-config-filters">
      <el-input
        v-model="searchKeyword"
        class="model-config-filters__search"
        clearable
        placeholder="搜索名称、模型标识、Base URL 或备注"
      />
      <el-select
        v-model="selectedProvider"
        class="model-config-filters__provider"
        clearable
        placeholder="选择供应商"
      >
        <el-option
          v-for="provider in providerOptions"
          :key="provider.value"
          :label="provider.label"
          :value="provider.value"
        />
      </el-select>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="filteredModelConfigs" stripe>
      <el-table-column prop="name" label="配置名称" min-width="170" />
      <el-table-column label="供应商" min-width="150">
        <template #default="{ row }">
          {{ getProviderLabel(row.provider) }}
        </template>
      </el-table-column>
      <el-table-column prop="baseUrl" label="Base URL" min-width="220" show-overflow-tooltip />
      <el-table-column prop="modelName" label="模型标识" min-width="170" />
      <el-table-column prop="temperature" label="temperature" width="120" />
      <el-table-column prop="maxTokens" label="maxTokens" width="120" />
      <el-table-column label="启用状态" width="110">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            @change="handleSwitchChange(row, $event)"
          />
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

    <model-config-dialog
      v-model:visible="dialogVisible"
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
  createModelConfig,
  deleteModelConfig,
  getModelConfigList,
  toggleModelConfigEnabled,
  updateModelConfig,
} from '@/services/model';
import type {
  ModelConfigDialogMode,
  ModelConfigFormData,
  ModelConfigItem,
  ModelProvider,
} from '@/types/model';
import ModelConfigDialog from './components/ModelConfigDialog.vue';

interface ProviderOption {
  label: string;
  value: ModelProvider;
}

const providerOptions: ProviderOption[] = [
  { label: 'OpenAI Compatible', value: 'openai-compatible' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Custom', value: 'custom' },
];

const searchKeyword = ref('');
const selectedProvider = ref<ModelProvider | ''>('');
const modelConfigs = ref<ModelConfigItem[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<ModelConfigDialogMode>('create');
const editingModelConfigId = ref<number | null>(null);
const currentFormData = ref<ModelConfigFormData | null>(null);

const providerLabelMap = computed(() => {
  return providerOptions.reduce<Record<ModelProvider, string>>(
    (map, provider) => {
      map[provider.value] = provider.label;
      return map;
    },
    {
      'openai-compatible': '',
      deepseek: '',
      custom: '',
    },
  );
});

const filteredModelConfigs = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return modelConfigs.value.filter((model) => {
    const matchesKeyword =
      keyword.length === 0 ||
      model.name.toLowerCase().includes(keyword) ||
      model.modelName.toLowerCase().includes(keyword) ||
      model.baseUrl.toLowerCase().includes(keyword) ||
      model.remark.toLowerCase().includes(keyword);
    const matchesProvider =
      selectedProvider.value.length === 0 ||
      model.provider === selectedProvider.value;

    return matchesKeyword && matchesProvider;
  });
});

function getProviderLabel(provider: ModelProvider) {
  return providerLabelMap.value[provider] || provider;
}

function handleReset() {
  searchKeyword.value = '';
  selectedProvider.value = '';
}

async function loadModelConfigData() {
  modelConfigs.value = await getModelConfigList();
}

function toFormData(model: ModelConfigItem): ModelConfigFormData {
  return {
    name: model.name,
    provider: model.provider,
    baseUrl: model.baseUrl,
    modelName: model.modelName,
    temperature: model.temperature,
    maxTokens: model.maxTokens,
    enabled: model.enabled,
    remark: model.remark,
  };
}

function handleCreate() {
  dialogMode.value = 'create';
  editingModelConfigId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

function handleEdit(model: ModelConfigItem) {
  dialogMode.value = 'edit';
  editingModelConfigId.value = model.id;
  currentFormData.value = toFormData(model);
  dialogVisible.value = true;
}

async function handleSubmit(data: ModelConfigFormData) {
  if (dialogMode.value === 'create') {
    await createModelConfig(data);
    ElMessage.success('新增模型配置成功');
  } else if (editingModelConfigId.value !== null) {
    // 新增/编辑共用弹窗，提交时通过 mode 判断调用哪个 mock CRUD 方法。
    await updateModelConfig(editingModelConfigId.value, data);
    ElMessage.success('编辑模型配置成功');
  }

  dialogVisible.value = false;
  // CRUD 后重新读取 service 数据，确保搜索和供应商筛选基于最新列表计算。
  await loadModelConfigData();
}

async function handleDelete(model: ModelConfigItem) {
  try {
    // 删除前用确认弹窗避免误删；当前删除只影响前端 mock 内存数据。
    await ElMessageBox.confirm(`确认删除“${model.name}”吗？`, '删除模型配置', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await deleteModelConfig(model.id);
    ElMessage.success('删除模型配置成功');
    // 删除后刷新列表，保持表格、搜索、供应商筛选都读取最新数据。
    await loadModelConfigData();
  } catch {
    // 用户取消删除时不需要额外提示。
  }
}

async function handleToggleEnabled(model: ModelConfigItem, enabled: boolean) {
  // 启用/停用只改变 enabled 状态，其他配置项保持不变。
  await toggleModelConfigEnabled(model.id, enabled);
  ElMessage.success(enabled ? '已启用模型配置' : '已停用模型配置');
  // toggle 后刷新列表，让更新时间和筛选结果都保持最新。
  await loadModelConfigData();
}

function handleSwitchChange(
  model: ModelConfigItem,
  enabled: string | number | boolean,
) {
  return handleToggleEnabled(model, Boolean(enabled));
}

onMounted(loadModelConfigData);
</script>

<style scoped>
.model-config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.model-config-header p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.model-config-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.model-config-filters__search {
  width: 340px;
}

.model-config-filters__provider {
  width: 200px;
}

@media (max-width: 640px) {
  .model-config-header {
    flex-direction: column;
  }

  .model-config-filters,
  .model-config-filters__search,
  .model-config-filters__provider {
    width: 100%;
  }
}
</style>
