import { computed, reactive } from "vue";
import {
  hierarchy as mockHierarchy,
  parameters as mockParameters,
  qaStarters,
  relations as mockRelations,
  reports as mockReports
} from "../data/mockData.js";
import debugDatabase from "../../debug_data/report_db.js";

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8010/api";

function normalizeAssetUrl(url) {
  if (!url) {
    return "";
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  if (url.startsWith("/mock/")) {
    return url;
  }
  return `${API_BASE_URL.replace(/\/api$/, "")}${url}`;
}

function normalizePage(page) {
  return {
    ...page,
    entities: page.entities || [],
    formulas: page.formulas || [],
    relations: page.relations || [],
    preview_url: normalizeAssetUrl(page.preview_url),
    images: (page.images || []).map((image) => ({
      ...image,
      url: normalizeAssetUrl(image.url)
    })),
    tables: (page.tables || []).map((table) => ({
      ...table,
      image_url: normalizeAssetUrl(table.image_url)
    }))
  };
}

function normalizeResult(result) {
  if (!result) {
    return null;
  }
  return {
    hierarchy: result.hierarchy || mockHierarchy,
    knowledgeGraph: result.knowledgeGraph || {},
    entities: result.entities || [],
    parameters: result.parameters || [],
    relations: result.relations || [],
    pages: (result.pages || []).map(normalizePage)
  };
}

const debugReports = debugDatabase.reports || [];
const firstDebugReport = debugReports[0] || mockReports[0];
const firstDebugResult = normalizeResult(debugDatabase.results?.[firstDebugReport?.id] || null);
const preferredReportId = import.meta.env?.VITE_PREFERRED_REPORT_ID || firstDebugReport?.id || "";

const state = reactive({
  initialized: false,
  loadingReports: false,
  loadingResult: false,
  loadingCompareResult: false,
  uploading: false,
  currentDocId: preferredReportId,
  compareDocId: "",
  searchKeyword: "",
  graphMode: "composition",
  apiAvailable: false,
  lastError: "",
  reportList: debugReports.length ? debugReports : [...mockReports],
  parseResult: firstDebugResult || {
    hierarchy: mockHierarchy,
    knowledgeGraph: {},
    entities: [],
    parameters: mockParameters,
    relations: mockRelations,
    pages: []
  },
  qaMessages: [
    {
      id: "welcome",
      role: "assistant",
      content: "基于当前工程报告的结构化数据，你可以直接询问设备、系统、参数或接口关系。"
    }
  ],
  apiConfig: {
    provider: "SiliconFlow",
    model: "Qwen/Qwen3-30B-A3B-Instruct-2507",
    apiKey: ""
  }
});

const statusMap = {
  completed: { label: "已完成", tone: "success" },
  processing: { label: "解析中", tone: "warning" },
  needReview: { label: "待复核", tone: "info" },
  failed: { label: "解析失败", tone: "danger" }
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    let message = `请求失败: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail) {
        message = data.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
}

async function loadReports() {
  state.loadingReports = true;
  try {
    const reports = await request("/reports");
    if (Array.isArray(reports) && reports.length > 0) {
      state.reportList = reports;
      const preferred = state.reportList.find((item) => item.id === preferredReportId);
      if (preferred) {
        state.currentDocId = preferred.id;
      } else if (!state.reportList.find((item) => item.id === state.currentDocId)) {
        state.currentDocId = state.reportList[0].id;
      }
      state.apiAvailable = true;
      state.lastError = "";
    } else if (debugReports.length) {
      state.reportList = debugReports;
      state.apiAvailable = false;
      state.lastError = "后端当前无数据，已切换到本地调试数据。";
    } else {
      state.reportList = [...mockReports];
    }
  } catch (error) {
    state.apiAvailable = false;
    state.lastError = error.message;
    state.reportList = debugReports.length ? debugReports : [...mockReports];
  } finally {
    state.loadingReports = false;
    state.initialized = true;
  }
}

async function loadReportResult(reportId = state.currentDocId) {
  if (!reportId) {
    return;
  }

  state.loadingResult = true;
  try {
    const result = await request(`/reports/${reportId}/result`);
    state.parseResult = normalizeResult(result) || {
      hierarchy: mockHierarchy,
      knowledgeGraph: {},
      entities: [],
      parameters: [],
      relations: [],
      pages: []
    };
    state.apiAvailable = true;
    state.lastError = "";
  } catch (error) {
    state.apiAvailable = false;
    state.lastError = error.message;
    const debugResult = normalizeResult(debugDatabase.results?.[reportId]);
    if (debugResult) {
      state.parseResult = debugResult;
    } else {
      state.parseResult = {
        hierarchy: mockHierarchy,
        knowledgeGraph: {},
        entities: [],
        parameters: mockParameters,
        relations: mockRelations,
        pages: []
      };
    }
  } finally {
    state.loadingResult = false;
  }
}

async function loadCompareReportResult(reportId = state.compareDocId) {
  if (!reportId) {
    state.compareParseResult = null;
    return;
  }

  state.loadingCompareResult = true;
  try {
    const result = await request(`/reports/${reportId}/result`);
    state.compareParseResult = normalizeResult(result);
    state.apiAvailable = true;
    state.lastError = "";
  } catch (error) {
    state.apiAvailable = false;
    state.lastError = error.message;
    const debugResult = normalizeResult(debugDatabase.results?.[reportId]);
    state.compareParseResult = debugResult || null;
  } finally {
    state.loadingCompareResult = false;
  }
}

async function selectReport(reportId) {
  state.currentDocId = reportId;
  await loadReportResult(reportId);
}

async function selectCompareReport(reportId) {
  state.compareDocId = reportId || "";
  await loadCompareReportResult(state.compareDocId);
}

async function uploadReport({ file, type, options = [] }) {
  if (!file) {
    throw new Error("请选择 PDF 文件");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type || "未分类");
  formData.append("options", JSON.stringify(options));

  state.uploading = true;
  try {
    const result = await request("/upload", {
      method: "POST",
      body: formData
    });
    await loadReports();
    state.currentDocId = result.reportId;
    return result;
  } finally {
    state.uploading = false;
  }
}

function addQaMessage(role, content) {
  state.qaMessages.push({
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role,
    content
  });
}

function askQuestion(question) {
  addQaMessage("user", question);
  addQaMessage(
    "assistant",
    "当前问答仍为前端演示逻辑。Phase 2 会接入基于解析结果和知识图谱的真实问答服务。"
  );
}

const reports = computed(() => state.reportList);
const hierarchy = computed(() => state.parseResult.hierarchy || mockHierarchy);
const knowledgeGraph = computed(() => state.parseResult.knowledgeGraph || {});
const entities = computed(() => state.parseResult.entities || []);
const parameters = computed(() => state.parseResult.parameters || mockParameters);
const relations = computed(() => state.parseResult.relations || mockRelations);
const pages = computed(() => state.parseResult.pages || []);
const currentDoc = computed(
  () => reports.value.find((item) => item.id === state.currentDocId) || reports.value[0] || firstDebugReport || mockReports[0]
);
const compareDoc = computed(
  () => reports.value.find((item) => item.id === state.compareDocId) || null
);
const comparePages = computed(() => state.compareParseResult?.pages || []);

export function useAppState() {
  return {
    state,
    reports,
    hierarchy,
    knowledgeGraph,
    entities,
    parameters,
    relations,
    pages,
    qaStarters,
    statusMap,
    currentDoc,
    compareDoc,
    comparePages,
    loadReports,
    loadReportResult,
    loadCompareReportResult,
    selectReport,
    selectCompareReport,
    uploadReport,
    addQaMessage,
    askQuestion
  };
}
