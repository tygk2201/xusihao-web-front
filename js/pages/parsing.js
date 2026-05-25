function renderParsing() {
  document.getElementById("parsingPage").innerHTML = `
    <div class="grid grid-cols-[280px_1fr_420px] gap-4 min-h-[calc(100vh-136px)]">
      <aside class="panel p-4 overflow-auto">
        <div class="font-semibold mb-3">章节 / 系统导航</div>
        <input class="field-input w-full mb-4" placeholder="搜索章节/系统..." />
        ${renderChapterTree()}
      </aside>

      <section class="panel p-5 overflow-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold">原文预览</h2>
          <div class="flex gap-2">
            <button class="secondary-btn">-</button>
            <button class="secondary-btn">100%</button>
            <button class="secondary-btn">+</button>
          </div>
        </div>
        <article class="prose max-w-none text-sm leading-8">
          <h3>第 5.2 节 冷却系统故障分析</h3>
          <p>
            本报告识别出 <span class="annotation-equipment" data-entity="equ-pump">循环水泵</span>
            是冷却系统的核心设备，额定流量为
            <span class="annotation-parameter" data-param="3">1200 m³/h</span>，
            额定功率为 <span class="annotation-parameter" data-param="4">250 kW</span>。
          </p>
          <p>
            当 <span class="annotation-equipment" data-entity="comp-bearing">轴承</span>
            出现磨损时，可能导致转子失衡，并进一步触发振动超标和报警装置启动。
          </p>
          <div class="my-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            BOM 表 T-101：循环水泵包含叶轮、轴承、密封件等关键部件。
          </div>
        </article>
      </section>

      <aside class="panel p-4 overflow-auto">
        <div class="flex gap-1 mb-4" id="parserTabs">
          ${["系统层级", "参数表", "关系编辑", "原始解析"].map((tab, index) => `
            <button class="tab-btn ${index === 0 ? "active" : ""}" data-parser-tab="${index}">${tab}</button>
          `).join("")}
        </div>
        <div id="parserPanel"></div>
      </aside>
    </div>
    <div class="panel mt-4 p-3 text-sm text-slate-600">
      解析完成 | 系统: 5 | 设备: 23 | 部件: 41 | 参数: 87 | 关系: 56 | 最后保存: 2026-05-21 14:30
    </div>
  `;

  bindParserTabs();
  renderParserPanel(0);
}

function renderChapterTree() {
  return `
    <div class="space-y-3 text-sm">
      <div class="font-medium">▼ 第1章 项目概述</div>
      <div class="pl-4 text-slate-500">1.1 工程背景</div>
      <div class="pl-4 text-slate-500">1.2 设计依据</div>
      <div class="font-medium">▼ 第2章 系统总体设计</div>
      <button class="block pl-4 text-blue-700">2.1 供电系统 <span class="status-pill status-completed">已解析</span></button>
      <button class="block pl-4 text-blue-700">2.2 冷却系统 <span class="status-pill status-completed">已解析</span></button>
      <div class="pl-4 text-slate-500">2.3 控制系统 <span class="status-pill status-processing">解析中</span></div>
      <div class="font-medium">▼ 系统分类视图</div>
      <div class="pl-4">🏭 联合循环电站</div>
      <div class="pl-8">⚡ 供电系统</div>
      <div class="pl-8">❄️ 冷却系统</div>
      <div class="pl-12 text-blue-700">🌊 循环水泵</div>
    </div>
  `;
}

function bindParserTabs() {
  document.querySelectorAll("[data-parser-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-parser-tab]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderParserPanel(Number(button.dataset.parserTab));
    });
  });
}

function renderParserPanel(index) {
  const panel = document.getElementById("parserPanel");
  if (index === 0) panel.innerHTML = renderHierarchyEditor(AppState.parseResult.hierarchy);
  if (index === 1) panel.innerHTML = renderParamTable();
  if (index === 2) panel.innerHTML = renderRelationEditor();
  if (index === 3) panel.innerHTML = `<pre class="text-xs bg-slate-950 text-slate-100 rounded-lg p-4 overflow-auto">${JSON.stringify(AppState.parseResult.rawParse, null, 2)}</pre>`;
}

function renderHierarchyEditor(node, level = 0) {
  return `
    <div class="text-sm">
      <div class="flex items-center gap-2 py-1" style="padding-left:${level * 16}px">
        <span>${node.type === "System" ? "🏭" : node.type === "Equipment" ? "🔧" : "⚙️"}</span>
        <span class="font-medium">${node.name}</span>
        <button class="ghost-btn ml-auto">编辑</button>
      </div>
      ${(node.children || []).map((child) => renderHierarchyEditor(child, level + 1)).join("")}
    </div>
  `;
}

function renderParamTable() {
  return `
    <div class="flex justify-between mb-3">
      <button class="secondary-btn">添加参数</button>
      <button class="secondary-btn">导出 CSV</button>
    </div>
    <table class="w-full text-sm">
      <thead class="text-left text-slate-500">
        <tr><th class="py-2">设备</th><th>参数</th><th>值</th><th>单位</th></tr>
      </thead>
      <tbody>
        ${AppState.parseResult.parameters.map((item) => `
          <tr class="border-t border-slate-100">
            <td class="py-2">${item.equipmentName}</td>
            <td>${item.paramName}</td>
            <td>${item.value}</td>
            <td>${item.unit}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderRelationEditor() {
  return `
    <div class="space-y-3 text-sm">
      ${AppState.parseResult.relations.map((item) => `
        <div class="rounded-lg border border-slate-200 p-3 flex items-center gap-2">
          <span class="font-medium">${item.sourceName}</span>
          <span class="text-slate-400">──${item.label}──▶</span>
          <span class="font-medium">${item.targetName}</span>
        </div>
      `).join("")}
    </div>
  `;
}
