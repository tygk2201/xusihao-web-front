# DocInsight Frontend

基于 `Vite + Vue 3 + Element Plus + AntV G6` 重构的工程技术报告前端。

## 技术栈

- `Vite`
- `Vue 3`
- `Vue Router`
- `Element Plus`
- `AntV G6`

## 页面结构

- `工程报告库` `/dashboard`
- `报告解析` `/parsing`
- `系统图谱` `/graph`
- `工程问答` `/qa`

## 本地启动

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

## 构建

```bash
npm run build
npm run preview
```

## 目录说明

```text
src/
  assets/         # 全局样式
  components/     # 通用组件
  composables/    # 状态与组合逻辑
  data/           # Mock 数据
  layouts/        # 应用壳层
  router/         # 路由配置
  views/          # 页面组件
```

## 当前说明

- 已将原始静态原型改造成单页应用结构
- 已添加左侧菜单与页面路由
- 已用 Element Plus 重建界面骨架
- 已用 G6 替代原 ECharts 图谱区域
- 当前仍使用前端 Mock 数据，尚未接真实后端接口
