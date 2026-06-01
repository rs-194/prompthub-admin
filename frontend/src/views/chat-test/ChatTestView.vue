<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import KnowledgeContextPanel from './components/KnowledgeContextPanel.vue';
import TestParameterPanel from './components/TestParameterPanel.vue';
import TestRecordDetailDrawer from './components/TestRecordDetailDrawer.vue';
import TestRecordTable from './components/TestRecordTable.vue';
import TestResultPanel from './components/TestResultPanel.vue';
import {
  buildParamsSummary,
  getChatTestApiErrorMessage,
  getChatTestKnowledgeOptions,
  getChatTestModelOptions,
  getChatTestPromptOptions,
  getChatTestRecords,
  getTestRecordDetail,
  getTestRecordDetailApiErrorMessage,
  mapTestRecordDetailToRecord,
  runPromptTestStreamApi,
} from '@/services/chatTest';
import type {
  ChatTestKnowledgeOption,
  ChatTestModelOption,
  ChatTestParams,
  ChatTestPromptOption,
  ChatTestRecord,
  ChatTestRunRequest,
  ChatTestResult,
  TestRecordDetail,
} from '@/types/chatTest';

const promptOptions = ref<ChatTestPromptOption[]>([]);
const modelOptions = ref<ChatTestModelOption[]>([]);
const knowledgeOptions = ref<ChatTestKnowledgeOption[]>([]);
const selectedPromptId = ref<number | undefined>();
const selectedModelId = ref<number | undefined>();
const selectedKnowledgeIds = ref<number[]>([]);
const userInput = ref('');
const testResult = ref<ChatTestResult | null>(null);
const testRecords = ref<ChatTestRecord[]>([]);
const loading = ref(false);
const streaming = ref(false);
const streamingText = ref('');
const abortController = ref<AbortController | null>(null);
const errorMessage = ref('');
const detailDrawerVisible = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const selectedRecordId = ref<number | null>(null);
const selectedRecordDetail = ref<TestRecordDetail | null>(null);
const testParams = ref<ChatTestParams>({
  temperature: 0.7,
  maxTokens: 800,
  outputFormat: 'markdown',
});
const streamingStopTip = '流式生成中可停止；停止后保留已生成片段，本阶段不保存 stopped 记录';

const selectedPrompt = computed(() =>
  promptOptions.value.find((prompt) => prompt.id === selectedPromptId.value),
);

const selectedModel = computed(() =>
  modelOptions.value.find((model) => model.id === selectedModelId.value),
);

/**
 * 根据知识库选项和用户选择的 id 推导已选文档。
 *
 * 用户修改知识库多选框时自动重新计算，返回值用于 mock context 预览和运行测试入参。
 * 当前不是 RAG，也不做额外同步副作用；后续真实 RAG 接入时仍应优先由 service 替换上下文构建逻辑。
 *
 * @returns 当前用户手动选择的知识库 mock 文档
 */
const selectedKnowledgeDocs = computed(() =>
  knowledgeOptions.value.filter((document) =>
    selectedKnowledgeIds.value.includes(document.id),
  ),
);

const canRunTest = computed(
  () =>
    Boolean(selectedPrompt.value) &&
    Boolean(selectedModel.value) &&
    userInput.value.trim().length > 0 &&
    !loading.value &&
    !streaming.value,
);

/**
 * 加载 Prompt 调试台初始数据。
 *
 * 页面挂载时调用，负责获取提示词选项、已启用模型配置、已启用知识库文档选项和最近测试记录。
 * 当前数据来自前端 mock service，不接后端；知识库选项只是 mock context 来源，不是真实 RAG。
 *
 * @returns 加载完成后的空结果
 */
async function loadInitialData() {
  errorMessage.value = '';

  try {
    const [prompts, models, knowledgeDocuments, records] = await Promise.all([
      getChatTestPromptOptions(),
      getChatTestModelOptions(),
      getChatTestKnowledgeOptions(),
      getChatTestRecords(),
    ]);

    promptOptions.value = prompts;
    modelOptions.value = models;
    knowledgeOptions.value = knowledgeDocuments;
    testRecords.value = records;
  } catch {
    errorMessage.value = '调试台初始化失败，请稍后重试';
  }
}

/**
 * 从已选知识库文档生成简短 mock context 预览。
 *
 * 运行测试前调用，参数是用户手动选择的知识库文档；返回值只拼接 title、sourceName、summary 和 tags
 * 等 mock 元数据。当前不是 RAG，不包含真实检索片段、embedding 或向量库结果；后续真实 RAG 接入时，
 * 优先替换 service 内部上下文组装和模型调用逻辑。
 *
 * @param documents 用户手动选择的知识库 mock 文档
 * @returns 用于结果展示和测试记录保存的 mock context 预览
 */
