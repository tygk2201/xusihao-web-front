<template>
  <div class="neo-graph-shell" :class="`neo-graph-shell--${variant}`">
    <div
      ref="wrapRef"
      class="svg-graph-wrap"
      @wheel.prevent="handleWheel"
      @pointerdown="beginPan"
      @pointermove="handlePointerMove"
      @pointerup="endPointerAction"
      @pointerleave="endPointerAction"
      @pointercancel="endPointerAction"
    >
      <svg
        v-if="layoutNodes.length"
        class="svg-graph"
        :viewBox="`0 0 ${viewport.width} ${viewport.height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="graph-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#8fb3ff" />
          </marker>
        </defs>

        <g :transform="sceneTransform">
          <g class="graph-edges">
            <g v-for="edge in layoutEdges" :key="edge.id">
              <path
                :d="edge.path"
                :stroke="edge.stroke"
                :stroke-width="edge.lineWidth"
                :opacity="edge.opacity"
                fill="none"
                marker-end="url(#graph-arrow)"
              />
              <text
                v-if="edge.label"
                class="graph-edge-label"
                :x="edge.labelX"
                :y="edge.labelY"
                text-anchor="middle"
              >
                {{ edge.label }}
              </text>
            </g>
          </g>

          <g class="graph-nodes">
            <g
              v-for="node in layoutNodes"
              :key="node.id"
              class="graph-node"
              :class="{ 'is-active': activeNodeId === node.id }"
              @pointerdown.stop="beginDragNode(node, $event)"
              @click.stop="selectNode(node)"
              @mouseenter="hoverNodeId = node.id"
              @mouseleave="hoverNodeId = ''"
            >
              <circle
                :cx="node.x"
                :cy="node.y"
                :r="node.radius"
                :fill="node.fill"
                :stroke="node.stroke"
                :stroke-width="node.strokeWidth"
                :opacity="node.opacity"
              />
              <circle
                :cx="node.x"
                :cy="node.y"
                :r="node.radius + (variant === 'schema' ? 7 : 5)"
                class="graph-node__halo"
                :opacity="activeNodeId === node.id || hoverNodeId === node.id ? 1 : 0.12"
                :style="{ '--halo-color': node.fill }"
              />
              <text
                class="graph-node__label"
                :x="node.x"
                :y="node.y + node.radius + 18"
                text-anchor="middle"
              >
                {{ node.label }}
              </text>
            </g>
          </g>
        </g>
      </svg>
      <div v-else class="svg-graph-empty">当前图谱暂无可显示节点</div>

      <div v-if="layoutNodes.length" class="graph-toolbar">
        <button type="button" class="graph-toolbar__btn" @click="zoomBy(1.12)">+</button>
        <button type="button" class="graph-toolbar__btn" @click="zoomBy(0.9)">-</button>
        <button type="button" class="graph-toolbar__btn graph-toolbar__btn--wide" @click="resetViewport">重置</button>
      </div>
    </div>

    <aside v-if="showInspector" class="neo-graph-inspector">
      <div class="neo-graph-inspector__title">Graph Detail</div>
      <div v-if="activeNodeData" class="neo-graph-inspector__body">
        <div class="neo-graph-inspector__name">
          {{ activeNodeData.data?.fullTitle || activeNodeData.data?.title || activeNodeData.id }}
        </div>
        <div class="neo-graph-inspector__type">{{ activeNodeData.data?.group || "Unknown" }}</div>
        <div v-if="activeNodeData.data?.description" class="neo-graph-inspector__desc">
          {{ activeNodeData.data.description }}
        </div>
        <div class="neo-graph-inspector__meta">
          <span>关联数 {{ activeNodeDegree }}</span>
        </div>
      </div>
      <div v-else class="neo-graph-inspector__empty">点击节点查看详情</div>
    </aside>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: "instance"
  },
  showInspector: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["node-select"]);

const wrapRef = ref(null);
const activeNodeId = ref("");
const hoverNodeId = ref("");
const zoom = ref(1);
const pan = reactive({ x: 0, y: 0 });
const dragState = reactive({
  mode: "",
  pointerId: null,
  nodeId: "",
  startClientX: 0,
  startClientY: 0,
  startPanX: 0,
  startPanY: 0,
  startNodeX: 0,
  startNodeY: 0
});
const nodeOffsets = ref({});

const viewport = computed(() => ({
  width: props.variant === "schema" ? 1320 : 1480,
  height: props.variant === "schema" ? 840 : 940
}));

const sceneTransform = computed(() => `translate(${pan.x} ${pan.y}) scale(${zoom.value})`);

