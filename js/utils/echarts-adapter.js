const TYPE_COLORS = {
  System: "#1e40af",
  Equipment: "#2563eb",
  Component: "#60a5fa",
  Condition: "#ea580c",
  Event: "#dc2626",
  Measure: "#16a34a"
};

const EDGE_COLORS = {
  导致: "#ef4444",
  触发: "#f59e0b",
  抑制: "#16a34a",
  影响: "#8b5cf6"
};

function hierarchyToTreeData(node) {
  return {
    name: node.name,
    value: node.type,
    itemStyle: {
      color: TYPE_COLORS[node.type] || "#2563eb"
    },
    label: {
      color: "#0f172a",
      fontWeight: 700
    },
    children: (node.children || []).map(hierarchyToTreeData),
    _id: node.id,
    _type: node.type,
    _parameters: node.parameters || []
  };
}

function impactToGraphData(relations) {
  const nodes = new Map();
  const links = [];

  relations.filter((item) => item.type === "impact").forEach((rel) => {
    if (!nodes.has(rel.source)) {
      nodes.set(rel.source, {
        id: rel.source,
        name: rel.sourceName,
        symbolSize: 48,
        category: rel.sourceType,
        itemStyle: { color: TYPE_COLORS[rel.sourceType] || "#2563eb" }
      });
    }
    if (!nodes.has(rel.target)) {
      nodes.set(rel.target, {
        id: rel.target,
        name: rel.targetName,
        symbolSize: 48,
        category: rel.targetType,
        itemStyle: { color: TYPE_COLORS[rel.targetType] || "#2563eb" }
      });
    }
    links.push({
      source: rel.source,
      target: rel.target,
      label: { show: true, formatter: rel.label },
      lineStyle: {
        width: 2,
        color: EDGE_COLORS[rel.label] || "#64748b",
        type: rel.label === "触发" ? "dashed" : "solid"
      }
    });
  });

  return { nodes: Array.from(nodes.values()), links };
}
