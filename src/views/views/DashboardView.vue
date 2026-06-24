<template>
  <div class="page-stack">
    <section class="stats-grid">
      <article v-for="item in stats" :key="item.label" class="surface-card stat-card">
        <div class="stat-card__head">
          <span>{{ item.label }}</span>
          <el-tag :type="item.tagType" effect="plain">{{ item.tag }}</el-tag>
        </div>
        <div class="stat-card__value">{{ item.value }}</div>
      </article>
    </section>

    <section class="surface-panel toolbar-panel">
      <el-segmented v-model="reportFilter" :options="filterOptions" />
    </section>

    <section class="report-grid">
      <article v-for="report in filteredReports" :key="report.id" class="surface-card report-card">
        <div class="report-card__header">
          <div>
            <div class="report-card__type">{{ report.type }}</div>
            <h3 class="report-card__title">{{ report.name }}</h3>
          </div>
          <el-tag :type="statusMap[report.status]?.tone || 'info'">
            {{ statusMap[report.status]?.label || report.status }}
          </el-tag>
        </div>

        <div class="report-card__meta">上传时间：{{ report.uploadedAt }}</div>

        <dl class="report-card__stats">
          <div>
            <dt>系统 / 设备</dt>
            <dd>{{ report.systems }} / {{ report.equipments }}</dd>
          </div>
          <div>
            <dt>关系数量</dt>
            <dd>{{ report.relations }}</dd>
          </div>
          <div>
            <dt>完成度</dt>
            <dd>{{ report.completion }}%</dd>
          </div>
        </dl>

        <el-progress :percentage="report.completion" :show-text="false" />

        <div class="report-card__actions">
          <el-button @click="goGraph(report.id)">查看图谱</el-button>
          <el-button type="primary" @click="goParsing(report.id)">查看解析</el-button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppState } from "../composables/useAppState.js";

const router = useRouter();
const reportFilter = ref("全部报告");
const { reports, statusMap, selectReport } = useAppState();

const filterOptions = ["全部报告", "解析中", "已完成", "需人工复核", "解析失败"];

const stats = computed(() => [
  { label: "报告总数", value: reports.value.length, tag: "实时", tagType: "primary" },
  {
    label: "已完成报告",
    value: reports.value.filter((item) => item.status === "completed").length,
    tag: "状态",
    tagType: "success"
  },
  {
    label: "提取设备数",
    value: reports.value.reduce((sum, item) => sum + (item.equipments || 0), 0),
    tag: "设备",
    tagType: "warning"
  },
  {
    label: "图谱关系数",
    value: reports.value.reduce((sum, item) => sum + (item.relations || 0), 0),
    tag: "关系",
    tagType: "info"
  }
]);

const filteredReports = computed(() => {
  if (reportFilter.value === "全部报告") {
    return reports.value;
  }

  const map = {
    解析中: "processing",
    已完成: "completed",
    需人工复核: "needReview",
    解析失败: "failed"
  };

  return reports.value.filter((item) => item.status === map[reportFilter.value]);
});

async function openReport(reportId, routeName) {
  await selectReport(reportId);
  router.push({ name: routeName });
}

function goGraph(reportId) {
  openReport(reportId, "graph");
}

function goParsing(reportId) {
  openReport(reportId, "parsing");
}
</script>
