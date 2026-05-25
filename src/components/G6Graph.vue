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

function renderGraph() {
  if (!containerRef.value) {
    return;
  }

  const width = containerRef.value.clientWidth || 800;
  const height = containerRef.value.clientHeight || 480;

  if (!graph) {
    graph = new Graph({
      container: containerRef.value,
      width,
      height,
      data: props.data,
      node: props.node,
      edge: props.edge,
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element"]
    });
    graph.render();
    return;
  }

  graph.setSize([width, height]);
  graph.setData(props.data);
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
