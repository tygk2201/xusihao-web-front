# AGENTS.md

## 项目定位

这是前端项目，当前是基于 `Vite + Vue 3` 的单页应用。

主要技术栈：

- Vite
- Vue 3
- Vue Router
- Element Plus
- AntV G6

## 目录说明

```text
src/
  assets/         # 全局样式
  components/     # 通用组件，如 G6 图谱
  composables/    # 组合逻辑与共享状态
  data/           # Mock 数据
  layouts/        # 应用壳层与整体布局
  router/         # 路由配置
  views/          # 页面视图
```

## 开发命令

优先使用项目已有脚本：

```bash
npm install
npm run dev
npm run build
npm run preview
```

如果改用 `pnpm`，需要先修正或删除当前目录下的 `pnpm-workspace.yaml`。该文件必须包含合法的 `packages` 字段，否则 pnpm 会报 `packages field missing or empty`，甚至 `pnpm -v` 也会失败。

## 代码约定

- 默认使用 JavaScript 和 Vue 单文件组件，不要擅自引入 TypeScript 或大规模改造工程结构。
- 保持现有双引号、两个空格缩进、分号结尾的写法。
- 页面级代码放在 `src/views/`，通用组件放在 `src/components/`，跨页面状态和业务组合逻辑放在 `src/composables/`。
- 新增路由时同步维护 `src/router/index.js`，并补齐 `meta.title`、`meta.menuLabel` 和 `meta.icon`。
- Element Plus 图标优先复用 `@element-plus/icons-vue`，不要随意手写重复 SVG。
- 图谱相关能力优先复用 `src/components/G6Graph.vue` 和 `@antv/g6`，不要另起一套图谱库。

## 样式约定

- 全局样式集中在 `src/assets/styles.css`，新增样式优先沿用现有 CSS 变量和 BEM 风格命名。
- 界面风格保持工程技术报告工具的工作台气质：信息清晰、层级稳定、操作直接，不做营销页式大幅装饰。
- 修改页面时注意桌面端宽度适配，避免文字、表格、卡片和图谱区域相互遮挡。
- 不要做无关视觉重构；只调整和当前需求直接相关的样式。

## 数据与接口

- Mock 数据集中维护在 `src/data/mockData.js`。
- 共享状态集中在 `src/composables/useAppState.js`，新增状态前先确认是否能复用已有结构。
- 接真实接口时，先保留 Mock 数据兜底或明确替换边界，避免页面空数据崩溃。
- API Key、Token、Cookie、服务器密码等敏感信息不得写入源码、文档或日志。

## 修改与验证

- 修改前先阅读相关页面、组件、状态和 Mock 数据，不只凭历史上下文判断。
- 不做无关重构，不覆盖用户已有改动。
- 能运行检查时，优先执行：

```bash
npm run build
```

- 如果无法运行安装、构建或预览，要在回复里说明原因和未验证风险。
