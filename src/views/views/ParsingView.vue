<template>
  <div class="page-stack parsing-workspace">
    <section class="surface-panel parsing-header">
      <div class="parsing-header__main">
        <div class="parsing-header__title">
          <div class="parsing-header__eyebrow">报告解析工作台</div>
          <h2>{{ currentDoc?.name || "未选择报告" }}</h2>
          <p>当前页面只查看当前选中报告的单份解析结果。不同解析结果作为独立报告，分别从报告列表进入查看。</p>
        </div>
        <div class="parsing-header__meta">
          <el-tag :type="statusTone">{{ statusLabel }}</el-tag>
          <span>{{ pageCount }} 页</span>
          <span>{{ selectedPageLabel }}</span>
          <span>{{ currentPageTextBlocks.length }} 个文本块</span>
        </div>
      </div>

      <div class="parsing-header__toolbar">
        <div class="parsing-toolbar__left">
          <el-input
            v-model="filterKeyword"
            placeholder="搜索当前页文本、表格、图片、公式或关系"
            clearable
            class="parsing-search"
          />
        </div>
        <div class="parsing-toolbar__right">
          <el-button plain @click="pickPrevPage" :disabled="!pages.length">上一页</el-button>
          <el-tag type="info" effect="plain">{{ selectedPageLabel }}</el-tag>
          <el-button plain @click="pickNextPage" :disabled="!pages.length">下一页</el-button>
        </div>
      </div>
    </section>

    <div class="parsing-results-grid">
      <section class="surface-panel parsing-pdf-panel">
        <div class="preview-toolbar">
          <div>
            <div class="preview-toolbar__label">文档预览</div>
            <h3>{{ currentDoc?.sourceFileName || currentDoc?.name || "PDF" }}</h3>
          </div>
          <div class="preview-toolbar__meta">
            <span>{{ selectedPageLabel }}</span>
            <span>{{ currentDoc?.id }}</span>
          </div>
        </div>

        <div class="pdf-frame-wrap">
          <img
            v-if="currentPagePreviewUrl"
            :src="currentPagePreviewUrl"
            class="pdf-preview-image"
            :alt="selectedPageLabel"
          />
          <el-empty v-else description="当前结果没有该页预览图" />
        </div>
      </section>

      <aside class="surface-panel parsing-analysis-panel">
        <div class="analysis-tabs">
          <button
            v-for="tab in analysisTabs"
            :key="tab.value"
            type="button"
            class="analysis-tabs__item"
            :class="{ 'is-active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="analysis-content">
          <template v-if="activeTab === 'text'">
            <div class="analysis-section">
              <h4>文本</h4>
              <article class="page-meta-card page-meta-card--static">
                <div class="page-meta-card__head">
                  <strong>{{ selectedPageLabel }}</strong>
                  <span>{{ currentPageTextBlocks.length }} 个文本块</span>
                </div>
                <p>{{ selectedPage?.summary || "暂无文本摘要" }}</p>
                <div class="text-snippet-list">
                  <div
                    v-for="(block, index) in currentPageTextBlocks"
                    :key="`current-block-${selectedPageNumber}-${index}`"
                    class="text-snippet"
                  >
                    <span>{{ blockLabel(block) }}</span>
                    <div>{{ block.content }}</div>
                  </div>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeTab === 'table'">
            <div class="analysis-section">
              <h4>表格</h4>
              <div v-if="currentPageTables.length" class="table-result-stack">
                <article
                  v-for="table in currentPageTables"
                  :key="`current-${table.id}`"
                  class="table-result-card"
                >
                  <div class="table-result-card__head">
                    <strong>{{ table.id }}</strong>
                    <span>{{ selectedPageLabel }}</span>
                  </div>
                  <img
                    v-if="table.image_url"
                    :src="table.image_url"
                    :alt="table.id"
                    class="table-result-card__image"
                  />
                  <div v-if="table.headers?.length" class="table-result-card__grid">
                    <table class="parsed-table">
                      <thead>
                        <tr>
                          <th v-for="(header, index) in table.headers" :key="`current-${table.id}-header-${index}`">
                            {{ header || `列${index + 1}` }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, rowIndex) in table.rows" :key="`current-${table.id}-row-${rowIndex}`">
                          <td
                            v-for="(cell, cellIndex) in normalizedTableRow(row, table.headers.length)"
                            :key="`current-${table.id}-cell-${rowIndex}-${cellIndex}`"
                          >
                            {{ cell || "-" }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <pre v-else-if="table.markdown" class="table-result-card__markdown">{{ table.markdown }}</pre>
                </article>
              </div>
              <el-empty v-else description="当前结果在该页没有表格数据" />
            </div>
          </template>

          <template v-else-if="activeTab === 'image'">
            <div class="analysis-section">
              <h4>图片</h4>
              <div class="asset-grid">
                <article v-for="item in currentPageImages" :key="`current-${item.id}`" class="asset-card">
                  <div class="asset-card__badge">{{ selectedPageLabel }}</div>
                  <img v-if="item.url" :src="item.url" class="asset-card__image" :alt="item.id" />
                  <strong>{{ item.id }}</strong>
                  <p>{{ item.description }}</p>
                </article>
              </div>
              <el-empty v-if="!currentPageImages.length" description="当前结果在该页没有图片数据" />
            </div>
          </template>

          <template v-else-if="activeTab === 'formula'">
            <div class="analysis-section">
              <h4>公式</h4>
              <div class="formula-list">
                <article v-for="item in currentPageFormulas" :key="`current-${item.id}`" class="formula-card">
                  <div class="formula-card__meta">
                    <span>{{ selectedPageLabel }}</span>
                    <span v-if="item.confidence">置信度 {{ Number(item.confidence).toFixed(2) }}</span>
                  </div>
                  <div class="formula-card__body">{{ item.content }}</div>
                  <div v-if="item.latex_like" class="formula-card__latex">{{ item.latex_like }}</div>
                  <p v-if="item.reason" class="formula-card__reason">{{ item.reason }}</p>
                </article>
              </div>
              <el-empty v-if="!currentPageFormulas.length" description="当前结果在该页没有公式数据" />
            </div>
          </template>

          <template v-else>
            <div class="analysis-section">
              <h4>关系图谱</h4>
              <div v-if="currentPageRelationGraph.nodes.length" class="page-graph-panel">
                <G6Graph
                  :data="currentPageRelationGraph"
                  :node="pageGraphNodeConfig"
                  :edge="pageGraphEdgeConfig"
                />
              </div>
              <el-empty v-else description="当前结果在该页没有关系图谱数据" />
            </div>
          </template>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import G6Graph from "../components/G6Graph.vue";
import { useAppState } from "../composables/useAppState.js";

const { currentDoc, pages, relations, statusMap } = useAppState();

const filterKeyword = ref("");
const activeTab = ref("text");
const selectedPageNumber = ref(0);

const analysisTabs = [
  { label: "文本", value: "text" },
  { label: "表格", value: "table" },
  { label: "图片", value: "image" },
  { label: "公式", value: "formula" },
  { label: "关系图谱", value: "graph" }
];

const pageGraphNodeConfig = {
  type: "circle",
  style: {
    size: 72,
    lineWidth: 2,
    stroke: "#1f2937",
    fill: "#f8fafc",
    labelPlacement: "center",
    labelFill: "#0f172a",
    labelFontSize: 12
  }
};

const pageGraphEdgeConfig = {
  type: "line",
  style: {
    stroke: "#64748b",
    lineWidth: 2,
    endArrow: true,
    labelFill: "#334155",
    labelBackground: true,
    labelBackgroundFill: "#ffffff",
    labelBackgroundRadius: 6
  }
};

watch(
  pages,
  (list) => {
    if (!list.length) {
      selectedPageNumber.value = 0;
      return;
    }
    const exists = list.some((page) => page.page_number === selectedPageNumber.value);
    if (!exists) {
      selectedPageNumber.value = list[0].page_number;
    }
  },
  { immediate: true }
);

const pageCount = computed(() => pages.value.length);
const statusLabel = computed(() => statusMap[currentDoc.value?.status]?.label || currentDoc.value?.status || "未知状态");
const statusTone = computed(() => statusMap[currentDoc.value?.status]?.tone || "info");
const selectedPage = computed(
  () => pages.value.find((page) => page.page_number === selectedPageNumber.value) || pages.value[0] || null
);
const selectedPageLabel = computed(() => (selectedPage.value ? `第 ${selectedPage.value.page_number} 页` : "无页面"));
const currentPagePreviewUrl = computed(() => selectedPage.value?.preview_url || "");

function filterByKeyword(items, projector) {
  const keyword = filterKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return items;
  }
  return items.filter((item) => projector(item).toLowerCase().includes(keyword));
}

