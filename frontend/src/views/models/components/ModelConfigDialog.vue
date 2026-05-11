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

/**
 * 创建模型配置弹窗的默认空表单数据。
 *
 * 新增模式打开弹窗或编辑数据为空时使用；新增/编辑共用同一个弹窗，
 * 所以需要一份本地可修改的默认表单，避免直接修改父组件传入的 props。
 * 当前表单不处理真实 API Key，只维护模型配置的基础 mock 字段。
 *
 * @returns 默认的模型配置表单数据
 */
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

// 子组件维护本地表单状态，避免直接修改 props 中由父组件传入的数据。
const formData = reactive<ModelConfigFormData>(emptyFormData());

// 新增/编辑共用一个弹窗，通过 mode 判断展示不同标题。
const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增模型配置' : '编辑模型配置',
);

/**
 * 监听父组件传入的弹窗状态、模式和 initialData。
 *
 * props 由父组件传入，子组件不能直接修改；
 * 弹窗打开、mode 或 initialData 变化时，把父组件数据同步到本地 formData。
 * mode 决定弹窗标题和表单回填方式：create 使用默认空表单，edit 使用当前行数据。
 */
watch(
  // 弹窗打开、模式或回填数据变化时，把父组件 props 同步到本地表单。
  () => [props.visible, props.mode, props.initialData] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }

    // 新增模式使用默认空表单；编辑模式用 initialData 回填当前行配置。
    Object.assign(formData, props.initialData ?? emptyFormData());
  },
  { immediate: true },
);

/**
 * 关闭模型配置表单弹窗。
 *
 * 用户点击取消或弹窗关闭时调用，通过 update:visible emit 通知父组件
 * 更新弹窗显隐状态，子组件不直接修改父组件状态。
 */
function handleClose() {
  emit('update:visible', false);
}

/**
 * 提交模型配置表单数据。
 *
 * 用户点击保存时调用，子组件只负责提交当前本地表单副本，
 * 再通过 submit emit 把结果交回父组件；真正的新增或编辑由父组件根据 mode 处理。
 * 当前不处理真实 API Key，也不做真实模型连通性测试。
 */
function handleSubmit() {
  // 弹窗只 emit 表单数据，真正的 create/update 由父页面根据 mode 处理。
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
