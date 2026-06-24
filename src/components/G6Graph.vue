<template>
  <div ref="containerRef" class="g6-graph"></div>
</template>

<script setup>
import { Graph } from "@antv/g6";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  node: {
    type: Object,
    default: () => ({
      type: "rect",
      style: {
        radius: 12,
        lineWidth: 1,
        stroke: "#d0d7e2",
        fill: "#ffffff",
        labelText: "",
        labelFill: "#10233f"
      }
    })
  },
  edge: {
    type: Object,
    default: () => ({
      type: "polyline",
      style: {
        stroke: "#8ea0b8",
        endArrow: true,
        labelFill: "#52637a"
      }
    })
  }
});

const containerRef = ref(null);
let graph;
let resizeObserver;

function getReadableTextColor(fill) {
  if (typeof fill !== "string" || !fill.startsWith("#")) {
    return "#10233f";
  }

  const normalized = fill.length === 4
    ? `#${fill[1]}${fill[1]}${fill[2]}${fill[2]}${fill[3]}${fill[3]}`
    : fill;
  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#10233f" : "#ffffff";
}

function normalizeGraphData(data) {
  return {
    ...data,
    nodes: (data.nodes || []).map((node) => {
      const labelText = node.style?.labelText || node.data?.title || node.data?.name || node.data?.label || node.label || node.id;
      const fill = node.style?.fill;

      return {
        ...node,
        style: {
          ...node.style,
          labelText,
          labelFill: node.style?.labelFill || getReadableTextColor(fill)
        }
      };
    })
  };
}

function renderGraph() {
  if (!containerRef.value) {
    return;
  }

  const width = containerRef.value.clientWidth || 800;
  const height = containerRef.value.clientHeight || 480;
  const data = normalizeGraphData(props.data);

  if (!graph) {
    graph = new Graph({
      container: containerRef.value,
      width,
      height,
      data,
      node: props.node,
      edge: props.edge,
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element"]
    });
    graph.render();
    return;
  }

  graph.setSize([width, height]);
  graph.setData(data);
  graph.render();
}

onMounted(() => {
  renderGraph();
  resizeObserver = new ResizeObserver(() => {
    renderGraph();
  });
  resizeObserver.observe(containerRef.value);
});

watch(
  () => props.data,
  () => {
    renderGraph();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  graph?.destroy();
  graph = null;
});
</script>
