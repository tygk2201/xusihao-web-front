<template>
  <div class="qa-grid">
    <section class="surface-panel qa-main">
      <div class="qa-header">
        <div>
          <h2>工程知识助手</h2>
          <p>当前报告：{{ currentDoc?.name || "未选择" }}</p>
        </div>
        <el-button @click="resetMessages">新对话</el-button>
      </div>

      <div class="qa-messages">
        <template v-for="message in state.qaMessages" :key="message.id">
          <div v-if="message.role === 'assistant'" class="message-row">
            <div class="message-card message-card--assistant">
              {{ message.content }}
            </div>
          </div>
          <div v-else class="message-row message-row--user">
            <div class="message-card message-card--user">
              {{ message.content }}
            </div>
          </div>
        </template>

        <div v-if="state.qaMessages.length === 1" class="starter-panel">
          <h3>可以直接这样问</h3>
          <div class="starter-list">
            <el-button
              v-for="item in qaStarters"
              :key="item"
              class="starter-item"
              @click="draftQuestion = item"
            >
              {{ item }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="qa-inputbar">
        <div class="qa-tags">
          <el-tag>@设备</el-tag>
          <el-tag type="success">@系统</el-tag>
          <el-tag type="warning">@参数</el-tag>
        </div>
        <div class="qa-form">
          <el-input
            v-model="draftQuestion"
            placeholder="例如：主设备故障会产生什么连锁影响？"
            @keyup.enter="submitQuestion"
          />
          <el-button type="primary" @click="submitQuestion">发送</el-button>
        </div>
      </div>
    </section>

    <aside class="surface-panel qa-side">
      <div class="section-heading">关联信息</div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="实体">{{ firstParameter?.equipmentName || "暂无" }}</el-descriptions-item>
        <el-descriptions-item label="参数">{{ firstParameter?.paramName || "暂无" }}</el-descriptions-item>
        <el-descriptions-item label="数值">{{ firstParameter?.value || "-" }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ firstParameter?.unit || "-" }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ firstParameter?.source || "-" }}</el-descriptions-item>
      </el-descriptions>
    </aside>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useAppState } from "../composables/useAppState.js";

const draftQuestion = ref("");
const { askQuestion, currentDoc, parameters, qaStarters, state } = useAppState();

const firstParameter = computed(() => parameters.value[0] || null);

function submitQuestion() {
  const question = draftQuestion.value.trim();
  if (!question) {
    return;
  }
  askQuestion(question);
  draftQuestion.value = "";
}

function resetMessages() {
  state.qaMessages = [
    {
      id: "welcome",
      role: "assistant",
      content: "当前问答仍为演示模式，后续将接入真实文档解析结果与知识图谱。"
    }
  ];
}
</script>
