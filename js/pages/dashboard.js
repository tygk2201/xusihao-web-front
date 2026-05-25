function renderDashboard() {
  const stats = [
    ["总报告数", MockData.reports.length, "lucide:file-archive"],
    ["已解析系统数", 11, "lucide:git-branch"],
    ["已提取设备", 97, "lucide:cpu"],
    ["图谱节点总数", 186, "lucide:share-2"]
  ];

  document.getElementById("dashboardPage").innerHTML = `
    <div class="grid grid-cols-4 gap-4 mb-5">
      ${stats.map(([label, value, icon]) => `
        <article class="stat-card p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">${label}</span>
            <span class="iconify text-xl text-blue-600" data-icon="${icon}"></span>
          </div>
          <div class="mt-4 text-3xl font-bold">${value}</div>
        </article>
      `).join("")}
    </div>

    <div class="panel p-4 mb-5 flex items-center gap-2">
      ${["全部报告", "解析中", "已完成", "需人工修正", "解析异常"].map((item, index) => `
        <button class="tab-btn ${index === 0 ? "active" : ""}">${item}</button>
      `).join("")}
    </div>

    <div class="grid grid-cols-3 gap-4">
      ${MockData.reports.map((report) => reportCard(report)).join("")}
    </div>
  `;
}

function reportCard(report) {
  const statusText = {
    completed: "已完成",
    processing: "解析中",
    need_review: "需人工修正",
    error: "解析异常"
  }[report.status];

  return `
    <article class="report-card p-5 hover:shadow-xl transition-all">
      <div class="flex items-start justify-between gap-3">
        <span class="iconify text-3xl text-blue-600" data-icon="lucide:file-text"></span>
        <span class="status-pill status-${report.status}">${statusText}</span>
      </div>
      <h3 class="mt-4 font-semibold leading-snug">《${report.name}》</h3>
      <p class="mt-2 text-sm text-slate-500">上传于：${report.uploadedAt}</p>
      <div class="mt-4 space-y-2 text-sm text-slate-600">
        <div>已提取：${report.systems} 系统 / ${report.equipments} 设备</div>
        <div>关系：${report.relations} 条</div>
        <div>完成度：${report.completion}%</div>
      </div>
      <div class="mt-5 flex gap-2">
        <button class="secondary-btn" onclick="navigateTo('graph')">查看图谱</button>
        <button class="primary-btn" onclick="navigateTo('parsing')">继续编辑</button>
      </div>
    </article>
  `;
}
