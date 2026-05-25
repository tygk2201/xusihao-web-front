<template>
  <div class="qa-grid">
    <section class="surface-panel qa-main">
      <div class="qa-header">
        <div>
          <h2>工程知识助手</h2>
          <p>当前报告：{{ currentDoc.name }}</p>
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
            placeholder="例如：主泵故障会产生什么连锁反应？"
            @keyup.enter="submitQuestion"
          />
          <el-button type="primary" @click="submitQuestion">发送</el-button>
        </div>
      </div>
    </section>

    <aside class="surface-panel qa-side">
      <div class="section-heading">关联图谱</div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="实体">循环水泵</el-descriptions-item>
        <el-descriptions-item label="路径">电站 / 冷却系统 / 循环水泵</el-descriptions-item>
        <el-descriptions-item label="流量">1200 m3/h</el-descriptions-item>
        <el-descriptions-item label="功率">250 kW</el-descriptions-item>
        <el-descriptions-item label="影响">故障 -> 冷却中断 -> 温度升高</el-descriptions-item>
      </el-descriptions>
    </aside>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAppState } from "../composables/useAppState";

const draftQuestion = ref("");
const { askQuestion, currentDoc, qaStarters, state } = useAppState();

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
      content: "基于当前工程报告的结构化数据，你可以直接询问设备、系统、参数或故障影响链。"
    }
  ];
}
</script>
