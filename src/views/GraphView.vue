<template>
  <div class="page-stack">
    <section class="surface-panel graph-toolbar">
      <div class="graph-toolbar__left">
        <el-button @click="router.push({ name: 'dashboard' })">返回报告</el-button>
        <h2>系统图谱</h2>
        <el-radio-group v-model="state.graphMode">
          <el-radio-button label="composition" value="composition">系统构成图</el-radio-button>
          <el-radio-button label="impact" value="impact">系统影响图</el-radio-button>
        </el-radio-group>
      </div>
      <div class="graph-toolbar__right">
        <el-input v-model="graphKeyword" placeholder="搜索节点" clearable />
        <el-button>导出</el-button>
        <el-button>刷新</el-button>
      </div>
    </section>

    <div class="graph-grid">
      <section class="surface-panel graph-panel">
        <div class="section-heading section-heading--inline">
          <span>{{ state.graphMode === 'composition' ? '系统构成图' : '影响路径图' }}</span>
          <el-tag type="info">{{ state.graphMode === "composition" ? "Structure" : "Impact" }}</el-tag>
        </div>
        <G6Graph :data="graphData" :node="nodeConfig" :edge="edgeConfig" />
      </section>

      <section class="surface-panel graph-panel">
        <div class="section-heading section-heading--inline">
          <span>{{ insightTitle }}</span>
          <el-tag type="success">分析摘要</el-tag>
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="节点数量">{{ graphData.nodes.length }}</el-descriptions-item>
          <el-descriptions-item label="边数量">{{ graphData.edges.length }}</el-descriptions-item>
          <el-descriptions-item label="当前文档">{{ currentDoc.name }}</el-descriptions-item>
          <el-descriptions-item label="观察结论">
            {{ state.graphMode === "composition" ? "冷却系统下的循环水泵是主要设备聚合点。" : "故障链从轴承磨损扩展至报警与停机措施。" }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="insight-chain">
          <div v-for="item in insightList" :key="item" class="insight-chain__item">
            {{ item }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import G6Graph from "../components/G6Graph.vue";
import { useAppState } from "../composables/useAppState";

const router = useRouter();
const graphKeyword = ref("");
const { currentDoc, relations, state } = useAppState();

const palette = {
  System: "#2346ff",
  Equipment: "#0f766e",
  Component: "#f59e0b",
  Condition: "#ef4444",
  Event: "#7c3aed",
  Measure: "#16a34a"
};

const nodeConfig = {
  type: "rect",
  style: {
    size: [132, 42],
    radius: 10,
    lineWidth: 1,
    stroke: "#d8e1ee",
    fill: "#ffffff",
    labelPlacement: "center",
    labelFill: "#10233f",
    labelFontSize: 12
  }
};

const edgeConfig = {
  type: "polyline",
  style: {
    stroke: "#8ea0b8",
    lineWidth: 2,
    endArrow: true,
    labelFill: "#52637a",
    radius: 16
  }
};

const compositionData = {
  nodes: [
    { id: "root", data: { title: "联合循环电站", group: "System" }, style: { x: 110, y: 90, fill: palette.System } },
    { id: "sys-power", data: { title: "供电系统", group: "System" }, style: { x: 340, y: 40, fill: palette.System } },
    { id: "sys-cooling", data: { title: "冷却系统", group: "System" }, style: { x: 340, y: 140, fill: palette.System } },
    { id: "sys-thermal", data: { title: "热力系统", group: "System" }, style: { x: 340, y: 240, fill: palette.System } },
    { id: "equ-transformer", data: { title: "主变压器", group: "Equipment" }, style: { x: 600, y: 40, fill: palette.Equipment } },
    { id: "equ-pump", data: { title: "循环水泵", group: "Equipment" }, style: { x: 600, y: 120, fill: palette.Equipment } },
    { id: "equ-tower", data: { title: "冷却塔", group: "Equipment" }, style: { x: 600, y: 180, fill: palette.Equipment } },
    { id: "comp-bearing", data: { title: "轴承", group: "Component" }, style: { x: 820, y: 90, fill: palette.Component } },
    { id: "comp-seal", data: { title: "密封件", group: "Component" }, style: { x: 820, y: 150, fill: palette.Component } }
  ],
  edges: [
    { source: "root", target: "sys-power", style: { labelText: "包含" } },
    { source: "root", target: "sys-cooling", style: { labelText: "包含" } },
    { source: "root", target: "sys-thermal", style: { labelText: "包含" } },
    { source: "sys-power", target: "equ-transformer", style: { labelText: "包含" } },
    { source: "sys-cooling", target: "equ-pump", style: { labelText: "包含" } },
    { source: "sys-cooling", target: "equ-tower", style: { labelText: "包含" } },
    { source: "equ-pump", target: "comp-bearing", style: { labelText: "组成" } },
    { source: "equ-pump", target: "comp-seal", style: { labelText: "组成" } }
  ]
};

const impactData = computed(() => {
  const items = relations.filter((item) => item.type === "impact").filter((item) => {
    const keyword = graphKeyword.value.trim();
    if (!keyword) {
      return true;
    }
    return item.sourceName.includes(keyword) || item.targetName.includes(keyword);
  });

  const order = new Map();
  const nodes = [];

  function upsert(id, title, group) {
    if (!order.has(id)) {
      const index = order.size;
      order.set(id, index);
      nodes.push({
        id,
        data: { title, group },
        style: {
          x: 120 + index * 140,
          y: 180 + (index % 2 === 0 ? -36 : 36),
          fill: palette[group]
        }
      });
    }
  }

  items.forEach((item) => {
    upsert(item.source, item.sourceName, item.sourceType);
    upsert(item.target, item.targetName, item.targetType);
  });

  return {
    nodes,
    edges: items.map((item) => ({
      source: item.source,
      target: item.target,
      style: {
        labelText: item.label,
        stroke: item.label === "导致" ? "#ef4444" : "#7c3aed"
      }
    }))
  };
});

const graphData = computed(() => (state.graphMode === "composition" ? compositionData : impactData.value));
const insightTitle = computed(() => (state.graphMode === "composition" ? "结构聚焦" : "故障影响链"));
const insightList = computed(() =>
  state.graphMode === "composition"
    ? ["联合循环电站", "冷却系统", "循环水泵", "轴承 / 密封件"]
    : ["轴承磨损", "转子失衡", "振动超标", "报警装置启动", "紧急停机", "更换轴承"]
);
</script>
