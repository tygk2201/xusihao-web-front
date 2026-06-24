<template>
  <el-container class="app-shell">
    <el-aside width="268px" class="app-aside">
      <div class="brand-block">
        <div class="brand-mark">DI</div>
        <div>
          <div class="brand-title">DocInsight</div>
          <div class="brand-subtitle">工程技术版</div>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="side-menu"
        router
        background-color="transparent"
        text-color="#93a3b8"
        active-text-color="#ffffff"
      >
        <el-menu-item v-for="item in menuItems" :key="item.name" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="doc-panel">
        <div class="doc-panel__label">当前文档</div>
        <div class="doc-panel__name">{{ currentDoc?.name || "暂无文档" }}</div>
        <el-progress :percentage="currentDoc?.completion || 0" :stroke-width="8" :show-text="false" color="#4c9bfd" />
        <div class="doc-panel__meta">
          {{ currentDoc ? `${statusMap[currentDoc.status]?.label || currentDoc.status} / ${currentDoc.completion || 0}%` : "等待上传" }}
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div>
          <div class="header-breadcrumb">{{ breadcrumbText }}</div>
          <div class="header-title">{{ route.meta.title }}</div>
        </div>

        <div class="header-actions">
          <el-input
            v-model="state.searchKeyword"
            placeholder="搜索设备 / 系统 / 参数"
            clearable
            class="header-search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="uploadDialogVisible = true">上传报告</el-button>
          <el-button circle @click="configDialogVisible = true">
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </el-header>

      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>

    <el-dialog v-model="uploadDialogVisible" title="上传工程技术报告" width="720px">
      <div class="dialog-grid">
        <div class="upload-dropzone" @click="fileInput?.click()">
          <input ref="fileInput" type="file" accept=".pdf,application/pdf" hidden @change="handleFileChange" />
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-title">{{ uploadForm.file ? uploadForm.file.name : "点击选择 PDF 文件" }}</div>
          <div class="upload-subtitle">仅支持 PDF，最大 100MB</div>
        </div>
        <div>
          <div class="dialog-section-title">报告类型</div>
          <el-radio-group v-model="uploadForm.type">
            <el-radio label="故障分析报告" value="故障分析报告" />
            <el-radio label="设计报告" value="设计报告" />
            <el-radio label="设备手册" value="设备手册" />
          </el-radio-group>
        </div>
        <div>
          <div class="dialog-section-title">解析选项</div>
          <el-checkbox-group v-model="uploadForm.options">
            <el-checkbox label="提取系统层级结构" />
            <el-checkbox label="提取设备参数表" />
            <el-checkbox label="识别图纸实体" />
            <el-checkbox label="构建影响关系图谱" />
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="state.uploading" @click="handleUpload">开始上传并解析</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="configDialogVisible" title="API 配置" width="560px">
      <el-form label-position="top">
        <el-form-item label="服务提供方">
          <el-input v-model="state.apiConfig.provider" disabled />
        </el-form-item>
        <el-form-item label="模型">
          <el-input v-model="state.apiConfig.model" disabled />
        </el-form-item>
        <el-form-item label="后端状态">
          <el-alert
            :title="state.apiAvailable ? '后端 API 可用' : `后端 API 不可用：${state.lastError || '未知错误'}`"
            :type="state.apiAvailable ? 'success' : 'warning'"
            :closable="false"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import {
  ChatDotRound,
  Files,
  Memo,
  Search,
  Setting,
  Share,
  UploadFilled
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAppState } from "../composables/useAppState.js";

const route = useRoute();
const router = useRouter();
const uploadDialogVisible = ref(false);
const configDialogVisible = ref(false);
const fileInput = ref(null);

const {
  state,
  currentDoc,
  loadReports,
  loadReportResult,
  selectReport,
  statusMap,
  uploadReport
} = useAppState();

const uploadForm = reactive({
  file: null,
  type: "故障分析报告",
  options: ["提取系统层级结构", "提取设备参数表"]
});

const menuItems = [
  { name: "dashboard", path: "/dashboard", label: "工程报告", icon: Files },
  { name: "parsing", path: "/parsing", label: "报告解析", icon: Memo },
  { name: "graph", path: "/graph", label: "系统图谱", icon: Share },
  { name: "qa", path: "/qa", label: "工程问答", icon: ChatDotRound }
];

const activeMenu = computed(() => route.path);
const breadcrumbText = computed(() => {
  const name = currentDoc.value?.name || "未选择文档";
  return `工程报告 / ${name} / ${route.meta.title}`;
});

function handleFileChange(event) {
  uploadForm.file = event.target.files?.[0] || null;
}

async function handleUpload() {
  if (!uploadForm.file) {
    ElMessage.warning("请先选择 PDF 文件");
    return;
  }

  try {
    const result = await uploadReport({
      file: uploadForm.file,
      type: uploadForm.type,
      options: uploadForm.options
    });
    uploadDialogVisible.value = false;
    uploadForm.file = null;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
    await selectReport(result.reportId);
    router.push({ name: "parsing" });
    ElMessage.success("上传成功，后端已开始解析。");
  } catch (error) {
    ElMessage.error(error.message || "上传失败");
  }
}

onMounted(async () => {
  await loadReports();
  if (state.currentDocId) {
    await loadReportResult(state.currentDocId);
  }
});
</script>