function buildKnowledgeContextPreview(documents: ChatTestKnowledgeOption[]) {
  if (documents.length === 0) {
    return '';
  }

  return documents
    .map((document, index) => {
      const tagsText = document.tags.length > 0 ? document.tags.join('、') : '无';

      return [
        `${index + 1}. ${document.title}`,
        `来源：${document.sourceName}`,
        `摘要：${document.summary}`,
        `标签：${tagsText}`,
      ].join('\n');
    })
    .join('\n\n');
}

function buildRunRequest(contextPreview: string): ChatTestRunRequest | null {
  if (!selectedPrompt.value || !selectedModel.value) {
    return null;
  }

  const knowledgeTitles = selectedKnowledgeDocs.value.map((document) => document.title);

  return {
    promptTitle: selectedPrompt.value.title,
    systemPrompt: selectedPrompt.value.content,
    userInput: userInput.value.trim(),
    modelName: `${selectedModel.value.name} / ${selectedModel.value.modelName}`,
    knowledgeContext: {
      titles: knowledgeTitles,
      content: contextPreview,
    },
    params: { ...testParams.value },
  };
}

function buildResultFromResponse(
  responseOutput: string,
  requestPayload: ChatTestRunRequest,
  contextPreview: string,
  durationMs: number,
  createdAt: string,
): ChatTestResult {
  return {
    id: Date.now(),
    output: responseOutput,
    usedPromptTitle: requestPayload.promptTitle,
    usedModelName: requestPayload.modelName,
    usedKnowledgeTitles: [...requestPayload.knowledgeContext.titles],
    contextPreview,
    durationMs,
    createdAt,
    params: { ...requestPayload.params },
    paramsSummary: buildParamsSummary(requestPayload.params),
  };
}

function clearResultState() {
  testResult.value = null;
  streamingText.value = '';
}

function abortActiveStream() {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
  streaming.value = false;
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  );
}

/**
 * 运行一次真实 LLM 流式 Prompt 测试。
 *
 * 用户点击“运行测试”时调用，负责校验 prompt / model / userInput，组装当前前端配置源里的
 * prompt、modelName、手动选择的知识库 mock context 和测试参数，再调用后端 `/api/v1/chat-test/stream`。
 * Phase 2.5 使用 fetch stream + NDJSON，不是原生 EventSource SSE；成功完成后由后端保存 TestRecord。
 *
 * @returns 调用完成后的空结果
 */
async function handleRunTest() {
  if (loading.value || streaming.value) {
    return;
  }

  if (!selectedPrompt.value || !selectedModel.value || !canRunTest.value) {
    errorMessage.value = '请先选择提示词、模型配置并输入测试内容';
    return;
  }

  clearResultState();
  const contextPreview = buildKnowledgeContextPreview(selectedKnowledgeDocs.value);
  const requestPayload = buildRunRequest(contextPreview);

  if (!requestPayload) {
    errorMessage.value = '请先选择提示词和模型配置';
    return;
  }

  const controller = new AbortController();
  let currentOutput = '';

  abortController.value = controller;
  streaming.value = true;
  loading.value = false;
  errorMessage.value = '';

  try {
    await runPromptTestStreamApi(
      requestPayload,
      {
        onChunk(content) {
          if (controller.signal.aborted) {
            return;
          }

          currentOutput += content;
          streamingText.value = currentOutput;
        },
        onDone(record, durationMs) {
          if (controller.signal.aborted) {
            return;
          }

          testResult.value = buildResultFromResponse(
            currentOutput,
            requestPayload,
            contextPreview,
            durationMs,
            record.createdAt,
          );
          testRecords.value = [
            mapTestRecordDetailToRecord(record),
            ...testRecords.value.filter((item) => item.id !== record.id),
          ];
          streamingText.value = '';
          streaming.value = false;
        },
        onError(message) {
          if (controller.signal.aborted) {
            return;
          }

          errorMessage.value = message;
          streaming.value = false;
        },
      },
      controller.signal,
    );
  } catch (error) {
    if (!isAbortError(error)) {
      errorMessage.value = getChatTestApiErrorMessage(error);
    }
  } finally {
    loading.value = false;
    streaming.value = false;
    if (abortController.value === controller) {
      abortController.value = null;
    }
  }
}

