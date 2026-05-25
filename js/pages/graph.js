let compositionChart;
let impactChart;

function renderGraph() {
  document.getElementById("graphPage").innerHTML = `
    <div class="panel p-4 mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="secondary-btn" onclick="navigateTo('dashboard')">返回报告</button>
        <h2 class="font-semibold">系统图谱</h2>
        <button class="tab-btn active">系统构成图</button>
        <button class="tab-btn">系统影响图</button>
      </div>
      <div class="flex items-center gap-2">
        <input class="field-input" placeholder="搜索节点..." />
        <button class="secondary-btn">导出</button>
        <button class="secondary-btn">刷新</button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <section class="panel p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">系统构成图</h3>
          <span class="text-sm text-slate-500">Tree</span>
        </div>
        <div id="compositionGraph" class="graph-box"></div>
      </section>
      <section class="panel p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 id="impactTitle" class="font-semibold">循环水泵的影响关系</h3>
          <span class="text-sm text-slate-500">Force</span>
        </div>
        <div id="impactGraph" class="graph-box"></div>
      </section>
    </div>
  `;
  setTimeout(drawGraphs, 0);
}

function drawGraphs() {
  compositionChart = echarts.init(document.getElementById("compositionGraph"));
  impactChart = echarts.init(document.getElementById("impactGraph"));

  compositionChart.setOption({
    tooltip: { trigger: "item" },
    series: [{
      type: "tree",
      data: [hierarchyToTreeData(AppState.parseResult.hierarchy)],
      top: "5%",
      left: "10%",
      bottom: "5%",
      right: "20%",
      symbolSize: 14,
      orient: "LR",
      label: { position: "left", verticalAlign: "middle", align: "right" },
      leaves: { label: { position: "right", verticalAlign: "middle", align: "left" } },
      emphasis: { focus: "descendant" },
      expandAndCollapse: true,
      animationDuration: 400
    }]
  });

  const graph = impactToGraphData(AppState.parseResult.relations);
  impactChart.setOption({
    tooltip: {},
    legend: [{ data: ["Condition", "Event", "Measure"] }],
    series: [{
      type: "graph",
      layout: "force",
      roam: true,
      data: graph.nodes,
      links: graph.links,
      categories: [
        { name: "Condition" },
        { name: "Event" },
        { name: "Measure" }
      ],
      label: { show: true },
      edgeSymbol: ["none", "arrow"],
      edgeLabel: { show: true, fontSize: 12 },
      force: { repulsion: 220, edgeLength: 120 }
    }]
  });

  compositionChart.on("click", (params) => {
    document.getElementById("impactTitle").textContent = `${params.name} 的影响关系`;
    showToast(`已选中节点：${params.name}`, "info");
  });
}
