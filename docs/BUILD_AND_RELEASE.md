# Days Matter Desktop — 构建与发布指南

> Electron + Vite + React + TypeScript。GitHub Actions 自动构建 Windows 安装包并发布 Release。

---

## 1. 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18（推荐 20 LTS） | https://nodejs.org |
| npm | ≥ 9 | 随 Node.js 自带 |
| Git | ≥ 2.40 | https://git-scm.com |

国内网络可选加速：

```bash
npm config set registry https://registry.npmmirror.com
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
```

> ⚠️ 不要设置不存在的镜像地址（如 `https://electronjs.org/archives/`），会导致 `npm ci` 拉取 Electron 全部失败。

## 2. 本地开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（Vite + Electron 热更新）
```

## 3. 本地构建

```bash
npm run build:app       # 编译渲染进程 + 主进程 → dist/ + dist-electron/
npm run electron:build  # 打包 Windows 安装程序 → release/
```

产物（`release/` 目录）：

- `Days Matter Desktop Setup X.Y.Z.exe` — NSIS 安装包（**支持自定义安装路径**）
- `Days Matter Desktop-X.Y.Z-win.zip` — 免安装版

## 4. 发布流程（GitHub Actions）

CI 配置：`.github/workflows/build.yml`，仅构建 Windows（自 v0.2.4 起）。

```bash
# 1. 版本号 +1（package.json 的 version 必须与 tag 一致！）
# 2. 提交推送
git push origin main

# 3. 打 tag 触发 CI
git tag vX.Y.Z && git push origin vX.Y.Z

# 4. 等待 CI 完成（约 5 分钟），自动创建 GitHub Release

# 5. 取回安装包到本地
GH_TOKEN=xxx bash scripts/download-release.sh vX.Y.Z
```

## 5. 常见问题排查

| 现象 | 原因 | 处理 |
|------|------|------|
| `npm ci` 偶发 500/404 | GitHub Releases 抖动 | workflow 已内置 3 次重试；本地重跑即可 |
| electron-builder 与 action-gh-release 抢 Release | 两者都尝试创建 Release | package.json 已设 `"publish": null`，打包与发布分离 |
| Release 里出现 100+ 小文件 | unpacked 中间产物被上传，触发 API 限流 | CI 的 cleanup 步骤只保留最终安装包（exe/zip/dmg/deb/AppImage/blockmap） |
| 托盘图标不显示 | 打包后图标在 `resources/resources/`（extraResources），代码却从 asar 里找 | 已按 `app.isPackaged` 分支解析 + 内嵌 base64 兜底 |
| 小组件整个透明 | Windows 透明窗口 + `backdrop-filter` 的渲染 bug | 已改用实色卡片，禁止 backdrop-filter |
| 图标资源缺失导致打包失败 | macOS 要求 icon ≥ 512px | `resources/icon.png` 保持 1024×1024 |

## 6. 目录约定

```
resources/          图标资源（打包进 extraResources）
scripts/            工具脚本（download-release.sh 等）
docs/               文档与实现计划存档
releases/vX.Y.Z/    本地取回的安装包（gitignore，不提交）
.trae/              本地 TRAE 技能（gitignore，不提交）
```