function handleStopGenerating() {
  if (!streaming.value) {
    return;
  }

  abortActiveStream();
  errorMessage.value = '';
}

/**
 * 清空测试输入和当前结果。
 *
 * 用户点击“清空”时调用，清空 userInput、testResult 和 errorMessage；不清空 selectedKnowledgeIds
 * 和 testParams，因为它们属于调试配置。
 *
 * @returns 清空完成后的空结果
 */
function handleClearInput() {
  abortActiveStream();
  userInput.value = '';
  clearResultState();
  errorMessage.value = '';
  loading.value = false;
}

/**
 * 清空当前测试结果。
 *
 * 只清空 testResult 和 errorMessage，不影响用户输入、最近测试记录、selectedKnowledgeIds 和 testParams。
 * 当前不涉及真实 SSE 连接。
 *
 * @returns 清空完成后的空结果
 */
function handleClearResult() {
  abortActiveStream();
  clearResultState();
  errorMessage.value = '';
  loading.value = false;
}

async function handleOpenRecordDetail(recordId: number) {
  selectedRecordId.value = recordId;
  selectedRecordDetail.value = null;
  detailError.value = '';
  detailLoading.value = true;
  detailDrawerVisible.value = true;

  try {
    const detail = await getTestRecordDetail(recordId);
    if (selectedRecordId.value === recordId) {
      selectedRecordDetail.value = detail;
    }
  } catch (error) {
    if (selectedRecordId.value === recordId) {
      detailError.value = getTestRecordDetailApiErrorMessage(error);
    }
  } finally {
    if (selectedRecordId.value === recordId) {
      detailLoading.value = false;
    }
  }
}

function handleDetailDrawerVisibleChange(visible: boolean) {
  detailDrawerVisible.value = visible;

  if (!visible) {
    detailError.value = '';
    selectedRecordId.value = null;
  }
}

onMounted(() => {
  void loadInitialData();
});

onBeforeUnmount(() => {
  abortActiveStream();
});
</script>

<template>
  <div class="chat-test-page">
    <div class="page-header">
      <div>
        <h1>对话测试 / Prompt 调试台</h1>
        <p>
          用于验证提示词模板、模型配置、知识库 mock context 与测试参数的组合效果。当前已接入后端真实 fetch stream 流式输出，不是原生 EventSource SSE，不做真实 RAG。
        </p>
      </div>
      <el-tag type="success" effect="plain">真实流式</el-tag>
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

            <el-form-item label="知识库文档">
              <el-select
                v-model="selectedKnowledgeIds"
                placeholder="可选择一个或多个启用中的知识库文档"
                filterable
                multiple
                collapse-tags
                collapse-tags-tooltip
                class="full-width"
                :disabled="knowledgeOptions.length === 0"
              >
                <el-option
                  v-for="document in knowledgeOptions"
                  :key="document.id"
                  :label="document.title"
                  :value="document.id"
                >
                  <span>{{ document.title }}</span>
                  <span class="option-meta">{{ document.categoryLabel }}</span>
                </el-option>
              </el-select>
              <div v-if="knowledgeOptions.length === 0" class="form-tip">
                暂无启用中的知识库文档，不影响基础 Prompt 测试。
              </div>
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
                :loading="streaming"
                :disabled="!canRunTest"
                @click="handleRunTest"
              >
                运行测试
              </el-button>
              <el-button
                type="warning"
                plain
                :disabled="!streaming"
                :title="streamingStopTip"
                @click="handleStopGenerating"
              >
                停止生成
              </el-button>
              <el-button :disabled="loading" @click="handleClearInput">清空</el-button>
              <el-button
                :disabled="loading || (!testResult && !streamingText)"
                @click="handleClearResult"
              >
                清空结果
              </el-button>
            </div>
            <div class="form-tip">{{ streamingStopTip }}</div>
          </el-form>
        </el-card>

        <TestParameterPanel v-model="testParams" />

        <KnowledgeContextPanel :documents="selectedKnowledgeDocs" />

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
        :streaming="streaming"
        :streaming-text="streamingText"
        :error-message="errorMessage"
      />
    </div>

    <TestRecordTable
      :records="testRecords"
      @view-detail="handleOpenRecordDetail"
    />

    <TestRecordDetailDrawer
      :visible="detailDrawerVisible"
      :detail="selectedRecordDetail"
      :loading="detailLoading"
      :error-message="detailError"
      @update:visible="handleDetailDrawerVisibleChange"
    />
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

.form-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
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