const currentPageTextBlocks = computed(() => filterByKeyword(selectedPage.value?.text_blocks || [], (block) => String(block.content || "")));
const currentPageTables = computed(() =>
  filterByKeyword(selectedPage.value?.tables || [], (table) =>
    [table.id, ...(table.headers || []), ...((table.rows || []).flatMap((row) => row || [])), table.markdown || ""].join(" ")
  )
);

function normalizeImages(page, label) {
  return (page?.images || []).map((image, index) => ({
    id: image.id || `img-${page?.page_number}-${index + 1}`,
    description: image.description || `${label} 图片`,
    url: image.url || ""
  }));
}

const currentPageImages = computed(() => filterByKeyword(normalizeImages(selectedPage.value, selectedPageLabel.value), (item) => `${item.id} ${item.description}`));
const currentPageFormulas = computed(() =>
  filterByKeyword(selectedPage.value?.formulas || [], (item) => `${item.content || ""} ${item.latex_like || ""} ${item.reason || ""}`)
);

function collectPageObjects(page) {
  if (!page) {
    return [];
  }
  if (page.entities?.length) {
    return page.entities;
  }
  const objects = [];
  (page.text_blocks || []).forEach((block, index) => {
    if (block.kind !== "heading") {
      return;
    }
    const name = String(block.content || "").trim();
    if (!name) {
      return;
    }
    const level = Number(block.level || 0);
    objects.push({
      id: `page-${page.page_number}-heading-${index + 1}`,
      name,
      type: level <= 1 ? "System" : level === 2 ? "Equipment" : "Component",
      description: `来源于第 ${page.page_number} 页标题块`
    });
  });
  (page.tables || []).forEach((table) => {
    const label = table.headers?.join(" / ") || table.id;
    objects.push({
      id: table.id,
      name: label,
      type: "Table",
      description: `来源于第 ${page.page_number} 页表格`
    });
  });
  (page.images || []).forEach((image) => {
    objects.push({
      id: image.id,
      name: image.id,
      type: "Image",
      description: image.description || `来源于第 ${page.page_number} 页图片`
    });
  });
  const dedup = new Map();
  objects.forEach((item) => {
    const key = normalizeGraphText(item.name || item.id);
    if (!key || dedup.has(key)) {
      return;
    }
    dedup.set(key, item);
  });
  return [...dedup.values()];
}

