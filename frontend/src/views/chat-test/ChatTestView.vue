<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import KnowledgeContextPanel from './components/KnowledgeContextPanel.vue';
import TestParameterPanel from './components/TestParameterPanel.vue';
import TestRecordTable from './components/TestRecordTable.vue';
import TestResultPanel from './components/TestResultPanel.vue';
import {
  createMockStreamChunks,
  getChatTestKnowledgeOptions,
  getChatTestModelOptions,
  getChatTestPromptOptions,
  getChatTestRecords,
  runMockPromptTest,
  saveChatTestRecord,
} from '@/services/chatTest';
import type {
  ChatTestFormData,
  ChatTestKnowledgeOption,
  ChatTestModelOption,
  ChatTestParams,
  ChatTestPromptOption,
  ChatTestRecord,
  ChatTestRecordInput,
  ChatTestResult,
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
const errorMessage = ref('');
const testParams = ref<ChatTestParams>({
  temperature: 0.7,
  maxTokens: 800,
  outputFormat: 'markdown',
});
const streamingText = ref('');
const streaming = ref(false);
const streamTimerId = ref<ReturnType<typeof window.setTimeout> | null>(null);
const streamChunks = ref<string[]>([]);
const streamChunkIndex = ref(0);
const pendingStreamResult = ref<ChatTestResult | null>(null);

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
 * 刷新最近测试记录。
 *
 * 保存一条测试记录后调用，当前读取前端内存 mock 记录；后续接后端时由 getChatTestRecords
 * 替换为真实查询接口。
 *
 * @returns 刷新完成后的空结果
 */
async function refreshTestRecords() {
  testRecords.value = await getChatTestRecords();
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

/**
 * 构造保存测试记录所需的基础数据。
 *
 * 运行测试完整结束后调用，参数是最终 mock 测试结果；返回值交给 saveChatTestRecord 生成完整记录。
 * 本函数会保存 knowledgeTitles、contextPreview 和 params，但这些字段只表示前端 mock 调试上下文，
 * 不表示真实 RAG、真实采样、真实 token 截断或真实模型格式约束。
 *
 * @param result 本次完整 mock 测试返回的最终结果
 * @returns 保存测试记录所需的基础数据
 */
function buildRecordInput(result: ChatTestResult): ChatTestRecordInput {
  return {
    promptTitle: result.usedPromptTitle,
    modelName: result.usedModelName,
    userInput: userInput.value.trim(),
    output: result.output,
    durationMs: result.durationMs,
    knowledgeTitles: [...result.usedKnowledgeTitles],
    contextPreview: result.contextPreview,
    params: { ...result.params },
  };
}

/**
 * 运行一次 Prompt mock 测试。
 *
 * 用户点击“运行测试”时调用，负责校验 prompt / model / userInput，读取 selectedKnowledgeDocs，
 * 生成 mock contextPreview，携带当前测试参数调用 runMockPromptTest，再把完整结果拆成 chunks 启动前端 timer。
 * 当前不真实调用模型 API，不做真实 SSE，不做真实 temperature 采样或 maxTokens 截断；
 * 后续接真实 LLM API / fetch stream 时，优先替换 service 和 streaming 获取逻辑。
 *
 * @returns 启动 mock streaming 后的空结果
 */
async function handleRunTest() {
  if (loading.value || streaming.value) {
    return;
  }

  if (!selectedPrompt.value || !selectedModel.value || !canRunTest.value) {
    errorMessage.value = '请先选择提示词、模型配置并输入测试内容';
    return;
  }

  clearStreamingState({ clearResult: true });
  const currentKnowledgeDocs = selectedKnowledgeDocs.value;
  const contextPreview = buildKnowledgeContextPreview(currentKnowledgeDocs);
  const formData: ChatTestFormData = {
    promptId: selectedPrompt.value.id,
    modelId: selectedModel.value.id,
    userInput: userInput.value.trim(),
    knowledgeIds: selectedKnowledgeIds.value,
    selectedKnowledgeDocs: currentKnowledgeDocs,
    contextPreview,
    params: { ...testParams.value },
  };

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await runMockPromptTest(formData);
    const chunks = createMockStreamChunks(result.output);
    startMockStreaming(chunks, result);
  } catch {
    errorMessage.value = '运行测试失败，请检查输入后重试';
    loading.value = false;
  }
}

/**
 * 启动前端 mock 流式输出。
 *
 * `handleRunTest` 生成完整 mock result 和 chunks 后调用。参数 chunks 是 service 从完整输出拆出的文本片段，
 * finalResult 是最终要保存和展示的完整结果。本函数只用浏览器 timer 模拟分段追加，不是真实 SSE；
 * 后续接 FastAPI StreamingResponse 或 fetch stream 时，应替换这里的启动与消费逻辑。
 *
 * @param chunks 待逐段追加到结果区的 mock 文本片段
 * @param finalResult streaming 完成后要展示并保存记录的完整 mock 结果
 * @returns 启动后的空结果
 */
function startMockStreaming(chunks: string[], finalResult: ChatTestResult) {
  streamChunks.value = chunks;
  streamChunkIndex.value = 0;
  pendingStreamResult.value = finalResult;
  streamingText.value = '';
  testResult.value = null;
  streaming.value = true;
  appendNextChunk();
}

/**
 * 追加下一段 mock 输出。
 *
 * 由 `startMockStreaming` 和内部 timer 调用，每次向 streamingText 追加一个 chunk。
 * chunks 耗尽时进入 finishMockStreaming。当前只是 setTimeout 模拟，不做真实 token 流或 SSE 协议；
 * 后续真实流式接入时，应改为消费 EventSource 或 fetch stream 的数据事件。
 *
 * @returns 追加完成后的空结果
 */
function appendNextChunk() {
  if (!streaming.value) {
    return;
  }

  const nextChunk = streamChunks.value[streamChunkIndex.value];

  if (nextChunk === undefined) {
    void finishMockStreaming();
    return;
  }

  streamingText.value += nextChunk;
  streamChunkIndex.value += 1;
  streamTimerId.value = window.setTimeout(appendNextChunk, 180);
}

/**
 * 完成前端 mock 流式输出。
 *
 * chunks 追加完成后调用，负责清理 timer、设置最终 result、保存成功测试记录并刷新最近记录。
 * 只有完整结束才保存成功记录；停止生成不会进入这里保存。当前记录仍是前端内存 mock，
 * 后续接真实后端时应替换 saveChatTestRecord / getChatTestRecords 为持久化接口。
 *
 * @returns 完成保存和刷新后的空结果
 */
async function finishMockStreaming() {
  const finalResult = pendingStreamResult.value;

  if (!finalResult) {
    clearStreamingState({ clearResult: false });
    loading.value = false;
    return;
  }

  if (streamTimerId.value) {
    window.clearTimeout(streamTimerId.value);
    streamTimerId.value = null;
  }

  try {
    testResult.value = finalResult;
    await saveChatTestRecord(buildRecordInput(finalResult));
    await refreshTestRecords();
  } catch {
    errorMessage.value = '保存测试记录失败，请稍后重试';
  } finally {
    streaming.value = false;
    loading.value = false;
    streamChunks.value = [];
    streamChunkIndex.value = 0;
    pendingStreamResult.value = null;
  }
}

/**
 * 停止当前 mock 流式输出。
 *
 * 用户点击“停止生成”时调用，只清理前端 timer 并恢复 loading / streaming 状态，
 * 不代表真实 API cancel，也不会把中途 streamingText 保存为成功测试记录。
 * 后续真实 SSE / fetch stream 阶段可在这里接入 AbortController 或后端取消机制。
 *
 * @returns 停止后的空结果
 */
function stopMockStreaming() {
  if (!streaming.value && !loading.value) {
    return;
  }

  if (streamTimerId.value) {
    window.clearTimeout(streamTimerId.value);
    streamTimerId.value = null;
  }

  if (streamingText.value.trim().length > 0) {
    streamingText.value = `${streamingText.value}\n【已停止生成】已停止前端 mock streaming，未保存为成功测试记录。`;
  }

  streaming.value = false;
  loading.value = false;
  streamChunks.value = [];
  streamChunkIndex.value = 0;
  pendingStreamResult.value = null;
}

/**
 * 清理 mock streaming 临时状态。
 *
 * 清空结果、重新运行或组件卸载时调用，负责清理 timer、streamingText 和临时 chunks。
 * 当前只处理前端 setTimeout 模拟流式输出；后续真实 SSE / fetch stream 接入时，
 * 这里应同步清理真实流连接或 abort 控制器。
 *
 * @param options.clearResult 是否同时清空最终测试结果
 * @returns 清理完成后的空结果
 */
function clearStreamingState(options: { clearResult: boolean }) {
  if (streamTimerId.value) {
    window.clearTimeout(streamTimerId.value);
    streamTimerId.value = null;
  }

  streamingText.value = '';
  streaming.value = false;
  streamChunks.value = [];
  streamChunkIndex.value = 0;
  pendingStreamResult.value = null;

  if (options.clearResult) {
    testResult.value = null;
  }
}

/**
 * 清空测试输入和当前结果。
 *
 * 用户点击“清空”时调用，清空 userInput、testResult、streamingText 和 errorMessage；不清空 selectedKnowledgeIds
 * 和 testParams，因为它们属于调试配置。若存在 mock streaming，会先清理 timer，避免继续追加输出。
 *
 * @returns 清空完成后的空结果
 */
function handleClearInput() {
  userInput.value = '';
  clearStreamingState({ clearResult: true });
  errorMessage.value = '';
  loading.value = false;
}

/**
 * 清空当前测试结果。
 *
 * 只清空 testResult、streamingText 和 errorMessage，不影响用户输入、最近测试记录、selectedKnowledgeIds 和 testParams。
 * 若前端 mock streaming 正在运行，会先清理 timer；当前不涉及真实 SSE 连接。
 *
 * @returns 清空完成后的空结果
 */
function handleClearResult() {
  clearStreamingState({ clearResult: true });
  errorMessage.value = '';
  loading.value = false;
}

onMounted(() => {
  void loadInitialData();
});

/**
 * 组件卸载时清理前端 mock streaming timer。
 *
 * 页面切换或组件销毁时调用，避免 setTimeout 在组件卸载后继续追加 streamingText。
 * 当前只清理前端 timer；后续真实 SSE / LLM API 接入时，应在同一位置关闭流连接或取消请求。
 */
onBeforeUnmount(() => {
  clearStreamingState({ clearResult: false });
  loading.value = false;
});
</script>

<template>
  <div class="chat-test-page">
    <div class="page-header">
      <div>
        <h1>对话测试 / Prompt 调试台</h1>
        <p>
          用于验证提示词模板、模型配置、知识库 mock context 与测试参数的组合效果。当前为 v3 mock streaming 版本，不接后端，不真实调用模型 API，不做真实 SSE。
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
                :loading="loading || streaming"
                :disabled="!canRunTest"
                @click="handleRunTest"
              >
                运行测试
              </el-button>
              <el-button v-if="streaming" type="warning" plain @click="stopMockStreaming">
                停止生成
              </el-button>
              <el-button :disabled="loading || streaming" @click="handleClearInput">清空</el-button>
              <el-button
                :disabled="loading || streaming || (!testResult && !streamingText)"
                @click="handleClearResult"
              >
                清空结果
              </el-button>
            </div>
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
