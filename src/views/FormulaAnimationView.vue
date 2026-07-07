<template>
  <div class="page-stack formula-page">
    <section class="surface-panel formula-toolbar">
      <div class="formula-toolbar__main">
        <div>
          <h2>公式曲线动画</h2>
          <p>输入关于 x 的函数，播放时会按横轴方向逐步描出曲线。</p>
        </div>
        <el-tag type="primary" effect="plain">{{ normalizedFormula }}</el-tag>
      </div>

      <div class="formula-input-row">
        <el-input
          v-model="formulaText"
          size="large"
          placeholder="例如：sin(x)、cos(x)、x^2、sqrt(abs(x))"
          @keyup.enter="replayAnimation"
        >
          <template #prepend>y =</template>
        </el-input>
        <el-button type="primary" size="large" @click="replayAnimation">生成动画</el-button>
      </div>

      <div class="formula-examples">
        <el-button
          v-for="item in examples"
          :key="item.label"
          @click="useExample(item.value)"
        >
          {{ item.label }}
        </el-button>
      </div>
    </section>

    <div class="formula-grid">
      <section class="surface-panel formula-canvas-panel">
        <div class="section-heading section-heading--inline">
          <span>曲线绘制</span>
          <el-tag :type="errorMessage ? 'danger' : 'success'">
            {{ errorMessage ? "公式有误" : isPlaying ? "绘制中" : "就绪" }}
          </el-tag>
        </div>

        <div ref="canvasWrapRef" class="formula-canvas-wrap">
          <canvas ref="canvasRef" class="formula-canvas"></canvas>
        </div>

        <el-alert
          v-if="errorMessage"
          class="formula-error"
          :title="errorMessage"
          type="error"
          :closable="false"
        />
      </section>

      <aside class="surface-panel formula-side">
        <div class="section-heading">动画控制</div>

        <div class="formula-control-buttons">
          <el-button type="primary" @click="togglePlayback">
            {{ isPlaying ? "暂停" : progress > 0 && progress < 1 ? "继续" : "播放" }}
          </el-button>
          <el-button @click="replayAnimation">重播</el-button>
          <el-button @click="resetView">重置视图</el-button>
        </div>

        <div class="formula-field">
          <span>动画进度</span>
          <el-progress :percentage="Math.round(progress * 100)" />
        </div>

        <div class="formula-field">
          <span>播放速度</span>
          <el-slider v-model="speed" :min="0.5" :max="3" :step="0.25" show-input />
        </div>

        <div class="formula-range-grid">
          <div class="formula-field">
            <span>x 最小值</span>
            <el-input-number v-model="xMin" :step="1" />
          </div>
          <div class="formula-field">
            <span>x 最大值</span>
            <el-input-number v-model="xMax" :step="1" />
          </div>
          <div class="formula-field">
            <span>y 最小值</span>
            <el-input-number v-model="yMin" :step="1" />
          </div>
          <div class="formula-field">
            <span>y 最大值</span>
            <el-input-number v-model="yMax" :step="1" />
          </div>
        </div>

        <el-divider />

        <div class="formula-note">
          <div class="formula-note__title">支持写法</div>
          <div>常用函数：sin、cos、tan、sqrt、abs、log、ln、exp、pow</div>
          <div>常量：pi、e。乘法需要写成 <strong>2*x</strong>，幂可以写 <strong>x^2</strong>。</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";

const formulaText = ref("sin(x)");
const compiledFunction = ref(null);
const errorMessage = ref("");
const canvasRef = ref(null);
const canvasWrapRef = ref(null);
const progress = ref(0);
const isPlaying = ref(false);
const speed = ref(1);
const xMin = ref(-7);
const xMax = ref(7);
const yMin = ref(-2);
const yMax = ref(2);

const examples = [
  { label: "正弦函数", value: "sin(x)" },
  { label: "余弦函数", value: "cos(x)" },
  { label: "抛物线", value: "x^2" },
  { label: "阻尼波", value: "exp(-0.15*x)*sin(3*x)" },
  { label: "心跳波", value: "sin(x)+0.35*sin(3*x)" }
];

let frameId = 0;
let resizeObserver;
let animationStart = 0;

const normalizedFormula = computed(() => `y = ${formulaText.value.trim() || "?"}`);
const duration = computed(() => 3200 / speed.value);

