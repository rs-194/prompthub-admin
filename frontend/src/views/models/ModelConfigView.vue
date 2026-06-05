<template>
  <div class="page-card">
    <div class="model-config-header">
      <div>
        <h1>模型配置</h1>
        <p>展示后端可信 LLM 环境配置状态，同时保留前端 mock 模型列表用于页面演示。</p>
      </div>
      <el-button type="primary" @click="handleCreate">
        新增前端 mock 配置
      </el-button>
    </div>

    <section class="backend-config-panel">
      <div class="backend-config-panel__header">
        <div>
          <h2>后端真实调用配置</h2>
          <p>读取自后端环境变量，仅展示脱敏状态，不显示 API Key。</p>
        </div>
        <el-button :loading="backendConfigLoading" @click="loadBackendModelConfig">
          刷新
        </el-button>
      </div>

      <div v-if="backendConfigError" class="backend-config-panel__error">
        {{ backendConfigError }}
      </div>

      <div v-else-if="backendConfig" class="backend-config-panel__body">
        <div class="status-line" :class="{ 'status-line--ready': backendConfig.enabled }">
          {{ backendConfig.enabled
            ? '后端 LLM 配置已就绪，ChatTest 可调用真实模型'
            : '后端 LLM 配置未完整，ChatTest 真实调用不可用' }}
        </div>

        <div class="backend-config-grid">
          <div class="backend-config-item">
            <span>provider</span>
            <strong>{{ backendConfig.provider || '-' }}</strong>
          </div>
          <div class="backend-config-item">
            <span>model</span>
            <strong>{{ backendConfig.model || '-' }}</strong>
          </div>
          <div class="backend-config-item">
            <span>baseUrlHost</span>
            <strong>{{ backendConfig.baseUrlHost || '-' }}</strong>
          </div>
          <div class="backend-config-item">
            <span>enabled</span>
            <el-tag :type="backendConfig.enabled ? 'success' : 'info'">
              {{ backendConfig.enabled ? '已就绪' : '未完整' }}
            </el-tag>
          </div>
          <div class="backend-config-item">
            <span>API Key</span>
            <el-tag :type="backendConfig.apiKeyConfigured ? 'success' : 'warning'">
              {{ backendConfig.apiKeyConfigured ? '已配置' : '未配置' }}
            </el-tag>
          </div>
          <div class="backend-config-item">
            <span>temperature</span>
            <strong>{{ backendConfig.temperature }}</strong>
          </div>
          <div class="backend-config-item">
            <span>maxTokens</span>
            <strong>{{ backendConfig.maxTokens }}</strong>
          </div>
          <div class="backend-config-item">
            <span>timeoutSeconds</span>
            <strong>{{ backendConfig.timeoutSeconds }}</strong>
          </div>
        </div>
      </div>

      <div v-else class="backend-config-panel__empty">
        正在读取后端模型配置状态...
      </div>
    </section>

    <section class="mock-list-panel">
      <div class="mock-list-panel__header">
        <div>
          <h2>前端展示用 mock 模型列表</h2>
          <p>此列表只影响前端页面展示和 TestRecord 展示字段，不会改变后端真实调用的 LLM_MODEL。</p>
        </div>
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
        <el-table-column prop="baseUrl" label="Mock Base URL" min-width="220" show-overflow-tooltip />
        <el-table-column prop="modelName" label="前端展示模型标识" min-width="170" />
        <el-table-column prop="temperature" label="temperature" width="120" />
        <el-table-column prop="maxTokens" label="maxTokens" width="120" />
        <el-table-column label="mock 启用状态" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              @change="handleSwitchChange(row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
        <el-table-column label="mock 操作" fixed="right" width="170">
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
    </section>

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
  getModelConfig,
  getModelConfigList,
  toggleModelConfigEnabled,
  updateModelConfig,
} from '@/services/model';
import type {
  BackendModelConfigStatus,
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
const backendConfig = ref<BackendModelConfigStatus | null>(null);
const backendConfigLoading = ref(false);
const backendConfigError = ref('');
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

async function loadBackendModelConfig() {
  backendConfigLoading.value = true;
  backendConfigError.value = '';

  try {
    backendConfig.value = await getModelConfig();
  } catch (error) {
    backendConfig.value = null;
    backendConfigError.value =
      error instanceof Error
        ? error.message
        : '后端模型配置状态读取失败';
  } finally {
    backendConfigLoading.value = false;
  }
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
    ElMessage.success('新增前端 mock 模型配置成功');
  } else if (editingModelConfigId.value !== null) {
    await updateModelConfig(editingModelConfigId.value, data);
    ElMessage.success('编辑前端 mock 模型配置成功');
  }

  dialogVisible.value = false;
  await loadModelConfigData();
}

async function handleDelete(model: ModelConfigItem) {
  try {
    await ElMessageBox.confirm(`确认删除前端 mock 配置“${model.name}”吗？`, '删除 mock 模型配置', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await deleteModelConfig(model.id);
    ElMessage.success('删除前端 mock 模型配置成功');
    await loadModelConfigData();
  } catch {
    // 用户取消删除时不需要额外提示。
  }
}

async function handleToggleEnabled(model: ModelConfigItem, enabled: boolean) {
  await toggleModelConfigEnabled(model.id, enabled);
  ElMessage.success(enabled ? '已启用前端 mock 配置' : '已停用前端 mock 配置');
  await loadModelConfigData();
}

function handleSwitchChange(
  model: ModelConfigItem,
  enabled: string | number | boolean,
) {
  return handleToggleEnabled(model, Boolean(enabled));
}

onMounted(() => {
  void loadBackendModelConfig();
  void loadModelConfigData();
});
</script>

<style scoped>
.model-config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.model-config-header p,
.backend-config-panel__header p,
.mock-list-panel__header p {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 22px;
}

.backend-config-panel,
.mock-list-panel {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}

.backend-config-panel {
  margin-bottom: 20px;
}

.backend-config-panel__header,
.mock-list-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.backend-config-panel h2,
.mock-list-panel h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.backend-config-panel__error {
  border: 1px solid #f5c2c7;
  border-radius: 6px;
  padding: 12px;
  color: #b42318;
  background: #fff1f3;
}

.backend-config-panel__empty {
  color: #909399;
}

.status-line {
  margin-bottom: 16px;
  border-radius: 6px;
  padding: 12px;
  color: #9a3412;
  background: #fff7ed;
}

.status-line--ready {
  color: #166534;
  background: #f0fdf4;
}

.backend-config-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 12px;
}

.backend-config-item {
  min-height: 72px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.backend-config-item span {
  display: block;
  margin-bottom: 8px;
  color: #909399;
  font-size: 13px;
}

.backend-config-item strong {
  color: #303133;
  font-size: 15px;
  word-break: break-word;
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

@media (max-width: 960px) {
  .backend-config-grid {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 640px) {
  .model-config-header,
  .backend-config-panel__header,
  .mock-list-panel__header {
    flex-direction: column;
  }

  .backend-config-grid {
    grid-template-columns: 1fr;
  }

  .model-config-filters,
  .model-config-filters__search,
  .model-config-filters__provider {
    width: 100%;
  }
}
</style>
