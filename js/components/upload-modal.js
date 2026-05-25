function openUploadModal() {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传工程技术报告</h2>
          <button class="icon-btn" data-close-modal><span class="iconify" data-icon="lucide:x"></span></button>
        </div>
        <div class="p-5 space-y-5">
          <label class="block border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 p-8 text-center cursor-pointer">
            <span class="iconify mx-auto text-4xl text-blue-500" data-icon="lucide:file-up"></span>
            <div class="mt-3 font-medium">将文件拖拽到此处，或点击选择</div>
            <div class="mt-1 text-sm text-slate-500">支持 PDF / Word，最大 100MB</div>
            <input id="reportFileInput" class="hidden" type="file" accept=".pdf,.doc,.docx" />
          </label>
          <div>
            <div class="text-sm font-medium mb-2">报告类型</div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <label><input type="radio" name="reportType" checked /> 故障分析报告</label>
              <label><input type="radio" name="reportType" /> 设计报告</label>
              <label><input type="radio" name="reportType" /> 设备手册</label>
              <label><input type="radio" name="reportType" /> 其他</label>
            </div>
          </div>
          <div>
            <div class="text-sm font-medium mb-2">解析选项</div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <label><input type="checkbox" checked /> 提取系统层级结构</label>
              <label><input type="checkbox" checked /> 提取设备参数表</label>
              <label><input type="checkbox" checked /> 识别工程图纸实体</label>
              <label><input type="checkbox" checked /> 构建影响关系图谱</label>
            </div>
          </div>
          <div id="uploadProgress" class="hidden">
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full w-2/3 bg-blue-600"></div>
            </div>
            <div class="mt-2 text-sm text-slate-500">当前阶段：识别工程图纸中的设备与连接关系...</div>
          </div>
        </div>
        <div class="p-5 border-t border-slate-200 flex justify-end gap-3">
          <button class="secondary-btn" data-close-modal>取消</button>
          <button id="startUploadBtn" class="primary-btn">开始上传并解析</button>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll("[data-close-modal]").forEach((node) => {
    node.addEventListener("click", closeModal);
  });
  document.getElementById("startUploadBtn").addEventListener("click", () => {
    document.getElementById("uploadProgress").classList.remove("hidden");
    showToast("已开始解析，后端当前使用 Mock 数据", "info");
  });
}

function closeModal() {
  document.getElementById("modalRoot").innerHTML = "";
}
