# Days Matter Desktop — 构建与发布指南

> 基于 Electron + Vite + React + TypeScript，支持本地单平台构建和 GitHub Actions 跨平台 CI/CD。

---

## 目录

1. [环境要求](#1-环境要求)
2. [本地开发](#2-本地开发)
3. [本地构建（单平台）](#3-本地构建单平台)
4. [本地打包安装程序](#4-本地打包安装程序)
5. [配置 GitHub Actions CI/CD](#5-配置-github-actions-cicd)
6. [使用 GitHub Actions 自动构建与发布](#6-使用-github-actions-自动构建与发布)
7. [常见问题排查](#7-常见问题排查)

---

## 1. 环境要求

| 工具 | 版本 | 下载 |
|------|------|------|
| **Node.js** | ≥ 18（推荐 20 LTS） | https://nodejs.org |
| **npm** | ≥ 9 | 随 Node.js 自带 |
| **Git** | ≥ 2.40 | https://git-scm.com |

### 平台依赖（打包时需要）

| 平台 | 额外依赖 | 安装 |
|------|----------|------|
| **Windows** | — | electron-builder 自带 NSIS |
| **macOS** | Xcode CLI | `xcode-select --install`（可选） |
| **Linux** | GTK + NSS | `sudo apt install libgtk-3-dev libnss3-dev` |

### 国内网络加速（强烈建议）

```bash
# npm 镜像
npm config set registry https://registry.npmmirror.com

# Electron 二进制镜像
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/
```

---

## 2. 本地开发

```bash
# 克隆仓库
git clone https://github.com/shaoyihang2021/days-matter-desktop.git
cd days-matter-desktop

# 安装依赖
npm install

# 启动前端开发服务器（浏览器预览）
npm run dev
# 访问 http://localhost:5173 可以看到主应用界面
# 注意：浏览器模式下 Electron API 不可用，桌面小组件功能需要真实 Electron

# 启动 Electron（Vite 已经跑起来后执行）
# 打开另一个终端：
npm run build:electron    # 先编译主进程（只需要一次）
npx electron .            # 启动 Electron
```

---

## 3. 本地构建（单平台）

### 分层构建原理

```
┌─────────────────────────────┐
│   Vite (前端 renderer)       │  ← vite.config.ts 多页面
│   ├─ dist/index.html        │
│   └─ dist/widget.html       │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│   electron-vite (主进程)     │  ← electron.vite.config.ts
│   ├─ dist-electron/main/    │
│   └─ dist-electron/preload/ │
└─────────────────────────────┘
            ↓
┌─────────────────────────────┐
│   electron-builder (打包)    │  ← package.json build 字段
│   └─ release/*.exe/.dmg/... │
└─────────────────────────────┘
```

### 分步构建命令

```bash
# 步骤 1: 构建前端（主应用 + 小组件，Vite 多页面）
npm run build:renderer
# 产出:
#   dist/index.html          主应用页面
#   dist/widget.html         桌面小组件页面
#   dist/assets/*.css        样式打包
#   dist/assets/*.js         JS 打包（含 dayjs, React 等）

# 步骤 2: 构建 Electron 主进程 + Preload
npm run build:electron
# 产出:
#   dist-electron/main/index.js      Electron 主进程（窗口/托盘/IPC）
#   dist-electron/preload/index.js   Preload 脚本（安全桥接）

# 一键执行步骤 1 + 2
npm run build:app
```

### 验证构建

```bash
# 检查产物是否存在
ls -la dist/index.html dist/widget.html \
     dist-electron/main/index.js dist-electron/preload/index.js

# 启动验证
npx electron .
```

---

## 4. 本地打包安装程序

**⚠️ 关键限制：electron-builder 不能跨平台打包。** 你只能在当前操作系统打当前平台的包。三平台全量打包必须用 GitHub Actions。

### 一键打包

```bash
npm run electron:build
# 等价于：npm run build:app && electron-builder

# 查看产物
ls -lh release/

# Windows:  Days Matter Desktop Setup 0.1.0.exe   (~80MB)
# macOS:    Days-Matter-Desktop-0.1.0.dmg          (~90MB)
# Linux:    Days-Matter-Desktop-0.1.0.AppImage     (~85MB)
```

### 只打特定平台

```bash
# 只打 Windows（在 Windows 机器上）
npx electron-builder --win nsis --win zip

# 只打 DMG（在 macOS 机器上）
npx electron-builder --mac dmg

# 只打 Linux AppImage（在 Linux 机器上）
npx electron-builder --linux AppImage

# 只构建不打包（产出 unpacked 目录，方便调试）
npx electron-builder --dir
# 产出在 release/win-unpacked/ 或 release/mac-arm64/ 等
```

### 修改打包配置

所有配置在 `package.json` 的 `"build"` 字段，常用项：

```jsonc
{
  "build": {
    "appId": "com.daysmatter.desktop",
    "productName": "Days Matter Desktop",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "dist-electron/**/*"],
    "asar": true,                          // 代码打包进 asar（防篡改）
    "asarUnpack": ["**/*.node"],           // 需要原生 node 模块时用

    "win": {
      "target": ["nsis", "zip"],           // NSIS 安装包 + zip 便携版
      "artifactName": "DaysMatter-${version}-${arch}.${ext}"
    },

    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.productivity",
      "hardenedRuntime": true              // macOS 安全特性
    },

    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Utility"
    }
  }
}
```

### 添加应用图标

1. 准备各平台图标：
   - Windows: `resources/icon.ico`（256x256 是最佳）
   - macOS: `resources/icon.icns`（自动从 1024x1024 PNG 生成）
   - Linux: `resources/icon.png`（512x512）

2. 在 `package.json` build 里指定：
   ```jsonc
   "win":   { "icon": "resources/icon.ico" },
   "mac":   { "icon": "resources/icon.icns" },
   "linux": { "icon": "resources/icon.png" }
   ```

3. macOS 生成 icns：
   ```bash
   mkdir icon.iconset
   # 用各种尺寸填充 icon.iconset/icon_*.png
   iconutil -c icns icon.iconset -o resources/icon.icns
   ```

---

## 5. 配置 GitHub Actions CI/CD

### 5.1 手动上传 workflows 文件（必做）

**GitHub 出于安全原因禁止通过 API 创建/修改 `.github/workflows/` 下的文件**，必须手动操作一次：

**步骤：**

1. 打开仓库 Actions 页面：
   → **https://github.com/shaoyihang2021/days-matter-desktop/actions/new**

2. 找到中间那个蓝色大框 **set up a workflow yourself**，点击

3. 顶部文件名填：`build.yml`（默认就是这个，保持不变）

4. **复制粘贴**以下内容到编辑器中：

   ```yaml
   name: Build & Release

   on:
     push:
       tags: ['v*']
     workflow_dispatch:

   jobs:
     build:
       name: Build (${{ matrix.os }})
       runs-on: ${{ matrix.os }}
       strategy:
         fail-fast: false
         matrix:
           os: [windows-latest, macos-latest, ubuntu-latest]

       steps:
         - name: Checkout code
           uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: 'npm'

         - name: Install dependencies
           run: npm ci
           env:
             ELECTRON_MIRROR: https://electronjs.org/archives/

         - name: Build Electron app
           run: npm run electron:build

         - name: Upload artifacts
           uses: actions/upload-artifact@v4
           with:
             name: days-matter-desktop-${{ matrix.os }}
             path: release/*
             if-no-files-found: error

     release:
       name: Create Release
       needs: build
       runs-on: ubuntu-latest
       if: startsWith(github.ref, 'refs/tags/v')
       permissions:
         contents: write

       steps:
         - name: Download all artifacts
           uses: actions/download-artifact@v4
           with:
             path: artifacts
             merge-multiple: true

         - name: Create GitHub Release
           uses: softprops/action-gh-release@v2
           with:
             files: artifacts/**
             generate_release_notes: true
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```

   或者**直接复制本地文件**：
   ```bash
   cat days-matter-desktop/.github/workflows/build.yml
   ```

5. 滚动到页面最底部，点绿色按钮 **Commit changes**
   - Commit message 保持默认 `Create build.yml`
   - 选 **Commit directly to the main branch**
   - 点 **Commit changes**

6. ✅ 完成！现在仓库有 CI/CD 了

### 5.2 后续修改 workflows

手动创建完后，后续修改就简单了：
```bash
# 本地编辑后直接推送
git add .github/workflows/build.yml
git commit -m "ci: 修改 workflow"
git push origin main
```

Git push 带 `workflow` scope 权限的 token 时可以直接推送。如果还是被拒，回到 GitHub 网页编辑也可以。

### 5.3 Workflow 架构解读

```
push tag 'v0.1.0'
       │
       ▼
┌─────────────────────────────────────────────┐
│  Job: build                                 │
│  ├── strategy.matrix:                       │
│  │     ├── windows-latest → .exe + .zip     │
│  │     ├── macos-latest   → .dmg + .zip    │
│  │     └── ubuntu-latest  → .AppImage + .deb│
│  │                                          │
│  └── 每个平台独立构建，产出 artifact        │
└─────────────────────────────────────────────┘
       │
       │ needs: build (等全部 3 个 build job 成功)
       ▼
┌─────────────────────────────────────────────┐
│  Job: release                               │
│  ├── 下载所有平台 artifact                  │
│  └── softprops/action-gh-release → 创建 Release│
└─────────────────────────────────────────────┘
```

---

## 6. 使用 GitHub Actions 自动构建与发布

### 6.1 触发 Release（标准流程）

```bash
# 0. 确保本地 main 是最新的
git pull origin main

# 1. 修改 package.json 的 version
# "version": "0.1.0" → "version": "0.2.0"

# 2. 提交版本号变更
git add package.json
git commit -m "chore: bump version to 0.2.0"
git push origin main

# 3. 打 tag 并推送（关键！tag 格式 v*）
git tag v0.2.0
git push origin v0.2.0

# 4. 打开 GitHub Actions 查看进度
#    → https://github.com/shaoyihang2021/days-matter-desktop/actions
#    三个平台同时跑，大约 10-15 分钟

# 5. 构建成功后自动创建 Release
#    → https://github.com/shaoyihang2021/days-matter-desktop/releases
#    用户可以直接下载各平台安装包
```

### 6.2 手动触发构建（不发布 Release）

某些情况你只想构建测试，不想发 Release：

```bash
# 方式 A: 不带 v 前缀的 tag（只触发 build，不触发 release job）
git tag test-0.1
git push origin test-0.1

# 方式 B: GitHub Actions 页面手动 Run workflow
# → https://github.com/shaoyihang2021/days-matter-desktop/actions/workflows/build.yml
# → 右上角 Run workflow（下拉选 main 分支）
```

手动触发也会产出 artifacts，但**不会创建 Release**（release job 有 `if: startsWith(github.ref, 'refs/tags/v')` 守卫）。

### 6.3 查看构建日志

```bash
# GitHub CLI 查看最近运行
gh run list --workflow build.yml

# 查看特定运行的日志
gh run view <run-id> --log

# 只看失败的 job
gh run view <run-id>
# → 按提示用 gh run view --log 看具体报错
```

### 6.4 版本号规范

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：

```
MAJOR.MINOR.PATCH
  │      │     │
  │      │     └── 修复 bug / 小改动
  │      └──────── 新功能（向后兼容）
  └────────────── 破坏性变更
```

### 6.5 macOS 签名与公证（可选）

发布到 App Store 或需要更安全的 macOS 分发时：

1. 获取 Apple Developer 账号证书（`.p12` 文件 + 密码）
2. 打开仓库 Settings → Secrets and variables → Actions
3. 添加 4 个 Secrets：
   - `CSC_LINK` → base64 编码的 `.p12`
   - `CSC_KEY_PASSWORD` → 密码
   - `APPLE_ID` → Apple ID 邮箱
   - `APPLE_APP_SPECIFIC_PASSWORD` → App 专用密码
   - `APPLE_TEAM_ID` → Team ID
4. workflows 里的 env 已经预留好了，填完 Secrets 自动生效

---

## 7. 常见问题排查

### Q1: electron 二进制下载慢/超时

```bash
# 方案 A: 设置镜像
npm config set ELECTRON_MIRROR https://npmmirror.com/mirrors/electron/

# 方案 B: 手动下载后缓存
# macOS:    ~/Library/Caches/electron/
# Linux:    ~/.cache/electron/
# Windows:  %LOCALAPPDATA%\electron\cache\

# 方案 C: GitHub Actions 已内置 ELECTRON_MIRROR，CI 构建不会超时
```

### Q2: CI 构建失败，报 `electron-builder exited with code 1`

```bash
# 本地复现调试
npm run electron:build 2>&1 | tail -30

# 常见原因：
# 1. 缺平台依赖（Linux 缺 libgtk → apt install）
# 2. 源码写错（TypeScript 编译失败 → 先 tsc --noEmit 查）
# 3. 打包路径问题（检查 dist/ 和 dist-electron/ 是否有文件）
```

### Q3: GitHub Actions 跑了但没创建 Release

```bash
# 检查 tag 是否以 v 开头
git tag -l
# 应该是 v0.1.0，不是 0.1.0 或 version-0.1.0

# 检查 release job 是否被跳过
# → Actions → 最新 run → release job 旁边有没有 "Skipped"
# 如果 Skipped，就是 tag 格式不对
```

### Q4: Windows NSIS 安装包打开报 Defender 警告

开发阶段正常，因为没有代码签名证书。发布稳定版后考虑：
- 买个代码签名证书（DigiCert / Sectigo）
- 配置 `win.certificateFile` 和 `win.certificatePassword`
- 或者在 electron-builder 里关闭警告（`win.rpg` 配置）

### Q5: 应用启动后黑屏/白屏

```bash
# 1. 检查 dist/ 是否有 HTML
ls dist/index.html dist/widget.html

# 2. 检查 main.js 的 loadFile 路径是否正确
# 看 electron/main/index.ts 的 loadFile 调用

# 3. 开发模式下正常但打包后异常
#    通常是 base 路径问题 — vite.config.ts 里 "base": "./" 是对的
```

### Q6: 小组件窗口显示不出来

```bash
# 1. 检查 createWidgetWindow() 有没有被调用
# 2. 检查 loadFile 是否成功加载 widget.html
# 3. 在主进程加 debug:
#    mainWindow.webContents.openDevTools()
# 4. 小组件默认 260x140，太小可能看不到
```

---

## 快速参考卡

```bash
# ─── 本地 ───
npm install                # 安装依赖
npm run dev                # Vite 开发（浏览器预览）
npm run electron:build     # 完整构建 + 打包当前平台

# ─── Git ───
git add -A && git commit -m "feat: xxx"
git push origin main
git tag v0.2.0 && git push origin v0.2.0

# ─── GitHub ───
gh run list --workflow build.yml
gh run view <id>
gh release list
```

| 页面 | URL |
|------|-----|
| 仓库首页 | https://github.com/shaoyihang2021/days-matter-desktop |
| Actions | https://github.com/shaoyihang2021/days-matter-desktop/actions |
| Releases | https://github.com/shaoyihang2021/days-matter-desktop/releases |
| Settings | https://github.com/shaoyihang2021/days-matter-desktop/settings |
