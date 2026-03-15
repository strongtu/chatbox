# 开发环境说明

## 代码位置

| 项目 | 路径 | 说明 |
|------|------|------|
| chatbox（本项目） | `~/chatbox`（WSL 原生） | **开发工作目录**，pnpm install 和构建都在这里 |
| eino_agent（后端） | `/mnt/e/Project/TrovoGame/DeAgent/eino_agent` | Go 项目，沙箱机制要求在 WSL 下构建运行 |

> Windows 侧的 `/mnt/e/Project/TrovoGame/chatbox` 不用于开发，不要在那里改代码或跑构建。
> 原因：`/mnt/e` 是 Windows NTFS 磁盘通过 WSL 挂载，pnpm I/O 极慢，且 Windows 下安装的 node_modules 缺少 Linux native 包。

## 首次初始化（WSL）

```bash
git clone https://github.com/strongtu/chatbox ~/chatbox
cd ~/chatbox
pnpm install
```

`pnpm install` 会自动编译 native 依赖。`zipfile` 包的编译警告可忽略（不影响 web 模式）。

## 启动 dev server（WSL）

chatbox 使用 electron-vite，在 WSL 无图形环境下 Electron 无法启动，需要先 mock 掉 Electron 可执行文件：

```bash
# 仅首次需要执行（pnpm install 后执行一次即可，重装依赖后需重新执行）
mv ~/chatbox/node_modules/electron/dist/electron \
   ~/chatbox/node_modules/electron/dist/electron.real
cat > ~/chatbox/node_modules/electron/dist/electron << 'EOF'
#!/bin/sh
# mock electron for WSL: keep alive so electron-vite stays running
while true; do sleep 3600; done
EOF
chmod +x ~/chatbox/node_modules/electron/dist/electron
```

之后每次启动：

```bash
cd ~/chatbox && pnpm run dev:web &
```

Vite dev server 启动在 `http://localhost:1212`。

WSL2 会自动将端口转发到 Windows localhost，**Windows 浏览器直接访问 `http://localhost:1212` 即可看到 chatbox 页面**。

验证是否是 WSL 转发（Windows PowerShell）：

```powershell
netstat -ano | findstr :1212
tasklist | findstr <PID>   # 应显示 wslrelay.exe，说明是 WSL 转发
```

停止服务：

```bash
pkill -f "dev:web"
```

## 联调模式

```
WSL 终端 1：cd /mnt/e/Project/TrovoGame/DeAgent/eino_agent && go run main.go  → :8080
WSL 终端 2：cd ~/chatbox && pnpm run dev:web                                   → :1212
Windows 浏览器：http://localhost:1212  → Settings 中配置 API 地址为 http://localhost:8080
```

## 构建 web 产物

```bash
cd ~/chatbox && pnpm run build:web
# 产物输出到 release/app/dist/renderer/
# delete-sourcemaps 后处理步骤报错可忽略，不影响产物完整性
```
