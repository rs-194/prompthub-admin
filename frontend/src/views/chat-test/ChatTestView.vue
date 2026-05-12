<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import TestRecordTable from './components/TestRecordTable.vue';
import TestResultPanel from './components/TestResultPanel.vue';
import {
  getChatTestModelOptions,
  getChatTestPromptOptions,
  getChatTestRecords,
  runMockPromptTest,
  saveChatTestRecord,
} from '@/services/chatTest';
import type {
  ChatTestFormData,
  ChatTestModelOption,
  ChatTestPromptOption,
  ChatTestRecord,
  ChatTestRecordInput,
  ChatTestResult,
} from '@/types/chatTest';

const promptOptions = ref<ChatTestPromptOption[]>([]);
const modelOptions = ref<ChatTestModelOption[]>([]);
const selectedPromptId = ref<number | undefined>();
const selectedModelId = ref<number | undefined>();
const userInput = ref('');
const testResult = ref<ChatTestResult | null>(null);
const testRecords = ref<ChatTestRecord[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const selectedPrompt = computed(() =>
  promptOptions.value.find((prompt) => prompt.id === selectedPromptId.value),
);

const selectedModel = computed(() =>
  modelOptions.value.find((model) => model.id === selectedModelId.value),
);

const canRunTest = computed(
  () =>
    Boolean(selectedPrompt.value) &&
    Boolean(selectedModel.value) &&
    userInput.value.trim().length > 0 &&
    !loading.value,
);

/**
 * 加载 Prompt 调试台初始数据。
 *
 * 页面挂载时调用，负责获取提示词选项、已启用模型配置选项和最近测试记录。
 * 当前数据来自前端 mock service；后续接后端时优先替换 service 内部实现。
 *
 * @returns 加载完成后的空结果
 */
async function loadInitialData() {
  errorMessage.value = '';

  try {
    const [prompts, models, records] = await Promise.all([
      getChatTestPromptOptions(),
      getChatTestModelOptions(),
      getChatTestRecords(),
    ]);

    promptOptions.value = prompts;
    modelOptions.value = models;
    testRecords.value = records;
  } catch {
    errorMessage.value = '调试台初始化失败，请稍后重试';
  }
}

/**
 * 刷新最近测试记录。
 *
 * 保存一条测试记录后调用，当前读取前端内存 mock 记录；
 * 后续接后端时由 getChatTestRecords 替换为真实查询接口。
 *
 * @returns 刷新完成后的空结果
 */
async function refreshTestRecords() {
  testRecords.value = await getChatTestRecords();
}

/**
 * 构造保存测试记录所需的基础数据。
 *
 * 运行测试成功后调用，只组装 service 需要的输入数据；
 * 完整记录的 id、createdAt、outputPreview 和 status 由 saveChatTestRecord 生成。
 *
 * @param result 本次 mock 测试返回的结果
 * @returns 保存测试记录所需的基础数据
 */
function buildRecordInput(result: ChatTestResult): ChatTestRecordInput {
  return {
    promptTitle: result.usedPromptTitle,
    modelName: result.usedModelName,
    userInput: userInput.value.trim(),
    output: result.output,
    durationMs: result.durationMs,
  };
}

/**
 * 运行一次 Prompt mock 测试。
 *
 * 用户点击“运行测试”时调用，负责校验页面状态、设置 loading、
 * 调用 runMockPromptTest 获取 mock 输出，并保存一条测试记录。
 * 当前不真实调用模型 API；后续接真实 LLM 时替换 runMockPromptTest 内部实现。
 *
 * @returns 运行完成后的空结果
 */
async function handleRunTest() {
  if (!selectedPrompt.value || !selectedModel.value || !canRunTest.value) {
    errorMessage.value = '请先选择提示词、模型配置并输入测试内容';
    return;
  }

  const formData: ChatTestFormData = {
    promptId: selectedPrompt.value.id,
    modelId: selectedModel.value.id,
    userInput: userInput.value.trim(),
  };

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await runMockPromptTest(formData);
    testResult.value = result;
    await saveChatTestRecord(buildRecordInput(result));
    await refreshTestRecords();
  } catch {
    errorMessage.value = '运行测试失败，请检查输入后重试';
  } finally {
    loading.value = false;
  }
}

