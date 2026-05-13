<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="680px"
    @close="handleClose"
  >
    <el-alert
      class="knowledge-form__alert"
      show-icon
      title="当前只维护知识库文档 mock 元数据，不上传文件、不解析、不切片、不向量化。"
      type="info"
      :closable="false"
    />

    <el-form label-position="top" class="knowledge-form">
      <el-form-item label="文档标题" required>
        <el-input v-model="formData.title" placeholder="请输入文档标题" />
      </el-form-item>

      <div class="knowledge-form__row">
        <el-form-item label="文档分类" required>
          <el-select
            v-model="formData.category"
            class="knowledge-form__full"
            placeholder="请选择分类"
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="来源类型" required>
          <el-select
            v-model="formData.sourceType"
            class="knowledge-form__full"
            placeholder="请选择来源类型"
          >
            <el-option label="手工录入" value="manual" />
            <el-option label="PDF 文档" value="pdf" />
            <el-option label="网页来源" value="web" />
            <el-option label="Markdown" value="markdown" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="来源名称" required>
        <el-input
          v-model="formData.sourceName"
          placeholder="请输入文件名、网页标题或手工来源说明"
        />
      </el-form-item>

      <el-form-item label="文档摘要" required>
        <el-input
          v-model="formData.summary"
          :rows="4"
          placeholder="请输入文档摘要"
          type="textarea"
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-input
          v-model="tagsText"
          placeholder="多个标签请用逗号分隔，例如：RAG, 产品, FAQ"
        />
      </el-form-item>

      <div class="knowledge-form__row">
        <el-form-item label="mock 切片数量">
          <el-input-number
            v-model="formData.chunkCount"
            :min="0"
            :max="999"
            class="knowledge-form__full"
          />
        </el-form-item>

        <el-form-item label="mock 向量化状态">
          <el-select
            v-model="formData.vectorStatus"
            class="knowledge-form__full"
          >
            <el-option label="未开始" value="not_started" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="是否启用">
        <el-switch v-model="formData.enabled" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

import type {
  KnowledgeCategory,
  KnowledgeDialogMode,
  KnowledgeDocumentFormData,
} from '@/types/knowledge';

const emptyFormData = (): KnowledgeDocumentFormData => ({
  title: '',
  category: '',
  sourceType: 'manual',
  sourceName: '',
  summary: '',
  tags: [],
  chunkCount: 0,
  vectorStatus: 'not_started',
  enabled: true,
});

// props 接收父组件控制的弹窗显隐、模式、分类选项和编辑回填数据；子组件只读 props，不直接修改。
const props = defineProps<{
  visible: boolean;
  mode: KnowledgeDialogMode;
  initialData: KnowledgeDocumentFormData | null;
  categories: KnowledgeCategory[];
}>();

// emit 用于通知父组件关闭弹窗或提交表单，真正的 create/update 由父组件调用 service 完成。
const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: KnowledgeDocumentFormData];
}>();

const formData = reactive<KnowledgeDocumentFormData>(emptyFormData());
const tagsText = ref('');

const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增知识库文档' : '编辑知识库文档',
);

const canSubmit = computed(() => {
  return (
    formData.title.trim().length > 0 &&
    formData.category.trim().length > 0 &&
    formData.sourceName.trim().length > 0 &&
    formData.summary.trim().length > 0
  );
});

/**
 * 监听父组件传入的 visible、mode 和 initialData，同步到本地表单副本。
 *
 * 新增 / 编辑共用弹窗，父组件通过 props 传入模式和初始数据；子组件不直接修改 props，
 * 因此在弹窗打开、mode 或 initialData 变化时，把数据同步到本地 formData。
 * create 模式重置为空表单，edit 模式回填当前行数据。
 */
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
    tagsText.value = nextFormData.tags.join(', ');
  },
  { immediate: true },
);

/**
 * 将表单里的逗号分隔标签文本转换成业务类型需要的 string[]。
 *
 * 表单中使用字符串输入更轻量，提交时再 split、trim、filter 成数组；
 * service 和列表展示始终使用 string[]，避免业务类型混乱。
 *
 * @returns 去除空项后的标签数组
 */
function parseTagsText() {
  return tagsText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * 关闭知识库文档表单弹窗。
 *
 * 用户点击取消或弹窗关闭时调用，通过 update:visible 通知父组件更新弹窗状态。
 */
function handleClose() {
  emit('update:visible', false);
}

/**
 * 提交知识库文档表单数据。
 *
 * 用户点击保存时调用，先做轻量必填校验，再把 tags 文本转换为 string[]；
 * 子组件只 emit 表单数据，不直接调用 service。当前提交的 chunkCount 和 vectorStatus
 * 都只是 mock 字段，不代表真实切片或真实向量化结果。
 */
function handleSubmit() {
  if (!canSubmit.value) {
    ElMessage.warning('请填写文档标题、分类、来源名称和摘要');
    return;
  }

  emit('submit', {
    ...formData,
    title: formData.title.trim(),
    category: formData.category.trim(),
    sourceName: formData.sourceName.trim(),
    summary: formData.summary.trim(),
    tags: parseTagsText(),
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

.knowledge-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.knowledge-form__full {
  width: 100%;
}

@media (max-width: 640px) {
  .knowledge-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
