<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import KnowledgeContextPanel from './components/KnowledgeContextPanel.vue';
import TestParameterPanel from './components/TestParameterPanel.vue';
import TestRecordCompareDrawer from './components/TestRecordCompareDrawer.vue';
import TestRecordDetailDrawer from './components/TestRecordDetailDrawer.vue';
import TestRecordTable from './components/TestRecordTable.vue';
import TestResultPanel from './components/TestResultPanel.vue';
import {
  buildParamsSummary,
  getChatTestApiErrorMessage,
  getChatTestModelOptions,
  getChatTestPromptOptions,
  getChatTestRecords,
  getTestRecordDetail,
  getTestRecordDetailApiErrorMessage,
  mapTestRecordDetailToRecord,
  runPromptTestStreamApi,
} from '@/services/chatTest';
import {
  getKnowledgeDocumentDetail,
  getKnowledgeDocumentList,
  KnowledgeApiError,
} from '@/services/knowledge';
import {
  getPromptTemplateDetail,
  PromptApiError,
} from '@/services/prompt';
import type {
  ChatTestModelOption,
  ChatTestParams,
  ChatTestPromptOption,
  ChatTestRecord,
  ChatTestRunRequest,
  ChatTestResult,
  TestRecordDetail,
} from '@/types/chatTest';
import type {
  KnowledgeDocumentDetail,
  KnowledgeDocumentListItem,
} from '@/types/knowledge';
import type { PromptTemplateDetail } from '@/types/prompt';

const promptOptions = ref<ChatTestPromptOption[]>([]);
const modelOptions = ref<ChatTestModelOption[]>([]);
const knowledgeOptions = ref<KnowledgeDocumentListItem[]>([]);
const promptDetailCache = ref<Record<number, PromptTemplateDetail>>({});
const knowledgeDetailCache = ref<Record<number, KnowledgeDocumentDetail>>({});
const promptLoadingIds = ref<number[]>([]);
const knowledgeLoadingIds = ref<number[]>([]);
const promptError = ref('');
const knowledgeError = ref('');
const promptDetailRequests = new Map<
  number,
  Promise<PromptTemplateDetail>
>();
const knowledgeDetailRequests = new Map<
  number,
  Promise<KnowledgeDocumentDetail>
>();
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
const selectedCompareRecordIds = ref<number[]>([]);
const compareDrawerVisible = ref(false);
const compareLoading = ref(false);
const compareError = ref('');
const compareRecordIds = ref<number[]>([]);
const compareRecords = ref<TestRecordDetail[]>([]);
const testParams = ref<ChatTestParams>({
  temperature: 0.7,
  maxTokens: 800,
  outputFormat: 'markdown',
});
const streamingStopTip = '流式生成中可停止；停止后保留已生成片段，本阶段不保存 stopped 记录';

const selectedPrompt = computed(() =>
  promptOptions.value.find((prompt) => prompt.id === selectedPromptId.value),
);

const selectedPromptDetail = computed(() => {
  if (selectedPromptId.value === undefined) {
    return undefined;
  }

  return promptDetailCache.value[selectedPromptId.value];
});

const selectedModel = computed(() =>
  modelOptions.value.find((model) => model.id === selectedModelId.value),
);

/**
 * 根据后端知识库列表和用户选择的 id 推导已选文档。
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
    !streaming.value &&
    promptLoadingIds.value.length === 0 &&
    knowledgeLoadingIds.value.length === 0,
);

/**
 * 加载 Prompt 调试台初始数据。
 *
 * Prompt 和 Knowledge 列表分别来自后端 enabled 数据源，二者加载失败互不阻塞。
 */
async function loadInitialData() {
  errorMessage.value = '';
  promptError.value = '';
  knowledgeError.value = '';

  const promptRequest = getChatTestPromptOptions()
    .then((prompts) => {
      promptOptions.value = prompts;
      if (
        selectedPromptId.value !== undefined &&
        !prompts.some((prompt) => prompt.id === selectedPromptId.value)
      ) {
        selectedPromptId.value = undefined;
      }
    })
    .catch((error: unknown) => {
      promptOptions.value = [];
      selectedPromptId.value = undefined;
      promptError.value =
        error instanceof PromptApiError
          ? error.message
          : 'Prompt 模板加载失败，请稍后重试';
    });

  const knowledgeRequest = getKnowledgeDocumentList({
    page: 1,
    pageSize: 100,
    enabled: true,
  })
    .then((response) => {
      knowledgeOptions.value = response.items;
    })
    .catch((error: unknown) => {
      knowledgeOptions.value = [];
      selectedKnowledgeIds.value = [];
      knowledgeError.value =
        error instanceof KnowledgeApiError
          ? error.message
          : '知识库文档加载失败，请稍后重试';
    });

  try {
    const [models, records] = await Promise.all([
      getChatTestModelOptions(),
      getChatTestRecords(),
    ]);

    modelOptions.value = models;
    testRecords.value = records;
  } catch {
    errorMessage.value = '调试台初始化失败，请稍后重试';
  }

  await promptRequest;
  await knowledgeRequest;
}

