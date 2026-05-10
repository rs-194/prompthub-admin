<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="560px"
    @close="handleClose"
  >
    <el-form label-position="top" class="prompt-form">
      <el-form-item label="标题">
        <el-input v-model="formData.title" placeholder="请输入提示词标题" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select
          v-model="formData.category"
          class="prompt-form__full"
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
      <el-form-item label="使用场景">
        <el-input v-model="formData.usageScene" placeholder="请输入使用场景" />
      </el-form-item>
      <el-form-item label="标签">
        <el-input v-model="tagText" placeholder="多个标签用逗号分隔" />
      </el-form-item>
      <el-form-item label="提示词内容">
        <el-input
          v-model="formData.content"
          :rows="6"
          placeholder="请输入提示词内容"
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
import { computed, reactive, ref, watch } from 'vue';

import type {
  PromptCategory,
  PromptDialogMode,
  PromptFormData,
} from '@/types/prompt';

const emptyFormData = (): PromptFormData => ({
  title: '',
  category: '',
  usageScene: '',
  tags: [],
  content: '',
});

// props 用来接收父页面传入的弹窗状态、模式、编辑回填数据和分类选项。
const props = defineProps<{
  visible: boolean;
  mode: PromptDialogMode;
  initialData: PromptFormData | null;
  categories: PromptCategory[];
}>();

// emit 用来把关闭弹窗和提交表单这两类事件通知给父页面。
const emit = defineEmits<{
  'update:visible': [value: boolean];
  submit: [data: PromptFormData];
}>();

const formData = reactive<PromptFormData>(emptyFormData());
const tagText = ref('');

// 新增/编辑共用一个弹窗，通过 mode 判断展示不同标题。
const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增提示词' : '编辑提示词',
);

watch(
  //解构父组件传入的 visible 和 initialData 作为监听源，当它们变化时执行回调。
  () => [props.visible, props.initialData] as const,
  ([visible]) => {
    // 1. 守卫语句：如果弹窗是关闭状态（visible 为 false），啥也不干，直接返回
    if (!visible) {
      return;
    }
//  准备数据：如果有初始数据就用它，没有就生成一份空的
    const nextData = props.initialData ?? emptyFormData();
    Object.assign(formData, {
      ...nextData,
      tags: [...nextData.tags],
    });
    // 编辑回填时需要把 string[] 转成输入框可展示的逗号分隔字符串。（把多标签中间加上逗号）
    tagText.value = nextData.tags.join(', ');
  },
  { immediate: true },
);

function parseTags() {
  // 提交前把逗号分隔的标签字符串转换回业务需要的 string[]。
  return tagText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function handleClose() {
  emit('update:visible', false);
}

function handleSubmit() {
  emit('submit', {
    ...formData,
    tags: parseTags(),
  });
}
</script>

<style scoped>
.prompt-form {
  padding-top: 4px;
}

.prompt-form__full {
  width: 100%;
}
</style>
