# lx-test 部署操作手册

本文档用于记录本地修改代码后，如何更新部署到腾讯云轻量服务器。

## 1. 当前服务器信息

```text
域名：https://luoxiaomiao.cn
备用域名：https://www.luoxiaomiao.cn
服务器公网 IP：111.231.16.149
服务器用户：ubuntu
服务器项目目录：/opt/lx-test
前端目录：/opt/lx-test/frontend
后端目录：/opt/lx-test/backend
后端服务名：lx-test-api
后端端口：3000
Nginx 配置：/etc/nginx/sites-available/luoxiaomiao.cn
密码：Luoxiao1234
登录方式：使用 SSH 密钥或本地密码管理器保存的登录信息
```

不要把服务器密码写入代码仓库或文档。建议后续改用 SSH 密钥登录。

## 2. 本地项目目录

```text
/Users/luoxiao/Desktop/lx-test
├── frontend
├── backend
├── README.md
└── DEPLOYMENT.md
```

## 3. 本地预览

### 启动后端

在本地 Mac 终端执行：

```bash
cd /Users/luoxiao/Desktop/lx-test/backend
npm start
```

后端地址：

```text
http://127.0.0.1:3000/api/health
```

### 启动前端

另开一个终端执行：

```bash
cd /Users/luoxiao/Desktop/lx-test/frontend
npm install
npm run dev
```

前端地址：

```text
http://127.0.0.1:5173
```

## 4. 部署前检查

前端接真实接口时，接口地址应保持为相对路径：

```js
const API_BASE = "/api";
```

这样线上请求会走：

```text
https://luoxiaomiao.cn/api/...
```

## 5. 构建并上传前端

每次修改前端后，先在本地 Mac 终端执行构建：

```bash
cd /Users/luoxiao/Desktop/lx-test/frontend
npm run build
```

构建完成后，把 `dist/` 里面的文件上传到服务器前端目录：

```bash
rsync -av --delete dist/ ubuntu@111.231.16.149:/opt/lx-test/frontend/
```

注意：

- 这里上传的是 `dist/` 里面的内容，不是上传整个 `dist` 文件夹。
- 服务器上的前端目录仍然是 `/opt/lx-test/frontend`。
- 前端只是静态文件，上传完成后不需要重启 Nginx；浏览器强制刷新即可看到新版本。
- `--delete` 会让服务器前端目录和本地 `dist/` 保持一致，确认 `/opt/lx-test/frontend` 只用于存放线上前端静态文件后再使用。

如果本地没有 `rsync`，也可以使用 `scp`：

```bash
scp -r dist/* ubuntu@111.231.16.149:/opt/lx-test/frontend/
```

## 6. 更新后端代码

只有后端代码发生变化时，才需要上传后端代码。可以在本地 Mac 终端执行：

```bash
rsync -av --delete /Users/luoxiao/Desktop/lx-test/backend/ ubuntu@111.231.16.149:/opt/lx-test/backend/
```

上传后登录服务器：

```bash
ssh ubuntu@111.231.16.149
```

## 7. 更新后端服务

进入后端目录：

```bash
cd /opt/lx-test/backend
```

安装依赖：

```bash
npm install
```

如果是第一次部署，安装 PM2：

```bash
sudo npm install -g pm2
```

启动或重启后端：

```bash
pm2 restart lx-test-api || pm2 start src/server.js --name lx-test-api
pm2 save
```

检查服务状态：

```bash
pm2 list
```

正常状态应为：

```text
lx-test-api  online
```

验证后端接口：

```bash
curl http://127.0.0.1:3000/api/health
```

正常返回：

```json
{"ok":true,"service":"doc-insight-engineering-api"}
```

## 8. 检查 Nginx 配置

Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/luoxiaomiao.cn
```

核心配置应包含。前端目录指向 `/opt/lx-test/frontend`，该目录中应直接包含 `index.html` 和 `assets/`：

```nginx
root /opt/lx-test/frontend;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

只有修改 Nginx 配置后，才需要检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

如果只是重新上传了前端构建产物，不需要重启或重载 Nginx。

## 9. 线上验证

浏览器打开：

```text
https://luoxiaomiao.cn
```

接口验证：

```text
https://luoxiaomiao.cn/api/health
```

服务器上也可以执行：

```bash
curl -I https://luoxiaomiao.cn
curl https://luoxiaomiao.cn/api/health
```

## 10. 常用维护命令

查看后端进程：

```bash
pm2 list
```

查看后端日志：

```bash
pm2 logs lx-test-api
```

重启后端：

```bash
pm2 restart lx-test-api
```

停止后端：

```bash
pm2 stop lx-test-api
```

重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

查看 Nginx 状态：

```bash
sudo systemctl status nginx
```

查看 HTTPS 证书：

```bash
sudo certbot certificates
```

测试证书自动续期：

```bash
sudo certbot renew --dry-run
```

## 11. 常见问题

### 1. `npm: command not found`

说明服务器没有安装 Node.js / npm。

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 2. `pm2: command not found`

说明 PM2 没安装。

```bash
sudo npm install -g pm2
```

### 3. 页面能打开，但接口失败

检查后端：

```bash
pm2 list
curl http://127.0.0.1:3000/api/health
```

检查 Nginx `/api/` 代理配置：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. HTTPS 打不开

检查 443 端口、防火墙和 Nginx：

```bash
sudo ss -lntp | grep ':443'
sudo nginx -t
sudo certbot certificates
```

腾讯云轻量服务器防火墙需要开放：

```text
TCP 80
TCP 443
TCP 22
```

## 12. 推荐后续优化

- 配置 SSH 密钥登录，减少密码输入。
- 使用 Git 管理代码，通过 `git pull` 更新服务器代码。
- 给后端增加 `.env` 环境变量文件。
- 增加数据库持久化。
- 后续改成 Vite / Vue / React 工程化前端。
