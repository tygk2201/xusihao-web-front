<template>
  <div class="kg-page">
    <section class="kg-hero surface-panel">
      <div class="kg-hero__main">
        <div class="kg-hero__eyebrow">Knowledge Graph Workbench</div>
        <h2>关系图谱</h2>
        <p>按 schema / instance 双模式浏览解析结果，并在 graph / tree / list 三种视图之间切换。</p>
      </div>
      <div class="kg-hero__actions">
        <el-button @click="router.push({ name: 'dashboard' })">返回报告</el-button>
        <el-input v-model="keyword" placeholder="搜索节点、定义或关系" clearable class="kg-search" />
      </div>
    </section>

    <section class="kg-toolbar surface-panel">
      <div class="kg-toolbar__group">
        <span class="kg-toolbar__label">图谱模式</span>
        <el-segmented v-model="graphMode" :options="modeOptions" />
      </div>
      <div class="kg-toolbar__group">
        <span class="kg-toolbar__label">视图方式</span>
        <el-segmented v-model="viewMode" :options="viewOptions" />
      </div>
      <div class="kg-toolbar__group kg-toolbar__group--filter">
        <span class="kg-toolbar__label">关系筛选</span>
        <el-select
          v-model="activeRelationTypes"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          placeholder="选择关系类型"
          class="kg-filter-select"
        >
          <el-option
            v-for="item in relationTypes"
            :key="item.id"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </div>
    </section>

    <div class="kg-layout">
      <section class="surface-panel kg-canvas">
        <div class="kg-canvas__head">
          <div>
            <div class="kg-canvas__title">{{ graphMode === "schema" ? "系统图谱" : "实例图谱" }}</div>
            <div class="kg-canvas__meta">
              <span>{{ filteredGraph.nodes.length }} 个节点</span>
              <span>{{ filteredGraph.edges.length }} 条边</span>
            </div>
          </div>
          <el-tag type="info">{{ graphMode }}</el-tag>
        </div>

        <div v-if="viewMode === 'graph'" class="kg-canvas__body">
          <el-alert
            v-if="graphMode === 'instance' && isHeavyGraph"
            title="当前实例图谱节点较多，建议先用关键词或关系类型筛选，再查看图视图。"
            type="warning"
            :closable="false"
            class="kg-graph-alert"
          />
          <GraphCanvas :data="graphCanvasData" :variant="graphMode" @node-select="handleNodeSelect" />
        </div>

        <div v-else-if="viewMode === 'tree'" class="kg-tree">
          <div v-for="root in treeRoots" :key="root.id" class="kg-tree__root">
            <div class="kg-tree__node" @click="selectNodeById(root.id)">
              <strong>{{ root.name }}</strong>
              <span>{{ root.category }}</span>
            </div>
            <div v-if="root.children.length" class="kg-tree__children">
              <div
                v-for="child in root.children"
                :key="`${root.id}-${child.id}`"
                class="kg-tree__child"
                @click="selectNodeById(child.id)"
              >
                <strong>{{ child.name }}</strong>
                <span>{{ child.edgeLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="kg-list">
          <article
            v-for="node in filteredGraph.nodes"
            :key="node.id"
            class="kg-list__item"
            @click="selectNodeById(node.id)"
          >
            <div class="kg-list__head">
              <strong>{{ node.name }}</strong>
              <el-tag size="small">{{ node.category }}</el-tag>
            </div>
            <p>{{ node.definition || node.description || "暂无定义" }}</p>
          </article>
        </div>
      </section>

      <aside class="surface-panel kg-sidebar">
        <div class="kg-sidebar__section">
          <div class="kg-sidebar__title">图谱摘要</div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前文档">{{ currentDoc?.name || "未选择" }}</el-descriptions-item>
            <el-descriptions-item label="模式">{{ graphMode }}</el-descriptions-item>
            <el-descriptions-item label="视图">{{ viewMode }}</el-descriptions-item>
            <el-descriptions-item label="类别数">{{ categories.length }}</el-descriptions-item>
            <el-descriptions-item label="关系类型">{{ relationTypes.length }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="kg-sidebar__section">
          <div class="kg-sidebar__title">节点类别</div>
          <div class="kg-category-list">
            <div v-for="item in categories" :key="item.id" class="kg-category-item">
              <i :style="{ background: item.color || '#94a3b8' }"></i>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="kg-sidebar__section">
          <div class="kg-sidebar__title">节点详情</div>
          <div v-if="activeNodeData" class="kg-detail">
            <h3>{{ activeNodeData.name }}</h3>
            <el-tag>{{ activeNodeData.category }}</el-tag>
            <p>{{ activeNodeData.definition || activeNodeData.description || "暂无说明" }}</p>
            <dl>
              <div>
                <dt>置信度</dt>
                <dd>{{ formatConfidence(activeNodeData.confidence) }}</dd>
              </div>
              <div>
                <dt>页码</dt>
                <dd>{{ activeNodeData.pageNumber || "-" }}</dd>
              </div>
              <div>
                <dt>来源</dt>
                <dd>{{ activeNodeData.sourceType || "-" }}</dd>
              </div>
            </dl>
          </div>
          <el-empty v-else description="点击图谱中的节点查看详情" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import GraphCanvas from "../components/G6Graph.vue";
import { useAppState } from "../composables/useAppState.js";

const router = useRouter();
const { currentDoc, knowledgeGraph } = useAppState();

const keyword = ref("");
const graphMode = ref("schema");
const viewMode = ref("graph");
const activeNodeId = ref("");
const activeRelationTypes = ref([]);

const modeOptions = [
  { label: "Schema", value: "schema" },
  { label: "Instance", value: "instance" }
];

const viewOptions = [
  { label: "Graph", value: "graph" },
  { label: "Tree", value: "tree" },
  { label: "List", value: "list" }
];

const activePayload = computed(() => knowledgeGraph.value?.[graphMode.value] || { graph: { nodes: [], edges: [] } });
const categories = computed(() => activePayload.value.categories || []);
const relationTypes = computed(() => activePayload.value.relationTypes || []);

const isHeavyGraph = computed(() => {
  const graph = activePayload.value.graph || { nodes: [], edges: [] };
  return (graph.nodes?.length || 0) > 90 || (graph.edges?.length || 0) > 120;
});

watch(
  relationTypes,
  (items) => {
    activeRelationTypes.value = items.map((item) => item.id);
  },
  { immediate: true }
);

watch(
  [graphMode, isHeavyGraph],
  ([mode, heavy]) => {
    if (mode === "instance" && heavy && viewMode.value === "graph") {
      viewMode.value = "list";
    } else if (viewMode.value !== "graph" && (!heavy || mode === "schema")) {
      viewMode.value = "graph";
    }
  },
  { immediate: true }
);

const filteredGraph = computed(() => {
  const payload = activePayload.value.graph || { nodes: [], edges: [] };
  const q = keyword.value.trim().toLowerCase();
  const allowedTypes = new Set(activeRelationTypes.value);
  const nodeMap = new Map((payload.nodes || []).map((node) => [node.id, node]));

  const edges = (payload.edges || []).filter((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const sourceName = sourceNode?.name || "";
    const targetName = targetNode?.name || "";
    const hitType = !allowedTypes.size || allowedTypes.has(edge.type);
    const hitKeyword = !q || `${edge.label || ""} ${sourceName} ${targetName}`.toLowerCase().includes(q);
    return hitType && hitKeyword;
  });

  const visibleNodeIds = new Set();
  edges.forEach((edge) => {
    visibleNodeIds.add(edge.source);
    visibleNodeIds.add(edge.target);
  });

  const nodes = (payload.nodes || []).filter((node) => {
    const hitKeyword =
      !q || `${node.name || ""} ${node.definition || ""} ${node.description || ""}`.toLowerCase().includes(q);
    if (!edges.length && !q) {
      return true;
    }
    return hitKeyword || visibleNodeIds.has(node.id);
  });

  const existingIds = new Set(nodes.map((node) => node.id));
  return {
    nodes,
    edges: edges.filter((edge) => existingIds.has(edge.source) && existingIds.has(edge.target))
  };
});

const graphCanvasData = computed(() => ({
  nodes: filteredGraph.value.nodes.map((node) => ({
    id: node.id,
    data: {
      title: node.name,
      fullTitle: node.name,
      group: node.category,
      description: node.definition || node.description || ""
    },
    style: {
      fill: node.style?.color || categoryColor(node.category),
      stroke: "#dbeafe"
    }
  })),
  edges: filteredGraph.value.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    style: {
      labelText: truncateText(edge.label, 12),
      stroke: relationStroke(edge.type),
      lineWidth: edge.weight ? Math.max(1.2, Math.min(3.8, edge.weight * 0.35 + 1.1)) : 1.6
    }
  }))
}));