const activeNodeData = computed(() => {
  if (!activeNodeId.value) {
    return null;
  }
  return props.data?.nodes?.find((node) => node.id === activeNodeId.value) || null;
});

const activeNodeDegree = computed(() => {
  if (!activeNodeId.value) {
    return 0;
  }
  return (props.data?.edges || []).filter(
    (edge) => edge.source === activeNodeId.value || edge.target === activeNodeId.value
  ).length;
});

const baseNodes = computed(() => {
  const source = props.data?.nodes || [];
  const count = source.length || 1;
  const width = viewport.value.width;
  const height = viewport.value.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const slotsPerRing = props.variant === "schema" ? 10 : 14;
  const orbitX = props.variant === "schema" ? width * 0.24 : width * 0.2;
  const orbitY = props.variant === "schema" ? height * 0.18 : height * 0.16;
  const ringStep = props.variant === "schema" ? 118 : 92;

  return source.map((node, index) => {
    const ring = Math.floor(index / slotsPerRing);
    const indexInRing = index % slotsPerRing;
    const ringCount = Math.min(slotsPerRing, count - ring * slotsPerRing) || 1;
    const angle = (-Math.PI / 2) + (Math.PI * 2 * indexInRing) / ringCount;
    return {
      ...node,
      x: centerX + Math.cos(angle) * (orbitX + ring * ringStep),
      y: centerY + Math.sin(angle) * (orbitY + ring * ringStep * 0.72)
    };
  });
});

const layoutNodes = computed(() => {
  return baseNodes.value.map((node) => {
    const offset = nodeOffsets.value[node.id] || { x: 0, y: 0 };
    const selected = activeNodeId.value === node.id;
    const hovered = hoverNodeId.value === node.id;
    const related = !activeNodeId.value || isConnected(node.id, activeNodeId.value);
    return {
      ...node,
      x: node.x + offset.x,
      y: node.y + offset.y,
      radius: props.variant === "schema" ? 22 : 16,
      label: truncateText(node.data?.fullTitle || node.data?.title || node.id, props.variant === "schema" ? 14 : 12),
      fill: node.style?.fill || "#1d4ed8",
      stroke: selected || hovered ? "#ffffff" : "#dbeafe",
      strokeWidth: selected ? 3 : hovered ? 2.2 : 1.3,
      opacity: activeNodeId.value ? (related ? 1 : 0.16) : 1
    };
  });
});

const layoutEdges = computed(() => {
  const nodesById = new Map(layoutNodes.value.map((node) => [node.id, node]));
  return (props.data?.edges || [])
    .map((edge) => {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      if (!source || !target) {
        return null;
      }
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normalX = -dy / distance;
      const normalY = dx / distance;
      const bend = props.variant === "schema" ? 24 : 18;
      const cx = (source.x + target.x) / 2 + normalX * bend;
      const cy = (source.y + target.y) / 2 + normalY * bend;
      const active =
        !activeNodeId.value
        || edge.source === activeNodeId.value
        || edge.target === activeNodeId.value
        || edge.source === hoverNodeId.value
        || edge.target === hoverNodeId.value;
      return {
        id: edge.id,
        path: `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`,
        stroke: edge.style?.stroke || "#8fb3ff",
        lineWidth: edge.style?.lineWidth || 1.6,
        label: edge.style?.labelText || "",
        labelX: cx,
        labelY: cy - 6,
        opacity: activeNodeId.value || hoverNodeId.value ? (active ? 0.9 : 0.08) : 0.72
      };
    })
    .filter(Boolean);
});

watch(
  () => props.data,
  () => {
    nodeOffsets.value = {};
    if (!props.data?.nodes?.length) {
      activeNodeId.value = "";
      return;
    }
    if (activeNodeId.value && !props.data.nodes.some((node) => node.id === activeNodeId.value)) {
      activeNodeId.value = "";
    }
    resetViewport();
  },
  { immediate: true, deep: true }
);

watch(
  () => props.variant,
  () => {
    nodeOffsets.value = {};
    resetViewport();
  }
);

function selectNode(node) {
  activeNodeId.value = node.id;
  emit("node-select", node);
}

function isConnected(nodeId, anchorId) {
  if (!anchorId || nodeId === anchorId) {
    return true;
  }
  return (props.data?.edges || []).some(
    (edge) =>
      (edge.source === nodeId && edge.target === anchorId)
      || (edge.target === nodeId && edge.source === anchorId)
  );
}

function truncateText(value, maxLength = 16) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

function beginPan(event) {
  if (event.button !== 0) {
    return;
  }
  dragState.mode = "pan";
  dragState.pointerId = event.pointerId;
  dragState.startClientX = event.clientX;
  dragState.startClientY = event.clientY;
  dragState.startPanX = pan.x;
  dragState.startPanY = pan.y;
  wrapRef.value?.setPointerCapture?.(event.pointerId);
}

