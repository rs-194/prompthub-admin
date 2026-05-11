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

/**
 * 创建提示词弹窗的空表单数据。
 *
 * 新增模式打开弹窗或编辑数据为空时使用，保证子组件本地表单
 * 有一份独立可修改的数据，避免直接修改父组件传入的 props。
 *
 * @returns 默认的提示词表单数据
 */
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

// 子组件维护本地表单状态，避免直接修改 props 中由父组件传入的数据。
const formData = reactive<PromptFormData>(emptyFormData());
// 业务类型里 tags 是 string[]，表单里用逗号分隔字符串降低输入成本。
const tagText = ref('');

// 新增/编辑共用一个弹窗，通过 mode 判断展示不同标题。
const dialogTitle = computed(() =>
  props.mode === 'create' ? '新增提示词' : '编辑提示词',
);

/**
 * 监听父组件传入的弹窗状态和 initialData。
 *
 * props 是父组件传入的数据，子组件不能直接修改；
 * 因此弹窗打开或编辑回填数据变化时，需要把 initialData 同步到本地 formData。
 * 新增模式使用空表单，编辑模式使用父组件传入的当前行表单数据。
 */
watch(
  // 弹窗打开或回填数据变化时，把父组件 props 同步到本地表单。
  () => [props.visible, props.initialData] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }

    // 新增模式没有 initialData，所以重置为空表单；编辑模式使用当前行数据回填。
    const nextData = props.initialData ?? emptyFormData();
    Object.assign(formData, {
      ...nextData,
      tags: [...nextData.tags],
    });
    // 回填时把 string[] 转成输入框可展示的逗号分隔字符串。
    tagText.value = nextData.tags.join(', ');
  },
  { immediate: true },
);

/**
 * 将标签输入框文本转换为业务需要的标签数组。
 *
 * 表单中为了便于输入，tags 使用逗号分隔字符串；
 * 提交给父组件前需要转换回 PromptFormData 中的 string[]。
 *
 * @returns 去掉空白和空标签后的标签数组
 */
function parseTags() {
  // 提交前再把逗号分隔字符串转换回业务需要的 string[]。
  return tagText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * 关闭提示词表单弹窗。
 *
 * 用户点击取消或弹窗关闭时调用，通过 update:visible emit 通知父组件
 * 更新弹窗显隐状态，子组件不直接修改父组件状态。
 */
function handleClose() {
  emit('update:visible', false);
}

/**
 * 提交提示词表单数据。
 *
 * 用户点击保存时调用，子组件只负责整理本地表单和标签格式，
 * 再通过 submit emit 把结果交回父组件；真正的新增或编辑由父组件根据 mode 处理。
 */
function handleSubmit() {
  // 弹窗只负责整理表单并 emit，真正的 create/update 由父页面根据 mode 处理。
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