/**
 * 将手动选择的后端文档正文拼成现有 knowledgeContext.content。
 * 后端 messages 构造阶段仍会应用既有长度截断保护。
 */
function buildKnowledgeContextPreview(documents: KnowledgeDocumentDetail[]) {
  if (documents.length === 0) {
    return '';
  }

  return documents
    .map((document, index) => {
      return [
        `【文档 ${index + 1}：${document.title}】`,
        document.content || document.summary || '',
      ].join('\n');
    })
    .join('\n\n');
}

function buildRunRequest(
  promptDetail: PromptTemplateDetail,
  contextPreview: string,
  knowledgeDetails: KnowledgeDocumentDetail[],
): ChatTestRunRequest | null {
  if (!selectedModel.value) {
    return null;
  }

  const knowledgeTitles = knowledgeDetails.map((document) => document.title);

  return {
    promptTitle: promptDetail.title,
    systemPrompt: promptDetail.content,
    userInput: userInput.value.trim(),
    modelName: `${selectedModel.value.name} / ${selectedModel.value.modelName}`,
    knowledgeContext: {
      titles: knowledgeTitles,
      content: contextPreview,
    },
    params: { ...testParams.value },
  };
}

async function loadPromptDetail(templateId: number) {
  const cachedDetail = promptDetailCache.value[templateId];
  if (cachedDetail) {
    return cachedDetail;
  }

  const activeRequest = promptDetailRequests.get(templateId);
  if (activeRequest) {
    return activeRequest;
  }

  promptLoadingIds.value = [...promptLoadingIds.value, templateId];
  promptError.value = '';

  const requestPromise = getPromptTemplateDetail(templateId)
    .then((detail) => {
      promptDetailCache.value = {
        ...promptDetailCache.value,
        [templateId]: detail,
      };
      return detail;
    })
    .catch((error: unknown) => {
      promptError.value =
        error instanceof PromptApiError
          ? error.message
          : 'Prompt 模板详情加载失败，请稍后重试';
      throw error;
    })
    .finally(() => {
      promptDetailRequests.delete(templateId);
      promptLoadingIds.value = promptLoadingIds.value.filter(
        (id) => id !== templateId,
      );
    });

  promptDetailRequests.set(templateId, requestPromise);
  return requestPromise;
}

async function loadKnowledgeDetail(documentId: number) {
  const cachedDetail = knowledgeDetailCache.value[documentId];
  if (cachedDetail) {
    return cachedDetail;
  }

  const activeRequest = knowledgeDetailRequests.get(documentId);
  if (activeRequest) {
    return activeRequest;
  }

  knowledgeLoadingIds.value = [...knowledgeLoadingIds.value, documentId];
  knowledgeError.value = '';

  const requestPromise = getKnowledgeDocumentDetail(documentId)
    .then((detail) => {
      knowledgeDetailCache.value = {
        ...knowledgeDetailCache.value,
        [documentId]: detail,
      };
      return detail;
    })
    .catch((error: unknown) => {
      knowledgeError.value =
        error instanceof KnowledgeApiError
          ? error.message
          : '知识库文档详情加载失败，请稍后重试';
      throw error;
    })
    .finally(() => {
      knowledgeDetailRequests.delete(documentId);
      knowledgeLoadingIds.value = knowledgeLoadingIds.value.filter(
        (id) => id !== documentId,
      );
    });

  knowledgeDetailRequests.set(documentId, requestPromise);
  return requestPromise;
}

async function ensureSelectedKnowledgeDetails() {
  return Promise.all(
    selectedKnowledgeIds.value.map((documentId) =>
      loadKnowledgeDetail(documentId),
    ),
  );
}

async function ensureSelectedPromptDetail() {
  if (selectedPromptId.value === undefined) {
    throw new Error('prompt-not-selected');
  }

  return loadPromptDetail(selectedPromptId.value);
}

function handlePromptSelectionChange(templateId: number | undefined) {
  if (templateId !== undefined && !promptDetailCache.value[templateId]) {
    void loadPromptDetail(templateId).catch(() => undefined);
  }
}