function compileFormula(rawFormula) {
  const names = {
    sin: "Math.sin",
    cos: "Math.cos",
    tan: "Math.tan",
    asin: "Math.asin",
    acos: "Math.acos",
    atan: "Math.atan",
    sqrt: "Math.sqrt",
    abs: "Math.abs",
    log: "Math.log10",
    ln: "Math.log",
    exp: "Math.exp",
    pow: "Math.pow",
    min: "Math.min",
    max: "Math.max",
    floor: "Math.floor",
    ceil: "Math.ceil",
    round: "Math.round",
    sign: "Math.sign",
    pi: "Math.PI",
    e: "Math.E"
  };

  const source = rawFormula
    .trim()
    .toLowerCase()
    .replaceAll("π", "pi")
    .replace(/\^/g, "**");

  if (!source) {
    throw new Error("请输入一个关于 x 的公式。");
  }

  if (!/^[0-9a-zx+\-*/().,\s*]+$/.test(source)) {
    throw new Error("公式里包含暂不支持的字符。");
  }

  const compiled = source.replace(/\b[a-z]+\b/g, (name) => {
    if (name === "x") {
      return "x";
    }
    if (names[name]) {
      return names[name];
    }
    throw new Error(`暂不支持 ${name}，请使用 sin、cos、sqrt、abs 等常用函数。`);
  });

  if (compiled.includes("__") || compiled.includes("constructor")) {
    throw new Error("公式里包含不安全的内容。");
  }

  const fn = new Function(
    "x",
    `"use strict";
    const y = ${compiled};
    return Number.isFinite(y) ? y : NaN;`
  );

  const testValue = fn(0.5);
  if (Number.isNaN(testValue)) {
    throw new Error("公式在测试点无法得到有效数值，请检查定义域。");
  }

  return fn;
}

function buildPoints(fn) {
  const total = 960;
  const points = [];
  const left = Number(xMin.value);
  const right = Number(xMax.value);

  for (let index = 0; index <= total; index += 1) {
    const x = left + ((right - left) * index) / total;
    const y = fn(x);
    points.push({ x, y, valid: Number.isFinite(y) && Math.abs(y) < 100000 });
  }

  return points;
}

function getCanvasMetrics() {
  const canvas = canvasRef.value;
  const wrap = canvasWrapRef.value;
  if (!canvas || !wrap) {
    return null;
  }

  const ratio = window.devicePixelRatio || 1;
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return { ctx, width, height };
}

function projectX(x, width, padding) {
  return padding + ((x - xMin.value) / (xMax.value - xMin.value)) * (width - padding * 2);
}

function projectY(y, height, padding) {
  return height - padding - ((y - yMin.value) / (yMax.value - yMin.value)) * (height - padding * 2);
}

function drawGrid(ctx, width, height, padding) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e0e8f3";
  ctx.lineWidth = 1;
  ctx.font = "12px Segoe UI, PingFang SC, sans-serif";
  ctx.fillStyle = "#6b7c92";

  for (let index = 0; index <= 10; index += 1) {
    const x = padding + ((width - padding * 2) * index) / 10;
    const y = padding + ((height - padding * 2) * index) / 10;

    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const zeroX = projectX(0, width, padding);
  const zeroY = projectY(0, height, padding);

  ctx.strokeStyle = "#91a4bd";
  ctx.lineWidth = 1.4;

  if (zeroX >= padding && zeroX <= width - padding) {
    ctx.beginPath();
    ctx.moveTo(zeroX, padding);
    ctx.lineTo(zeroX, height - padding);
    ctx.stroke();
    ctx.fillText("y", zeroX + 8, padding + 14);
  }

  if (zeroY >= padding && zeroY <= height - padding) {
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
    ctx.fillText("x", width - padding - 12, zeroY - 8);
  }

  ctx.fillText(String(xMin.value), padding, height - 18);
  ctx.fillText(String(xMax.value), width - padding - 24, height - 18);
  ctx.fillText(String(yMax.value), 18, padding + 4);
  ctx.fillText(String(yMin.value), 18, height - padding);
}

