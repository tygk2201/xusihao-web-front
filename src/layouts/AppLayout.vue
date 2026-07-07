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
        <el-menu-item
          v-for="item in menuItems"
          :key="item.name"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="doc-panel">
        <div class="doc-panel__label">当前文档</div>
        <div class="doc-panel__name">{{ currentDoc.name }}</div>
        <el-progress :percentage="66" :stroke-width="8" :show-text="false" color="#4c9bfd" />
        <div class="doc-panel__meta">存储空间 66%</div>
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
        <div class="upload-dropzone">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-title">拖拽文件到此处，或点击选择文件</div>
          <div class="upload-subtitle">支持 PDF / Word，最大 100MB</div>
        </div>
        <div>
          <div class="dialog-section-title">报告类型</div>
          <el-radio-group model-value="故障分析报告">
            <el-radio label="故障分析报告" value="故障分析报告" />
            <el-radio label="设计报告" value="设计报告" />
            <el-radio label="设备手册" value="设备手册" />
          </el-radio-group>
        </div>
        <div>
          <div class="dialog-section-title">解析选项</div>
          <el-checkbox-group model-value="all">
            <el-checkbox label="提取系统层级结构" />
            <el-checkbox label="提取设备参数表" />
            <el-checkbox label="识别图纸实体" />
            <el-checkbox label="构建影响关系图谱" />
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleMockUpload">开始上传并解析</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="configDialogVisible" title="API 配置" width="560px">
      <el-form label-position="top">
        <el-form-item label="服务提供方">
          <el-input v-model="state.apiConfig.provider" />
        </el-form-item>
        <el-form-item label="模型">
          <el-select v-model="state.apiConfig.model" class="w-full">
            <el-option label="DeepSeek-V3" value="DeepSeek-V3" />
            <el-option label="Qwen3" value="Qwen3" />
            <el-option label="GLM-4" value="GLM-4" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="state.apiConfig.apiKey" placeholder="sk-xxxxxxxxxxxxxxxx" show-password />
        </el-form-item>
        <el-alert title="当前仍使用 Mock 数据驱动界面，后续可在 API 层接真实服务。" type="success" :closable="false" />
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, ref } from "vue";
import { RouterView, useRoute } from "vue-router";
import {
  ChatDotRound,
  Files,
  Memo,
  Search,
  Setting,
  Share,
  TrendCharts,
  UploadFilled
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useAppState } from "../composables/useAppState";

const route = useRoute();
const uploadDialogVisible = ref(false);
const configDialogVisible = ref(false);
const { state, currentDoc } = useAppState();

const menuItems = [
  { name: "dashboard", path: "/dashboard", label: "工程报告库", icon: Files },
  { name: "parsing", path: "/parsing", label: "报告解析", icon: Memo },
  { name: "graph", path: "/graph", label: "系统图谱", icon: Share },
  { name: "qa", path: "/qa", label: "工程问答", icon: ChatDotRound },
  { name: "formula", path: "/formula", label: "公式动画", icon: TrendCharts }
];

const activeMenu = computed(() => route.path);
const breadcrumbText = computed(() => `工程报告库 / ${currentDoc.value.name} / ${route.meta.title}`);

function handleMockUpload() {
  uploadDialogVisible.value = false;
  ElMessage.success("已开始解析，当前页面展示的是工程化重构后的 Mock 流程。");
}

function handleSaveConfig() {
  configDialogVisible.value = false;
  ElMessage.success("API 配置已保存到当前前端状态。");
}
</script>
