<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="!submitting"
    @close="handleClose"
  >
    <el-alert
      class="knowledge-form__alert"
      show-icon
      title="当前为手工录入并保存到后端的知识库文档，不上传文件、不自动解析、不做 embedding 或 RAG 检索。"
      type="info"
      :closable="false"
    />

    <el-form label-position="top" class="knowledge-form">
      <el-form-item label="文档标题" required>
        <el-input v-model="formData.title" placeholder="请输入文档标题" />
      </el-form-item>

      <el-form-item label="文档正文" required>
        <el-input
          v-model="formData.content"
          :rows="10"
          placeholder="请输入将由 ChatTest 手动选择作为上下文的文档正文"
          type="textarea"
        />
      </el-form-item>

      <el-form-item label="文档摘要">
        <el-input
          v-model="summaryText"
          :rows="3"
          placeholder="可选，当前由用户手动填写，不做 AI 自动摘要"
          type="textarea"
        />
      </el-form-item>

      <el-form-item label="来源名称">
        <el-input
          v-model="sourceNameText"
          placeholder="可选，例如：产品手册、客服规则或手工录入"
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-input
          v-model="tagsText"
          placeholder="多个标签请用逗号分隔，例如：产品, FAQ, 规则"
        />
      </el-form-item>

      <el-form-item label="是否启用">
        <el-switch v-model="formData.enabled" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSubmit"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

import type {
  KnowledgeDialogMode,
  KnowledgeDocumentFormData,
} from '@/types/knowledge';

const emptyFormData = (): KnowledgeDocumentFormData => ({
  title: '',
  content: '',
  summary: null,
  sourceName: null,
  tags: [],
  enabled: true,
});

const props = defineProps<{
  visible: boolean;
  mode: KnowledgeDialogMode;
  initialData: KnowledgeDocumentFormData | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: KnowledgeDocumentFormData];
}>();

const formData = reactive<KnowledgeDocumentFormData>(emptyFormData());
const summaryText = ref('');
const sourceNameText = ref('');
const tagsText = ref('');

const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增知识库文档' : '编辑知识库文档',
);

const canSubmit = computed(
  () =>
    !props.submitting &&
    formData.title.trim().length > 0 &&
    formData.content.trim().length > 0,
);

watch(
  () => [props.visible, props.mode, props.initialData] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }

    const nextFormData = props.initialData ?? emptyFormData();
    Object.assign(formData, {
      ...nextFormData,
      tags: [...nextFormData.tags],
    });
    summaryText.value = nextFormData.summary ?? '';
    sourceNameText.value = nextFormData.sourceName ?? '';
    tagsText.value = nextFormData.tags.join(', ');
  },
  { immediate: true },
);

function parseTagsText() {
  return [
    ...new Set(
      tagsText.value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    ),
  ];
}

function normalizeOptionalText(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue || null;
}

function handleClose() {
  if (!props.submitting) {
    emit('update:visible', false);
  }
}

function handleSubmit() {
  if (!canSubmit.value) {
    ElMessage.warning('请填写文档标题和正文');
    return;
  }

  emit('submit', {
    title: formData.title.trim(),
    content: formData.content.trim(),
    summary: normalizeOptionalText(summaryText.value),
    sourceName: normalizeOptionalText(sourceNameText.value),
    tags: parseTagsText(),
    enabled: formData.enabled,
  });
}
</script>

<style scoped>
.knowledge-form {
  padding-top: 12px;
}

.knowledge-form__alert {
  margin-bottom: 16px;
}
</style>
