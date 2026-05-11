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

// 页面状态只负责当前模型配置页的搜索、供应商筛选、列表、弹窗和当前编辑项。
const searchKeyword = ref('');
const selectedProvider = ref<ModelProvider | ''>('');
const modelConfigs = ref<ModelConfigItem[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<ModelConfigDialogMode>('create');
const editingModelConfigId = ref<number | null>(null);
const currentFormData = ref<ModelConfigFormData | null>(null);

// 供应商中文展示文案由静态选项派生，用 computed 保持映射和选项来源一致。
/**
 * 根据供应商选项派生 provider 到展示文案的映射。
 *
 * 这是由 providerOptions 计算出来的展示辅助数据，不是独立状态；
 * 表格展示供应商名称时通过它把 provider value 转为可读 label。
 */
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

// 表格展示数据由原始列表、搜索词和供应商筛选推导，因此使用 computed 自动更新。
/**
 * 根据模型配置列表、搜索词和供应商筛选派生表格最终数据。
 *
 * computed 只负责派生展示结果，不额外维护一份筛选后的状态；
 * 搜索会匹配配置名称、模型标识、Base URL 和备注，
 * 供应商筛选会匹配 provider，两个条件共同决定最终列表。
 */
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

/**
 * 获取 provider value 对应的展示文案。
 *
 * 表格渲染供应商列时调用，优先从 providerLabelMap 中取 label；
 * 如果没有匹配项，则回退展示原始 provider。
 *
 * @param provider 模型配置数据中的供应商 value
 * @returns 供应商展示文案或原始 provider
 */
function getProviderLabel(provider: ModelProvider) {
  return providerLabelMap.value[provider] || provider;
}

/**
 * 重置模型配置列表筛选条件。
 *
 * 用户点击“重置”时调用，只清空搜索词和供应商筛选；
 * filteredModelConfigs 会根据最新条件自动恢复为当前 service 列表的完整展示结果。
 */
function handleReset() {
  searchKeyword.value = '';
  selectedProvider.value = '';
}

/**
 * 加载模型配置列表数据。
 *
 * 页面挂载后调用，新增、编辑、删除和启用/停用成功后也会再次调用；
 * 当前通过 mock service 获取数据，后续接入后端后优先替换 service 内部实现。
 * 操作后重新加载列表，是为了让页面展示和 service 数据源保持一致，
 * 并让搜索、供应商筛选继续基于最新列表派生结果。
 */
async function loadModelConfigData() {
  // 当前从前端 mock service 读取；后端接入后优先替换 service 内部实现。
  modelConfigs.value = await getModelConfigList();
}

/**
 * 将表格行数据转换为模型配置弹窗表单数据。
 *
 * 点击编辑时调用，只提取表单需要维护的可编辑字段；
 * id 和 updatedAt 仍由父页面/service 负责，不传入子组件表单。
 *
 * @param model 当前要编辑的模型配置列表项
 * @returns 可传给 ModelConfigDialog 的表单数据
 */
function toFormData(model: ModelConfigItem): ModelConfigFormData {
  // 编辑表单只需要可修改字段，所以不把 id/updatedAt 传给弹窗。
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

/**
 * 打开新增模型配置弹窗。
 *
 * 用户点击“新增模型配置”时调用，父组件将弹窗模式设为 create，
 * 清空当前编辑 id 和回填数据，让子组件展示默认空表单。
 */
function handleCreate() {
  // create 模式清空编辑 id 和回填数据，弹窗会使用默认空表单。
  dialogMode.value = 'create';
  editingModelConfigId.value = null;
  currentFormData.value = null;
  dialogVisible.value = true;
}

/**
 * 打开编辑模型配置弹窗。
 *
 * 用户点击表格行“编辑”时调用，父组件记录当前行 id，
 * 并把列表项转换为表单数据传给子组件用于回填。
 *
 * @param model 当前要编辑的模型配置列表项
 */
function handleEdit(model: ModelConfigItem) {
  // edit 模式记录当前行 id，并把列表行转换成表单数据用于回填。
  dialogMode.value = 'edit';
  editingModelConfigId.value = model.id;
  currentFormData.value = toFormData(model);
  dialogVisible.value = true;
}

/**
 * 根据当前弹窗模式处理子组件提交的表单数据。
 *
 * ModelConfigDialog 通过 submit emit 把表单结果交回父组件；
 * 父组件根据 dialogMode 决定调用新增或编辑 service。
 * 提交成功后关闭弹窗并重新加载列表，让当前表格与 mock service 数据源保持一致。
 *
 * @param data 新增或编辑弹窗提交的模型配置表单数据
 */
async function handleSubmit(data: ModelConfigFormData) {
  // 新增/编辑共用提交入口，通过 mode 决定调用 create 还是 update 的 mock CRUD 方法。
  if (dialogMode.value === 'create') {
    await createModelConfig(data);
    ElMessage.success('新增模型配置成功');
  } else if (editingModelConfigId.value !== null) {
    await updateModelConfig(editingModelConfigId.value, data);
    ElMessage.success('编辑模型配置成功');
  }

  dialogVisible.value = false;
  // CRUD 后重新读取 service 数据，确保搜索和供应商筛选基于最新列表计算。
  await loadModelConfigData();
}

/**
 * 删除一条模型配置数据。
 *
 * 用户点击表格行“删除”时调用；删除前先弹出确认框，
 * 是为了避免误删当前 mock 列表中的配置。确认后调用 service 删除，
 * 再重新加载列表，让搜索和供应商筛选基于最新数据继续生效。
 *
 * @param model 当前要删除的模型配置列表项
 */
async function handleDelete(model: ModelConfigItem) {
  try {
    // 删除前先让用户确认，避免误操作；当前删除只影响前端 mock 内存数据。
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

/**
 * 切换模型配置启用状态。
 *
 * 用户切换表格中的开关时调用；当前阶段只是 mock 状态切换，
 * 只更新 enabled 字段和更新时间，不涉及真实模型连通性测试或模型 API 调用。
 * 切换完成后重新加载列表，让启用状态和更新时间保持最新。
 *
 * @param model 当前要切换状态的模型配置列表项
 * @param enabled 目标启用状态，true 表示启用，false 表示停用
 */
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
