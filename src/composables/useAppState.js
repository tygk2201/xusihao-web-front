import { computed, reactive } from "vue";
import { hierarchy, parameters, qaStarters, relations, reports } from "../data/mockData";

const state = reactive({
  currentDocId: reports[0].id,
  searchKeyword: "",
  graphMode: "composition",
  qaMessages: [
    {
      id: "welcome",
      role: "assistant",
      content: "基于当前工程报告的结构化数据，你可以直接询问设备、系统、参数或故障影响链。"
    }
  ],
  apiConfig: {
    provider: "SiliconFlow",
    model: "DeepSeek-V3",
    apiKey: ""
  }
});

const statusMap = {
  completed: { label: "已完成", tone: "success" },
  processing: { label: "解析中", tone: "warning" },
  needReview: { label: "需人工修正", tone: "info" }
};

const currentDoc = computed(() => reports.find((item) => item.id === state.currentDocId) || reports[0]);

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
    "根据图谱与解析结果，当前最直接的影响链为：主泵异常 -> 冷却流量中断 -> 温度升高 -> 报警装置启动 -> 紧急停机。建议优先核查循环水泵、轴承磨损和振动参数。"
  );
}

export function useAppState() {
  return {
    state,
    reports,
    hierarchy,
    parameters,
    relations,
    qaStarters,
    statusMap,
    currentDoc,
    addQaMessage,
    askQuestion
  };
}