function normalizeGraphText(text) {
  return String(text || "")
    .replace(/\s+/g, "")
    .replace(/[()_[\]/\-]/g, "")
    .toLowerCase();
}

function matchesObjectTexts(text, objectTexts) {
  if (!text) {
    return false;
  }
  for (const item of objectTexts) {
    if (!item) {
      continue;
    }
    if (text.includes(item) || item.includes(text)) {
      return true;
    }
  }
  return false;
}

function buildPageRelations(page) {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const pageLevelRelations = page?.relations || [];
  if (pageLevelRelations.length) {
    return pageLevelRelations.filter((item) =>
      !keyword || `${item.sourceName || ""} ${item.targetName || ""} ${item.label || ""}`.toLowerCase().includes(keyword)
    );
  }
  const pageObjects = collectPageObjects(page);
  const objectTexts = new Set(pageObjects.map((item) => normalizeGraphText(item.name)));
  const objectIds = new Set(pageObjects.map((item) => item.id).filter(Boolean));
  return relations.value.filter((item) => {
    const sourceName = normalizeGraphText(item.sourceName || "");
    const targetName = normalizeGraphText(item.targetName || "");
    const sourceHit = objectIds.has(item.source) || matchesObjectTexts(sourceName, objectTexts);
    const targetHit = objectIds.has(item.target) || matchesObjectTexts(targetName, objectTexts);
    const hitKeyword =
      !keyword || `${item.sourceName || ""} ${item.targetName || ""} ${item.label || ""}`.toLowerCase().includes(keyword);
    return (sourceHit || targetHit) && hitKeyword;
  });
}

const currentPageRelations = computed(() => buildPageRelations(selectedPage.value));

