# Days Matter Desktop ⏳

一款电脑版倒数日应用，支持 **桌面小组件（Desktop Widget）**。

> 告别手机里的倒数日 App，把重要的日子直接贴在你的桌面上。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-brightgreen.svg)
![Electron](https://img.shields.io/badge/Electron-33-47848F.svg?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)

---

## ✨ 特性

- 🖥️ **桌面小组件** — 无边框、置顶、实色卡片、可拖拽、点击穿透（托盘可锁定/解锁），像 Android 小组件一样完整展示事件信息
- 🌓 **主题切换** — 浅色 / 深色 / 跟随系统，小组件与主界面同色，不刺眼
- 🇨🇳 **完整中文界面**
- 📅 **倒数 & 正值** — 既可以倒数重要日子，也可以记录已过的天数
- 🎨 **自定义** — 颜色、备注、每年/每月重复
- 🔢 **实时更新** — 每秒更新倒计时（时:分:秒）
- 🧩 **多事件切换** — 小组件内点击标题即可循环切换事件
- 📦 **Windows 安装包** — NSIS 安装程序，**支持自定义安装路径**
- 🔧 **系统托盘** — 快速显示/隐藏主窗口与小组件

## 📥 下载安装

在 [GitHub Releases](https://github.com/shaoyihang2021/days-matter-desktop/releases) 下载最新版：

- `Days Matter Desktop Setup X.Y.Z.exe` — 安装版（可自定义安装路径）
- `Days Matter Desktop-X.Y.Z-win.zip` — 免安装版

## 🛠️ 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（同时启动 Vite + Electron）
npm run dev

# 编译（渲染进程 + 主进程）
npm run build:app

# 打包 Windows 安装程序 → release/
npm run electron:build
```

### 发布

打 tag 即触发 GitHub Actions 自动构建并创建 Release：

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

详细构建与发布说明见 [docs/BUILD_AND_RELEASE.md](./docs/BUILD_AND_RELEASE.md)。

## 📁 项目结构

```
days-matter-desktop/
├── electron/
│   ├── main/index.ts        # Electron 主进程（窗口管理、托盘、IPC）
│   └── preload/index.ts     # Preload 脚本（安全暴露 API）
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── components/          # 主应用 UI 组件
│   ├── widget/              # 桌面小组件 UI
│   ├── hooks/               # React hooks
│   ├── types/               # TypeScript 类型
│   ├── utils/               # 工具函数（日期计算）
│   └── main.tsx             # React 入口
├── resources/               # 图标资源（打包进 extraResources）
├── scripts/                 # 工具脚本（download-release.sh）
├── docs/                    # 文档与实现计划存档
├── index.html               # 主应用 HTML
├── widget.html              # 小组件 HTML
└── .github/workflows/       # CI/CD（Windows 构建 + Release）
```

## 🏗️ 架构

```
┌─────────────────────┐     IPC      ┌──────────────────────┐
│   React + Vite      │ ◄──────────► │  Electron Main       │
│   (Main Window)     │              │  (多窗口 / 托盘)       │
└──────────┬──────────┘              └──────────┬───────────┘
           │                                    │
           │ localStorage                      │ BrowserWindow
           ▼                                    ▼
┌─────────────────────┐              ┌──────────────────────┐
│   DaysEvent Store   │              │  Widget Window       │
│   (事件持久化)       │              │  (无边框/置顶/可拖拽)   │
└─────────────────────┘              └──────────────────────┘
```

## 🤝 贡献

欢迎 PR！提交 Issue 前请先搜索是否已有相似问题。

## 📄 许可证

[MIT License](./LICENSE) © Days Matter Desktop