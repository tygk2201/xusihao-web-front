const pageMeta = {
  dashboard: ["工程报告库", "工程报告库 / Dashboard"],
  parsing: ["报告解析", `工程报告库 / ${AppState.currentDoc.name} / 报告解析`],
  graph: ["系统图谱", `工程报告库 / ${AppState.currentDoc.name} / 系统图谱`],
  qa: ["工程问答", `工程报告库 / ${AppState.currentDoc.name} / 工程问答`]
};

function navigateTo(page) {
  AppState.currentPage = page;
  document.querySelectorAll(".page-view").forEach((view) => view.classList.add("hidden"));
  document.getElementById(`${page}Page`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === page);
  });
  document.getElementById("pageTitle").textContent = pageMeta[page][0];
  document.getElementById("breadcrumb").textContent = pageMeta[page][1];

  if (page === "dashboard") renderDashboard();
  if (page === "parsing") renderParsing();
  if (page === "graph") renderGraph();
  if (page === "qa") renderQa();
}

function bindGlobalEvents() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => navigateTo(item.dataset.page));
  });
  document.getElementById("openUploadBtn").addEventListener("click", openUploadModal);
  document.getElementById("openConfigBtn").addEventListener("click", openConfigModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      showToast("结构化数据已保存", "success");
    }
  });
}

bindGlobalEvents();
navigateTo("dashboard");