function buildPageRelationGraph(page, pageRelations) {
  const pageKnowledgeGraph = page?.knowledge_graph;
  if (pageKnowledgeGraph?.nodes?.length) {
    return {
      nodes: pageKnowledgeGraph.nodes.map((node) => ({
        id: node.id,
        data: {
          title: node.name,
          group: node.category,
          description: node.definition || node.description || ""
        },
        style: {
          fill: node.style?.color || "#e2e8f0"
        }
      })),
      edges: (pageKnowledgeGraph.edges || []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        style: {
          labelText: edge.label || "关联",
          stroke: edge.type === "parameter" ? "#ef4444" : "#64748b"
        }
      }))
    };
  }

  const palette = {
    System: "#dbeafe",
    Section: "#bfdbfe",
    Equipment: "#dcfce7",
    Component: "#fef3c7",
    Parameter: "#fee2e2",
    Image: "#ede9fe",
    Table: "#fde68a",
    Unknown: "#e2e8f0"
  };

  const nodeMap = new Map();
  const edges = [];
  const pageEntities = page?.entities?.length ? page.entities : collectPageObjects(page);

  pageEntities.forEach((item, index) => {
    const nodeId = item.id || `page-object-${index + 1}`;
    if (nodeMap.has(nodeId)) {
      return;
    }
    nodeMap.set(nodeId, {
      id: nodeId,
      data: {
        title: item.name,
        group: item.type || "Unknown",
        description: item.description || ""
      },
      style: {
        fill: palette[item.type] || palette.Unknown
      }
    });
  });

  function ensureNode(id, name, type) {
    const nodeId = id || name;
    if (!nodeId || nodeMap.has(nodeId)) {
      return;
    }
    nodeMap.set(nodeId, {
      id: nodeId,
      data: {
        title: String(name || nodeId),
        group: type || "Unknown"
      },
      style: {
        fill: palette[type] || palette.Unknown
      }
    });
  }

  pageRelations.forEach((item, index) => {
    ensureNode(item.source || item.sourceName, item.sourceName, item.sourceType || "Unknown");
    ensureNode(item.target || item.targetName, item.targetName, item.targetType || "Unknown");
    edges.push({
      id: `edge-${index + 1}`,
      source: item.source || item.sourceName,
      target: item.target || item.targetName,
      style: {
        labelText: item.label || "关联",
        stroke: item.type === "parameter" ? "#ef4444" : "#64748b"
      }
    });
  });

  return {
    nodes: [...nodeMap.values()],
    edges
  };
}

const currentPageRelationGraph = computed(() => buildPageRelationGraph(selectedPage.value, currentPageRelations.value));

function blockLabel(block) {
  if (block.kind === "heading") {
    const level = Number(block.level || 0);
    const marker = block.marker ? `${block.marker} ` : "";
    return level ? `标题 L${level}: ${marker}` : "标题";
  }
  if (block.kind === "table_caption") {
    return "表名";
  }
  if (block.kind === "figure_caption") {
    return "图名";
  }
  if (block.kind === "header") {
    return "页眉";
  }
  if (block.kind === "footer") {
    return "页脚";
  }
  return "正文";
}

function normalizedTableRow(row, width) {
  return [...(row || []), ...Array(Math.max(0, width - (row?.length || 0))).fill("")]
    .slice(0, width);
}

function pickPrevPage() {
  if (!pages.value.length || !selectedPage.value) {
    return;
  }
  const currentIndex = pages.value.findIndex((page) => page.page_number === selectedPage.value.page_number);
  const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
  selectedPageNumber.value = pages.value[nextIndex].page_number;
}

function pickNextPage() {
  if (!pages.value.length || !selectedPage.value) {
    return;
  }
  const currentIndex = pages.value.findIndex((page) => page.page_number === selectedPage.value.page_number);
  const nextIndex = currentIndex >= pages.value.length - 1 ? currentIndex : currentIndex + 1;
  selectedPageNumber.value = pages.value[nextIndex].page_number;
}
</script>

<style scoped>
.table-result-stack,
.formula-list {
  display: grid;
  gap: 16px;
}

.table-result-card,
.formula-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
}

.table-result-card__head,
.formula-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #52607a;
  font-size: 12px;
}

.table-result-card__image {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
}

.table-result-card__grid {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
}

.parsed-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 420px;
}

.parsed-table th,
.parsed-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
  vertical-align: top;
  white-space: pre-wrap;
  line-height: 1.55;
  font-size: 13px;
  color: #1f2937;
}

.parsed-table th:last-child,
.parsed-table td:last-child {
  border-right: none;
}

.parsed-table thead th {
  background: #f5f7fb;
  font-weight: 600;
  color: #0f172a;
}

.parsed-table tbody tr:last-child td {
  border-bottom: none;
}

.table-result-card__markdown {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  background: #0f172a;
  color: #e2e8f0;
  white-space: pre-wrap;
  overflow-x: auto;
}

.formula-card__body {
  font-size: 16px;
  line-height: 1.7;
  color: #0f172a;
  white-space: pre-wrap;
}

.formula-card__latex {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #475569;
  white-space: pre-wrap;
}

.formula-card__reason {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.page-graph-panel {
  display: grid;
  gap: 12px;
}

.page-graph-panel :deep(.g6-graph) {
  min-height: 560px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background:
    radial-gradient(circle at top, rgba(148, 163, 184, 0.14), transparent 38%),
    linear-gradient(180deg, #fcfdff 0%, #f4f7fb 100%);
}
</style>
