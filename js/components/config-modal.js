function openConfigModal() {
  const root = document.getElementById("modalRoot");
  root.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold">API 配置</h2>
          <button class="icon-btn" data-close-modal><span class="iconify" data-icon="lucide:x"></span></button>
        </div>
        <div class="p-5 space-y-4">
          <label class="block">
            <span class="text-sm font-medium">SiliconFlow API Key</span>
            <input class="field-input w-full mt-2" placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">模型选择</span>
            <select class="field-select w-full mt-2">
              <option>DeepSeek-V3</option>
              <option>Qwen3</option>
              <option>GLM-4</option>
            </select>
          </label>
          <div class="rounded-lg bg-emerald-50 text-emerald-700 p-3 text-sm">当前为本地练习配置，尚未连接真实模型。</div>
        </div>
        <div class="p-5 border-t border-slate-200 flex justify-end gap-3">
          <button class="secondary-btn" data-close-modal>取消</button>
          <button class="primary-btn" id="saveConfigBtn">保存配置</button>
        </div>
      </div>
    </div>
  `;
  root.querySelectorAll("[data-close-modal]").forEach((node) => node.addEventListener("click", closeModal));
  document.getElementById("saveConfigBtn").addEventListener("click", () => {
    closeModal();
    showToast("API 配置已保存到当前页面内存", "success");
  });
}
