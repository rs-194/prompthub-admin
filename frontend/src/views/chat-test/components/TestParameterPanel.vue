<script setup lang="ts">
import type { ChatTestOutputFormat, ChatTestParams } from '@/types/chatTest';

// 展示 Prompt 调试台测试参数，本组件只负责表单 UI 和 v-model 通信，不调用 service、不维护结果状态。
const props = defineProps<{
  modelValue: ChatTestParams;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: ChatTestParams): void;
}>();

const outputFormatOptions: Array<{ label: string; value: ChatTestOutputFormat }> = [
  { label: 'Text', value: 'text' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'JSON', value: 'json' },
];

function updateParams(patch: Partial<ChatTestParams>) {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  });
}

function handleTemperatureChange(value: number | undefined) {
  updateParams({ temperature: Number(value ?? 0.7) });
}

function handleMaxTokensChange(value: number | undefined) {
  updateParams({ maxTokens: Number(value ?? 800) });
}

function handleOutputFormatChange(value: ChatTestOutputFormat) {
  updateParams({ outputFormat: value });
}
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>测试参数</span>
        <el-tag size="small" type="success" effect="plain">随请求发送</el-tag>
      </div>
    </template>

    <el-alert
      title="这些参数会随本次调试请求发送给后端真实 LLM 调用。"
      description="outputFormat 是期望输出格式提示，不保证模型一定返回合法 JSON；真实模型和 API Key 仍由后端配置控制。"
      type="info"
      show-icon
      :closable="false"
      class="parameter-alert"
    />

    <el-form label-position="top" class="parameter-form">
      <el-form-item label="Temperature">
        <el-input-number
          :model-value="modelValue.temperature"
          :min="0"
          :max="2"
          :step="0.1"
          :precision="1"
          controls-position="right"
          class="full-width"
          @update:model-value="handleTemperatureChange"
        />
        <div class="parameter-tip">
          数值越低越稳定，越高越发散；后端仍会做边界保护。
        </div>
      </el-form-item>

      <el-form-item label="Max tokens">
        <el-input-number
          :model-value="modelValue.maxTokens"
          :min="128"
          :max="4096"
          :step="128"
          controls-position="right"
          class="full-width"
          @update:model-value="handleMaxTokensChange"
        />
        <div class="parameter-tip">
          控制本次期望输出长度上限，较大值可能带来更长等待时间。
        </div>
      </el-form-item>

      <el-form-item label="输出格式">
        <el-select
          :model-value="modelValue.outputFormat"
          placeholder="请选择输出格式"
          class="full-width"
          @update:model-value="handleOutputFormatChange"
        >
          <el-option
            v-for="option in outputFormatOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <div class="parameter-tip">
          用于提示模型按文本、Markdown 或 JSON 风格输出，不是强制格式校验。
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.parameter-alert {
  margin-bottom: 16px;
}

.parameter-form {
  display: flex;
  flex-direction: column;
}

.full-width {
  width: 100%;
}

.parameter-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
</style>