function drawScene() {
  const metrics = getCanvasMetrics();
  if (!metrics) {
    return;
  }

  const { ctx, width, height } = metrics;
  const padding = 48;
  drawGrid(ctx, width, height, padding);

  if (!compiledFunction.value || xMax.value <= xMin.value || yMax.value <= yMin.value) {
    return;
  }

  const points = buildPoints(compiledFunction.value);
  const revealCount = Math.max(2, Math.floor(points.length * progress.value));

  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2160ff";
  ctx.shadowColor = "rgba(33, 96, 255, 0.26)";
  ctx.shadowBlur = 10;

  let drawing = false;
  ctx.beginPath();
  points.slice(0, revealCount).forEach((point) => {
    if (!point.valid) {
      drawing = false;
      return;
    }

    const px = projectX(point.x, width, padding);
    const py = projectY(point.y, height, padding);

    if (!drawing) {
      ctx.moveTo(px, py);
      drawing = true;
    } else {
      ctx.lineTo(px, py);
    }
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  const visiblePoints = points.slice(0, revealCount).filter((point) => point.valid);
  const head = visiblePoints.at(-1);
  if (head) {
    const px = projectX(head.x, width, padding);
    const py = projectY(head.y, height, padding);
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick(now) {
  const nextProgress = Math.min(1, (now - animationStart) / duration.value);
  progress.value = nextProgress;
  drawScene();

  if (nextProgress < 1 && isPlaying.value) {
    frameId = requestAnimationFrame(tick);
  } else {
    isPlaying.value = false;
  }
}

function startAnimation(fromStart = false) {
  cancelAnimationFrame(frameId);
  if (fromStart) {
    progress.value = 0;
  }
  isPlaying.value = true;
  animationStart = performance.now() - progress.value * duration.value;
  frameId = requestAnimationFrame(tick);
}

function updateFormula(showMessage = true) {
  try {
    compiledFunction.value = compileFormula(formulaText.value);
    errorMessage.value = "";
    if (showMessage) {
      ElMessage.success("公式已生成，开始绘制曲线。");
    }
    return true;
  } catch (error) {
    compiledFunction.value = null;
    errorMessage.value = error.message;
    isPlaying.value = false;
    progress.value = 0;
    drawScene();
    return false;
  }
}

function replayAnimation() {
  if (updateFormula()) {
    startAnimation(true);
  }
}

function togglePlayback() {
  if (isPlaying.value) {
    isPlaying.value = false;
    cancelAnimationFrame(frameId);
    drawScene();
    return;
  }

  if (!compiledFunction.value && !updateFormula(false)) {
    return;
  }

  if (progress.value >= 1) {
    progress.value = 0;
  }
  startAnimation(false);
}

function useExample(value) {
  formulaText.value = value;
  replayAnimation();
}

function resetView() {
  xMin.value = -7;
  xMax.value = 7;
  yMin.value = -2;
  yMax.value = 2;
  speed.value = 1;
  nextTick(() => {
    drawScene();
  });
}

watch([xMin, xMax, yMin, yMax], () => {
  drawScene();
});

watch(speed, () => {
  if (isPlaying.value) {
    startAnimation(false);
  }
});

onMounted(() => {
  nextTick(() => {
    updateFormula(false);
    progress.value = 1;
    drawScene();

    resizeObserver = new ResizeObserver(() => {
      drawScene();
    });
    resizeObserver.observe(canvasWrapRef.value);
  });
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.formula-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.formula-toolbar__main,
.formula-input-row,
.formula-examples,
.formula-control-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.formula-toolbar__main {
  justify-content: space-between;
}

.formula-toolbar h2 {
  margin: 0;
  font-size: 22px;
}

.formula-toolbar p {
  margin: 8px 0 0;
  color: var(--text-soft);
}

.formula-input-row {
  align-items: stretch;
}

.formula-input-row .el-input {
  flex: 1;
}

.formula-examples {
  flex-wrap: wrap;
}

.formula-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
}

.formula-canvas-panel {
  min-height: 660px;
}

.formula-canvas-wrap {
  height: 560px;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: 18px;
  background: #f8fbff;
}

.formula-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.formula-error {
  margin-top: 14px;
}

.formula-side {
  min-height: 660px;
}

.formula-control-buttons {
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.formula-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
}

.formula-range-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.formula-range-grid .el-input-number {
  width: 100%;
}

.formula-note {
  display: grid;
  gap: 10px;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.7;
}

.formula-note__title {
  color: var(--text-main);
  font-size: 15px;
  font-weight: 700;
}

@media (max-width: 1280px) {
  .formula-grid {
    grid-template-columns: 1fr;
  }

  .formula-side,
  .formula-canvas-panel {
    min-height: auto;
  }
}

@media (max-width: 900px) {
  .formula-toolbar__main,
  .formula-input-row {
    align-items: stretch;
    flex-direction: column;
  }

  .formula-canvas-wrap {
    height: 420px;
  }

  .formula-range-grid {
    grid-template-columns: 1fr;
  }
}
</style>
