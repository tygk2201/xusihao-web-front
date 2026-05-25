<template>
  <div class="page-stack">
    <div class="parsing-grid">
      <section class="surface-panel parsing-pane">
        <div class="section-heading">
          <span>章节 / 系统导航</span>
          <el-input v-model="treeKeyword" placeholder="搜索章节 / 系统" clearable />
        </div>
        <el-tree
          :data="treeData"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          class="doc-tree"
        >
          <template #default="{ data }">
            <div class="doc-tree__node">
              <span>{{ data.label }}</span>
              <el-tag v-if="data.status" size="small" :type="data.statusType">{{ data.status }}</el-tag>
            </div>
          </template>
        </el-tree>
      </section>

      <section class="surface-panel parsing-pane">
        <div class="section-heading section-heading--inline">
          <span>原文预览</span>
          <div class="zoom-actions">
            <el-button text>-</el-button>
            <el-button>100%</el-button>
            <el-button text>+</el-button>
          </div>
        </div>
        <article class="document-preview">
          <h3>第 5.2 节 循环水泵故障分析</h3>
          <p>
            本报告识别出 <mark class="mark-equipment">循环水泵</mark> 是冷却系统的核心设备，
            额定流量为 <mark class="mark-parameter">1200 m3/h</mark>，额定功率为
            <mark class="mark-parameter">250 kW</mark>。
          </p>
          <p>
            当 <mark class="mark-equipment">轴承</mark> 出现磨损时，可能导致转子失衡，并进一步触发振动超标和报警装置启动。
          </p>
          <el-alert
            type="info"
            :closable="false"
            title="BOM 表 T-101：循环水泵包含叶轮、轴承、密封件等关键部件。"
          />
        </article>
      </section>

      <section class="surface-panel parsing-pane">
        <el-tabs v-model="activeTab" stretch>
          <el-tab-pane label="系统层级" name="hierarchy">
            <div class="hierarchy-list">
              <div v-for="item in hierarchyRows" :key="item.id" class="hierarchy-row" :style="{ paddingLeft: `${item.level * 20}px` }">
                <span>{{ item.icon }} {{ item.name }}</span>
                <el-button text type="primary">编辑</el-button>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="参数表" name="params">
            <el-table :data="parameters" size="small">
              <el-table-column prop="equipmentName" label="设备" />
              <el-table-column prop="paramName" label="参数" />
              <el-table-column prop="value" label="数值" />
              <el-table-column prop="unit" label="单位" />
              <el-table-column prop="source" label="来源" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="关系编辑" name="relations">
            <div class="relation-list">
              <div v-for="item in relations" :key="item.id" class="relation-row">
                <span class="relation-main">{{ item.sourceName }}</span>
                <span class="relation-arrow">{{ item.label }}</span>
                <span class="relation-main">{{ item.targetName }}</span>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="原始解析" name="raw">
            <pre class="raw-panel">{{ rawJson }}</pre>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <section class="surface-panel parsing-summary">
      解析完成 | 系统: 5 | 设备: 23 | 部件: 41 | 参数: 87 | 关系: 56 | 最后保存: 2026-05-21 14:30
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useAppState } from "../composables/useAppState";

const treeKeyword = ref("");
const activeTab = ref("hierarchy");
const { hierarchy, parameters, relations } = useAppState();

const treeData = computed(() => [
  { id: "1", label: "第 1 章 项目概述" },
  { id: "1-1", label: "1.1 工程背景" },
  { id: "1-2", label: "1.2 设计依据" },
  { id: "2", label: "第 2 章 系统总体设计" },
  { id: "2-1", label: "2.1 供电系统", status: "已解析", statusType: "success" },
  { id: "2-2", label: "2.2 冷却系统", status: "已解析", statusType: "success" },
  { id: "2-3", label: "2.3 控制系统", status: "解析中", statusType: "warning" },
  { id: "3", label: "系统分类视图" },
  { id: "3-1", label: "联合循环电站" },
  { id: "3-2", label: "供电系统" },
  { id: "3-3", label: "冷却系统" },
  { id: "3-4", label: "循环水泵" }
].filter((item) => item.label.includes(treeKeyword.value.trim())));

function flattenHierarchy(node, level = 0) {
  const iconMap = {
    System: "◈",
    Equipment: "▣",
    Component: "•"
  };

  return [
    { id: node.id, name: node.name, level, icon: iconMap[node.type] || "•" },
    ...(node.children || []).flatMap((child) => flattenHierarchy(child, level + 1))
  ];
}

const hierarchyRows = computed(() => flattenHierarchy(hierarchy));
const rawJson = computed(() =>
  JSON.stringify(
    {
      hierarchy,
      parameters,
      relations
    },
    null,
    2
  )
);
</script>
