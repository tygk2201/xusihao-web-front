import { createRouter, createWebHashHistory } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import DashboardView from "../views/DashboardView.vue";
import ParsingView from "../views/ParsingView.vue";
import GraphView from "../views/GraphView.vue";
import QaView from "../views/QaView.vue";

const routes = [
  {
    path: "/",
    component: AppLayout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardView,
        meta: {
          title: "工程报告",
          menuLabel: "工程报告",
          icon: "Files"
        }
      },
      {
        path: "parsing",
        name: "parsing",
        component: ParsingView,
        meta: {
          title: "报告解析",
          menuLabel: "报告解析",
          icon: "Memo"
        }
      },
      {
        path: "graph",
        name: "graph",
        component: GraphView,
        meta: {
          title: "系统图谱",
          menuLabel: "系统图谱",
          icon: "Share"
        }
      },
      {
        path: "qa",
        name: "qa",
        component: QaView,
        meta: {
          title: "工程问答",
          menuLabel: "工程问答",
          icon: "ChatDotRound"
        }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
