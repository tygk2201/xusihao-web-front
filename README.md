# 工程技术报告智能解析与系统图谱分析工具

这是一个前后端分离的练习项目，按《前端开发策划书》初始化。

## 项目结构

```text
lx-test/
├── frontend/   # 前端 H5 / 单页应用原型
└── backend/    # Node.js / Express Mock API 服务
```

## 本地运行

### 后端

```bash
cd backend
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

### 前端

前端是静态项目，可以直接打开 `frontend/index.html`。

也可以启动本地静态服务：

```bash
cd frontend
python3 -m http.server 5173
```

然后访问：

```text
http://127.0.0.1:5173
```

## 当前实现

- 工程报告库 Dashboard
- 报告解析三栏页
- 系统图谱页，包含构成图和影响图
- 工程问答页
- 上传弹窗、API 配置弹窗、Toast 通知
- 后端 Mock API，包括上传、解析状态、结构、构成图、影响图、问答、更新

## 后续练习方向

- 将前端从原生 JS 升级到 Vue 或 React
- 后端接入真实文档解析
- 接入数据库保存报告、节点、参数、关系
- 接入大模型 API 做工程问答
- 部署到腾讯云服务器
