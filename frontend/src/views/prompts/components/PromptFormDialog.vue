<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="640px"
    @close="handleClose"
  >
    <el-form label-position="top" class="prompt-form">
      <el-form-item label="标题">
        <el-input v-model="formData.title" placeholder="请输入 Prompt 标题" />
      </el-form-item>
      <el-form-item label="分类">
        <el-input v-model="formData.category" placeholder="例如：客服、代码、运营" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="formData.description"
          placeholder="请输入模板用途说明"
        />
      </el-form-item>
      <el-form-item label="使用场景">
        <el-input v-model="formData.scenario" placeholder="请输入适用场景" />
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="tagText" placeholder="多个标签用逗号分隔" />
      </el-form-item>
      <el-form-item label="启用状态">
        <el-switch
          v-model="formData.enabled"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="Prompt 内容">
        <el-input
          v-model="formData.content"
          :rows="8"
          placeholder="请输入完整 Prompt 内容"
          type="textarea"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import type {
  PromptDialogMode,
  PromptTemplateFormData,
} from '@/types/prompt';

const emptyFormData = (): PromptTemplateFormData => ({
  title: '',
  content: '',
  description: null,
  category: null,
  tags: [],
  scenario: null,
  enabled: true,
});

const props = defineProps<{
  visible: boolean;
  mode: PromptDialogMode;
  initialData: PromptTemplateFormData | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: PromptTemplateFormData];
}>();

const formData = reactive<PromptTemplateFormData>(emptyFormData());
const tagText = ref('');

const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增 Prompt 模板' : '编辑 Prompt 模板',
);

watch(
  () => [props.visible, props.initialData] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }

    const nextData = props.initialData ?? emptyFormData();
    Object.assign(formData, {
      ...nextData,
      tags: [...nextData.tags],
    });
    tagText.value = nextData.tags.join(', ');
  },
  { immediate: true },
);

function parseTags() {
  return tagText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue || null;
}

function handleClose() {
  if (props.submitting) {
    return;
  }

  emit('update:visible', false);
}

function handleSubmit() {
  emit('submit', {
    title: formData.title.trim(),
    content: formData.content.trim(),
    description: normalizeOptionalText(formData.description),
    category: normalizeOptionalText(formData.category),
    tags: parseTags(),
    scenario: normalizeOptionalText(formData.scenario),
    enabled: formData.enabled,
  });
}
</script>

<style scoped>
.prompt-form {
  padding-top: 4px;
}
</style>