/**
 * 清空测试输入和当前结果。
 *
 * 用户点击“清空”时调用，清空 userInput、testResult 和 errorMessage；
 * 最近测试记录不会被清空。后续如接后端，不需要替换该本地交互函数。
 *
 * @returns 清空完成后的空结果
 */
function handleClearInput() {
  userInput.value = '';
  testResult.value = null;
  errorMessage.value = '';
}

/**
 * 清空当前测试结果。
 *
 * 当前预留给结果区后续交互使用，只清空 testResult 和 errorMessage，
 * 不影响用户输入和最近测试记录。
 *
 * @returns 清空完成后的空结果
 */
function handleClearResult() {
  testResult.value = null;
  errorMessage.value = '';
}

onMounted(() => {
  void loadInitialData();
});
</script>

<template>
  <div class="chat-test-page">
    <div class="page-header">
      <div>
        <h1>对话测试 / Prompt 调试台</h1>
        <p>
          用于验证提示词模板与模型配置组合效果。当前为 v1 mock 版本，不接后端，不真实调用模型 API。
        </p>
      </div>
      <el-tag type="warning" effect="plain">Mock 调试</el-tag>
    </div>

    <div class="workspace-grid">
      <div class="left-column">
        <el-card shadow="never">
          <template #header>
            <span>测试配置</span>
          </template>

          <el-form label-position="top">
            <el-form-item label="提示词模板">
              <el-select
                v-model="selectedPromptId"
                placeholder="请选择提示词模板"
                filterable
                class="full-width"
              >
                <el-option
                  v-for="prompt in promptOptions"
                  :key="prompt.id"
                  :label="prompt.title"
                  :value="prompt.id"
                >
                  <span>{{ prompt.title }}</span>
                  <span class="option-meta">{{ prompt.category }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="模型配置">
              <el-select
                v-model="selectedModelId"
                placeholder="请选择已启用的模型配置"
                filterable
                class="full-width"
              >
                <el-option
                  v-for="model in modelOptions"
                  :key="model.id"
                  :label="`${model.name} / ${model.modelName}`"
                  :value="model.id"
                >
                  <span>{{ model.name }}</span>
                  <span class="option-meta">{{ model.provider }} · {{ model.modelName }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="测试内容">
              <el-input
                v-model="userInput"
                type="textarea"
                :rows="7"
                maxlength="1000"
                show-word-limit
                placeholder="请输入要测试的用户问题或业务输入"
              />
            </el-form-item>

            <div class="actions">
              <el-button
                type="primary"
                :loading="loading"
                :disabled="!canRunTest"
                @click="handleRunTest"
              >
                运行测试
              </el-button>
              <el-button :disabled="loading" @click="handleClearInput">清空</el-button>
              <el-button :disabled="loading || !testResult" @click="handleClearResult">
                清空结果
              </el-button>
            </div>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <span>提示词预览</span>
          </template>

          <div v-if="selectedPrompt" class="prompt-preview">
            <div class="preview-title">
              <strong>{{ selectedPrompt.title }}</strong>
              <el-tag size="small">{{ selectedPrompt.category }}</el-tag>
            </div>
            <p>{{ selectedPrompt.content }}</p>
          </div>
          <el-empty v-else description="请选择提示词模板查看内容预览" />
        </el-card>
      </div>

      <TestResultPanel
        :result="testResult"
        :loading="loading"
        :error-message="errorMessage"
      />
    </div>

    <TestRecordTable :records="testRecords" />
  </div>
</template>

<style scoped>
.chat-test-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  background: #fff;
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 8px 0 0;
  color: #606266;
  line-height: 1.7;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
  gap: 20px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.full-width {
  width: 100%;
}

.option-meta {
  float: right;
  color: #909399;
  font-size: 12px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.prompt-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.prompt-preview p {
  margin: 0;
  padding: 14px;
  border-radius: 6px;
  background: #f7f8fa;
  color: #303133;
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 960px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>