const activeNodeData = computed(
  () => filteredGraph.value.nodes.find((node) => node.id === activeNodeId.value) || filteredGraph.value.nodes[0] || null
);

const treeRoots = computed(() => {
  const nodeMap = new Map(filteredGraph.value.nodes.map((node) => [node.id, { ...node, children: [] }]));
  const hasParent = new Set();

  filteredGraph.value.edges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) {
      return;
    }
    source.children.push({
      id: target.id,
      name: target.name,
      category: target.category,
      edgeLabel: edge.label
    });
    hasParent.add(target.id);
  });

  return [...nodeMap.values()].filter((node) => !hasParent.has(node.id));
});

watch(
  filteredGraph,
  (graph) => {
    if (!graph.nodes.length) {
      activeNodeId.value = "";
      return;
    }
    if (!graph.nodes.some((item) => item.id === activeNodeId.value)) {
      activeNodeId.value = graph.nodes[0].id;
    }
  },
  { immediate: true, deep: true }
);

function truncateText(value, maxLength = 18) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

function categoryColor(category) {
  return categories.value.find((item) => item.id === category)?.color || "#60a5fa";
}

function relationStroke(type) {
  const map = {
    page_anchor: "#60a5fa",
    composition: "#34d399",
    parameter: "#f87171",
    image_context: "#c084fc",
    table_context: "#fbbf24",
    alias_entry: "#f59e0b",
    alias_of: "#38bdf8",
    term_entry: "#22c55e",
    define: "#fb7185"
  };
  return map[type] || "#94a3b8";
}

