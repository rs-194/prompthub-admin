<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="620px"
    @close="handleClose"
  >
    <el-form label-position="top" class="model-config-form">
      <el-form-item label="配置名称">
        <el-input v-model="formData.name" placeholder="请输入模型配置名称" />
      </el-form-item>
      <el-form-item label="模型供应商">
        <el-select
          v-model="formData.provider"
          class="model-config-form__full"
          placeholder="请选择模型供应商"
        >
          <el-option label="OpenAI Compatible" value="openai-compatible" />
          <el-option label="DeepSeek" value="deepseek" />
          <el-option label="Custom" value="custom" />
        </el-select>
      </el-form-item>
      <el-form-item label="API Base URL">
        <el-input v-model="formData.baseUrl" placeholder="请输入 API Base URL" />
      </el-form-item>
      <el-form-item label="模型标识">
        <el-input v-model="formData.modelName" placeholder="请输入模型标识 modelName" />
      </el-form-item>
      <div class="model-config-form__row">
        <el-form-item label="temperature">
          <el-input-number
            v-model="formData.temperature"
            :max="2"
            :min="0"
            :precision="2"
            :step="0.1"
            class="model-config-form__number"
          />
        </el-form-item>
        <el-form-item label="maxTokens">
          <el-input-number
            v-model="formData.maxTokens"
            :max="32768"
            :min="1"
            :step="256"
            class="model-config-form__number"
          />
        </el-form-item>
      </div>
      <el-form-item label="是否启用">
        <el-switch v-model="formData.enabled" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          :rows="3"
          placeholder="请输入备注"
          type="textarea"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import type {
  ModelConfigDialogMode,
  ModelConfigFormData,
} from '@/types/model';

const emptyFormData = (): ModelConfigFormData => ({
  name: '',
  provider: 'openai-compatible',
  baseUrl: '',
  modelName: '',
  temperature: 0.7,
  maxTokens: 2048,
  enabled: true,
  remark: '',
});

// props 用来接收父页面传入的弹窗显隐、模式和编辑回填数据。
const props = defineProps<{
  visible: boolean;
  mode: ModelConfigDialogMode;
  initialData: ModelConfigFormData | null;
}>();

// emit 用来把关闭弹窗和提交表单这两类事件通知给父页面。
const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: ModelConfigFormData];
}>();

const formData = reactive<ModelConfigFormData>(emptyFormData());

// 新增/编辑共用一个弹窗，通过 mode 判断展示不同标题。
const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增模型配置' : '编辑模型配置',
);

watch(
  () => [props.visible, props.mode, props.initialData] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }

    // 弹窗打开时把 props 同步到本地表单，避免子组件直接修改父组件数据。
    Object.assign(formData, props.initialData ?? emptyFormData());
  },
  { immediate: true },
);

function handleClose() {
  emit('update:visible', false);
}

function handleSubmit() {
  emit('submit', { ...formData });
}
</script>

<style scoped>
.model-config-form {
  padding-top: 4px;
}

.model-config-form__full {
  width: 100%;
}

.model-config-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.model-config-form__number {
  width: 100%;
}

@media (max-width: 640px) {
  .model-config-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
