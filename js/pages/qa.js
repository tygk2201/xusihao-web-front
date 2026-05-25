function renderQa() {
  document.getElementById("qaPage").innerHTML = `
    <div class="grid grid-cols-[1fr_360px] gap-4 min-h-[calc(100vh-136px)]">
      <section class="panel flex flex-col overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 class="font-semibold">工程知识助手</h2>
            <div class="text-sm text-slate-500">当前报告：${AppState.currentDoc.name}</div>
          </div>
          <button class="secondary-btn">新对话</button>
        </div>
        <div id="qaMessages" class="flex-1 overflow-auto p-5 space-y-4">
          ${renderWelcomeQuestions()}
        </div>
        <div class="p-4 border-t border-slate-200">
          <div class="flex gap-2 mb-3">
            <button class="secondary-btn">@设备</button>
            <button class="secondary-btn">@系统</button>
            <button class="secondary-btn">@参数</button>
          </div>
          <div class="flex gap-2">
            <input id="qaInput" class="field-input flex-1" placeholder="主泵故障会产生什么连锁反应？" />
            <button id="sendQaBtn" class="primary-btn">发送</button>
          </div>
        </div>
      </section>

      <aside class="panel p-4">
        <h3 class="font-semibold mb-3">关联图谱</h3>
        <div class="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm">
          <div class="font-medium">实体详情：循环水泵</div>
          <div class="mt-3 text-slate-600 space-y-2">
            <div>路径：电站 > 冷却系统 > 循环水泵</div>
            <div>流量：1200 m³/h</div>
            <div>功率：250 kW</div>
            <div>影响：故障 → 冷却中断 → 温度升高</div>
          </div>
        </div>
      </aside>
    </div>
  `;
  document.getElementById("sendQaBtn").addEventListener("click", sendQuestion);
}

function renderWelcomeQuestions() {
  const questions = [
    "如果主泵故障，会产生什么连锁反应？",
    "列出冷却系统的所有设备和监测参数",
    "供电系统的故障会影响哪些系统？",
    "燃气轮机的额定参数是多少？"
  ];
  return `
    <div class="text-center py-12">
      <div class="text-4xl mb-3">🤖</div>
      <h3 class="text-lg font-semibold">工程知识助手</h3>
      <p class="mt-2 text-slate-500">基于当前报告的系统图谱进行推理问答</p>
      <div class="mt-6 grid gap-2 max-w-xl mx-auto">
        ${questions.map((item) => `<button class="secondary-btn justify-start" onclick="fillQuestion('${item}')">${item}</button>`).join("")}
      </div>
    </div>
  `;
}

function fillQuestion(question) {
  document.getElementById("qaInput").value = question;
}

async function sendQuestion() {
  const input = document.getElementById("qaInput");
  const question = input.value.trim();
  if (!question) return;
  const messages = document.getElementById("qaMessages");
  messages.innerHTML = `
    <div class="ml-auto max-w-2xl rounded-lg bg-blue-600 text-white p-4">${question}</div>
    <div class="max-w-3xl rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
      <div class="font-semibold mb-2">AI 回答</div>
      <p class="text-sm leading-7">根据报告第 5.2 节及系统逻辑图，主泵故障将导致冷却流量中断，进一步引发温度升高、报警装置启动和紧急停机。</p>
      <div class="mt-3 rounded-lg bg-red-50 border border-red-100 p-3 text-sm">
        主泵故障 → 冷却流量中断 → 温度升高 → 报警装置启动 → 紧急停机
      </div>
      <details class="mt-3 text-sm">
        <summary class="cursor-pointer text-blue-700">推理过程</summary>
        <ol class="mt-2 list-decimal pl-5 text-slate-600 space-y-1">
          <li>定位对象：主泵 → 循环水泵</li>
          <li>检索层级：循环水泵 ∈ 冷却系统</li>
          <li>检索影响：冷却中断 → 温度升高</li>
          <li>生成结构化答案</li>
        </ol>
      </details>
    </div>
  `;
  input.value = "";
}