function handleNodeSelect(node) {
  activeNodeId.value = node?.id || "";
}

function selectNodeById(id) {
  activeNodeId.value = id;
}

function formatConfidence(value) {
  const numeric = Number(value || 0);
  if (!numeric) {
    return "-";
  }
  return `${Math.round(numeric * 100)}%`;
}
</script>

<style scoped>
.kg-page {
  display: grid;
  gap: 18px;
}

.kg-hero,
.kg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.kg-hero {
  padding: 22px 24px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.22), transparent 34%),
    radial-gradient(circle at right, rgba(16, 185, 129, 0.18), transparent 28%),
    linear-gradient(135deg, #081122 0%, #111c34 52%, #091421 100%);
  color: #f8fafc;
}

.kg-hero__eyebrow,
.kg-toolbar__label,
.kg-sidebar__title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8fb3ff;
}

.kg-hero__main h2 {
  margin: 6px 0 8px;
  font-size: 28px;
  color: #f8fafc;
}

.kg-hero__main p {
  margin: 0;
  color: #bfd1f3;
}

.kg-hero__actions {
  min-width: 320px;
  display: grid;
  gap: 12px;
}

.kg-search {
  max-width: 360px;
}

.kg-toolbar {
  padding: 16px 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.kg-toolbar__group {
  display: grid;
  gap: 10px;
}

.kg-toolbar__group--filter {
  min-width: 260px;
  margin-left: auto;
}

.kg-filter-select {
  min-width: 240px;
}

.kg-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
}

.kg-canvas {
  min-height: 720px;
  display: grid;
  gap: 14px;
  padding: 18px;
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.12), transparent 22%),
    linear-gradient(180deg, #08101e 0%, #0f172a 100%);
}

.kg-canvas__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #e2e8f0;
}

.kg-canvas__title {
  font-size: 18px;
  font-weight: 700;
}

.kg-canvas__meta {
  display: flex;
  gap: 12px;
  color: #94a3b8;
  font-size: 13px;
}

.kg-canvas__body {
  min-height: 620px;
}

.kg-graph-alert {
  margin-bottom: 12px;
}

.kg-tree,
.kg-list {
  display: grid;
  gap: 12px;
}

.kg-tree__root,
.kg-list__item {
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.72);
  color: #e2e8f0;
}

.kg-tree__node,
.kg-tree__child,
.kg-list__item {
  cursor: pointer;
}

.kg-tree__node,
.kg-tree__child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kg-tree__children {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  padding-left: 18px;
  border-left: 1px solid rgba(148, 163, 184, 0.18);
}

.kg-list__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.kg-list__item p {
  margin: 10px 0 0;
  color: #cbd5e1;
  line-height: 1.65;
  white-space: pre-wrap;
}

.kg-sidebar {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.kg-sidebar__section {
  display: grid;
  gap: 12px;
}

.kg-category-list {
  display: grid;
  gap: 10px;
}

.kg-category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
}

.kg-category-item i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.kg-detail h3 {
  margin: 0 0 10px;
}

.kg-detail p {
  margin: 12px 0;
  line-height: 1.65;
  color: #475569;
  white-space: pre-wrap;
}

.kg-detail dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.kg-detail dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.kg-detail dt {
  color: #64748b;
}

.kg-detail dd {
  margin: 0;
  color: #0f172a;
}

@media (max-width: 1100px) {
  .kg-layout {
    grid-template-columns: 1fr;
  }

  .kg-hero,
  .kg-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .kg-hero__actions,
  .kg-toolbar__group--filter,
  .kg-filter-select {
    min-width: 0;
    width: 100%;
  }
}
</style>