function handleKnowledgeSelectionChange(documentIds: number[]) {
  for (const documentId of documentIds) {
    if (!knowledgeDetailCache.value[documentId]) {
      void loadKnowledgeDetail(documentId).catch(() => undefined);
    }
  }
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
 * prompt、modelName、手动选择的后端知识库正文和测试参数，再调用后端 `/api/v1/chat-test/stream`。
 * Phase 2.5 使用 fetch stream + NDJSON，不是原生 EventSource SSE；成功完成后由后端保存 TestRecord。
 *
 * @returns 调用完成后的空结果
 */
async function handleRunTest() {
  if (loading.value || streaming.value) {
    return;
  }

  if (promptOptions.value.length === 0) {
    errorMessage.value = promptError.value || '暂无启用中的 Prompt 模板，请先在提示词管理中新增并启用';
    return;
  }

  if (!selectedPrompt.value || !selectedModel.value || !canRunTest.value) {
    errorMessage.value = '请先选择 Prompt 模板、模型配置并输入测试内容';
    return;
  }

  let promptDetail: PromptTemplateDetail;
  let knowledgeDetails: KnowledgeDocumentDetail[];

  try {
    promptDetail = await ensureSelectedPromptDetail();
  } catch {
    errorMessage.value = promptError.value || 'Prompt 模板详情加载失败，请稍后重试';
    return;
  }

  try {
    knowledgeDetails = await ensureSelectedKnowledgeDetails();
  } catch {
    errorMessage.value = knowledgeError.value || '知识库文档加载失败，请稍后重试';
    return;
  }

  clearResultState();
  const contextPreview = buildKnowledgeContextPreview(knowledgeDetails);
  const requestPayload = buildRunRequest(promptDetail, contextPreview, knowledgeDetails);

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

function handleRecordSelectionChange(recordIds: number[]) {
  selectedCompareRecordIds.value = recordIds;
}

async function handleOpenRecordCompare() {
  if (selectedCompareRecordIds.value.length !== 2) {
    ElMessage.warning('请选择 2 条记录进行对比');
    return;
  }

  const currentIds = [...selectedCompareRecordIds.value];
  compareRecordIds.value = currentIds;
  compareRecords.value = [];
  compareError.value = '';
  compareLoading.value = true;
  compareDrawerVisible.value = true;

  try {
    const records = await Promise.all(currentIds.map((id) => getTestRecordDetail(id)));

    if (compareRecordIds.value.join(',') === currentIds.join(',')) {
      compareRecords.value = records;
    }
  } catch (error) {
    if (compareRecordIds.value.join(',') === currentIds.join(',')) {
      compareError.value = getTestRecordDetailApiErrorMessage(error);
    }
  } finally {
    if (compareRecordIds.value.join(',') === currentIds.join(',')) {
      compareLoading.value = false;
    }
  }
}

function handleCompareDrawerVisibleChange(visible: boolean) {
  compareDrawerVisible.value = visible;

  if (!visible) {
    compareError.value = '';
    compareRecordIds.value = [];
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
          用于验证提示词模板、模型配置、手动选择的后端知识库上下文与测试参数组合。当前已接入真实 fetch stream 流式输出，但不是 RAG，不做 embedding、向量检索或自动召回。
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
                :disabled="promptOptions.length === 0"
                @change="handlePromptSelectionChange"
              >
                <el-option
                  v-for="prompt in promptOptions"
                  :key="prompt.id"
                  :label="prompt.title"
                  :value="prompt.id"
                >
                  <span>{{ prompt.title }}</span>
                  <span class="option-meta">{{ prompt.category || '未分类' }}</span>
                </el-option>
              </el-select>
              <div v-if="promptOptions.length === 0" class="form-tip">
                暂无启用中的 Prompt 模板，请先在提示词管理中新增并启用。
              </div>
              <div v-if="promptError" class="form-error">
                {{ promptError }}
              </div>
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
                @change="handleKnowledgeSelectionChange"
              >
                <el-option
                  v-for="document in knowledgeOptions"
                  :key="document.id"
                  :label="document.title"
                  :value="document.id"
                >
                  <span>{{ document.title }}</span>
                  <span class="option-meta">{{ document.sourceName || '手工录入' }}</span>
                </el-option>
              </el-select>
              <div v-if="knowledgeOptions.length === 0" class="form-tip">
                暂无启用中的知识库文档，不影响基础 Prompt 测试。
              </div>
              <div v-if="knowledgeError" class="form-error">
                {{ knowledgeError }}
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

        <KnowledgeContextPanel
          :documents="selectedKnowledgeDocs"
          :details="Object.values(knowledgeDetailCache)"
          :loading-ids="knowledgeLoadingIds"
          :error-message="knowledgeError"
        />

        <el-card shadow="never">
          <template #header>
            <span>提示词预览</span>
          </template>

          <div v-if="selectedPrompt" class="prompt-preview">
            <div class="preview-title">
              <strong>{{ selectedPrompt.title }}</strong>
              <el-tag size="small">{{ selectedPrompt.category || '未分类' }}</el-tag>
            </div>
            <p>{{ selectedPromptDetail?.content || selectedPrompt.contentPreview }}</p>
            <div
              v-if="selectedPrompt && !selectedPromptDetail"
              class="form-tip"
            >
              正在按需加载完整 Prompt 内容；运行时会使用后端详情中的完整 content。
            </div>
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
      @selection-change="handleRecordSelectionChange"
      @compare-selected="handleOpenRecordCompare"
    />

    <TestRecordDetailDrawer
      :visible="detailDrawerVisible"
      :detail="selectedRecordDetail"
      :loading="detailLoading"
      :error-message="detailError"
      @update:visible="handleDetailDrawerVisibleChange"
    />

    <TestRecordCompareDrawer
      :visible="compareDrawerVisible"
      :records="compareRecords"
      :loading="compareLoading"
      :error-message="compareError"
      @update:visible="handleCompareDrawerVisibleChange"
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

.form-error {
  margin-top: 8px;
  color: #f56c6c;
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