function beginDragNode(node, event) {
  if (event.button !== 0) {
    return;
  }
  const currentOffset = nodeOffsets.value[node.id] || { x: 0, y: 0 };
  dragState.mode = "node";
  dragState.pointerId = event.pointerId;
  dragState.nodeId = node.id;
  dragState.startClientX = event.clientX;
  dragState.startClientY = event.clientY;
  dragState.startNodeX = currentOffset.x;
  dragState.startNodeY = currentOffset.y;
  wrapRef.value?.setPointerCapture?.(event.pointerId);
}

function handlePointerMove(event) {
  if (dragState.pointerId !== event.pointerId) {
    return;
  }

  const dx = event.clientX - dragState.startClientX;
  const dy = event.clientY - dragState.startClientY;

  if (dragState.mode === "pan") {
    pan.x = dragState.startPanX + dx;
    pan.y = dragState.startPanY + dy;
    return;
  }

  if (dragState.mode === "node" && dragState.nodeId) {
    const scale = zoom.value || 1;
    nodeOffsets.value = {
      ...nodeOffsets.value,
      [dragState.nodeId]: {
        x: dragState.startNodeX + dx / scale,
        y: dragState.startNodeY + dy / scale
      }
    };
  }
}

function endPointerAction(event) {
  if (dragState.pointerId !== null && event.pointerId === dragState.pointerId) {
    wrapRef.value?.releasePointerCapture?.(event.pointerId);
  }
  dragState.mode = "";
  dragState.pointerId = null;
  dragState.nodeId = "";
}

function handleWheel(event) {
  const factor = event.deltaY < 0 ? 1.08 : 0.92;
  zoomBy(factor);
}

function zoomBy(factor) {
  zoom.value = Math.max(0.45, Math.min(2.8, zoom.value * factor));
}

function resetViewport() {
  zoom.value = props.variant === "schema" ? 0.94 : 0.82;
  pan.x = 0;
  pan.y = 0;
}
</script>

<style scoped>
.neo-graph-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  min-height: 100%;
}

.svg-graph-wrap {
  position: relative;
  min-height: 640px;
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    radial-gradient(circle at top, rgba(59, 130, 246, 0.14), transparent 30%),
    #050b16;
  background-size: 24px 24px, 24px 24px, auto, auto;
  touch-action: none;
  cursor: grab;
}

.svg-graph-wrap:active {
  cursor: grabbing;
}

.svg-graph {
  width: 100%;
  height: 100%;
  min-height: 640px;
  display: block;
}

.svg-graph-empty {
  min-height: 640px;
  display: grid;
  place-items: center;
  color: #94a3b8;
}

.graph-toolbar {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
}

.graph-toolbar__btn {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 10px;
  background: rgba(8, 15, 28, 0.88);
  color: #dbeafe;
  cursor: pointer;
}

.graph-toolbar__btn--wide {
  width: auto;
  padding: 0 12px;
}

.graph-edge-label {
  fill: #dbeafe;
  font-size: 10px;
  paint-order: stroke;
  stroke: rgba(8, 15, 28, 0.96);
  stroke-width: 4px;
  stroke-linejoin: round;
  pointer-events: none;
}

.graph-node {
  cursor: move;
}

.graph-node__halo {
  fill: none;
  stroke: var(--halo-color);
  stroke-width: 2.2;
  pointer-events: none;
}

.graph-node__label {
  fill: #f8fafc;
  font-size: 11px;
  font-weight: 600;
  paint-order: stroke;
  stroke: rgba(8, 15, 28, 0.96);
  stroke-width: 4px;
  stroke-linejoin: round;
  pointer-events: none;
}

.neo-graph-inspector {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(8, 15, 28, 0.86);
  color: #dbeafe;
  backdrop-filter: blur(10px);
}

.neo-graph-inspector__title {
  margin-bottom: 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7dd3fc;
}

.neo-graph-inspector__name {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
}

.neo-graph-inspector__type {
  margin-top: 10px;
  display: inline-flex;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.14);
  color: #bfdbfe;
  font-size: 12px;
}

.neo-graph-inspector__desc {
  margin-top: 14px;
  color: #cbd5e1;
  line-height: 1.65;
  white-space: pre-wrap;
}

.neo-graph-inspector__meta {
  margin-top: 14px;
  color: #94a3b8;
  font-size: 12px;
}

.neo-graph-inspector__empty {
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .neo-graph-shell {
    grid-template-columns: 1fr;
  }
}
</style>
