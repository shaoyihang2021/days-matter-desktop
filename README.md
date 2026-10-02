# Days Matter Desktop ⏳

一款电脑版倒数日应用，支持 **桌面小组件（Desktop Widget）**、多平台（Windows / macOS / Linux）。

> 告别手机里的倒数日 App，把重要的日子直接贴在你的桌面上。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)
![Electron](https://img.shields.io/badge/Electron-33-47848F.svg?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)

---

## ✨ 特性

- 🖥️ **桌面小组件** — 无边框、置顶、半透明、可拖拽、点击穿透
- 📅 **倒数 & 正值** — 既可以倒数重要日子，也可以记录已过的天数
- 🎨 **自定义** — 颜色、图标、备注、每年/每月重复
- 🔢 **实时更新** — 每秒更新倒计时（时:分:秒）
- 🧩 **多事件切换** — 小组件内点击即可循环切换显示的事件
- 📦 **跨平台** — Windows `.exe` / macOS `.dmg` / Linux `.AppImage`
- 🔧 **系统托盘** — 快速显示/隐藏主窗口与小组件
- 🌙 **深色主题** — 护眼的深色 UI

## 📥 下载安装

在 [GitHub Releases](https://github.com/shaoyihang2021/days-matter-desktop/releases) 下载对应平台的安装包。

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

# 构建生产版本（当前平台）
npm run build

# 打包安装程序
npm run electron:build
```

### 跨平台构建

通过 GitHub Actions 自动构建，支持三大平台：

```bash
# 打 tag 触发发布
git tag v0.1.0
git push origin v0.1.0
```

CI 将自动构建 Windows、macOS、Linux 安装包并创建 GitHub Release。

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
│   ├── utils/               # 工具函数（日期计算、存储）
│   └── main.tsx             # React 入口
├── index.html               # 主应用 HTML
├── widget.html              # 小组件 HTML
├── vite.config.ts           # Vite 多页面配置
└── .github/workflows/       # CI/CD
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
│   (事件持久化)       │              │  (无边框/置顶/透明)    │
└─────────────────────┘              └──────────────────────┘
```

## 🤝 贡献

欢迎 PR！提交 Issue 前请先搜索是否已有相似问题。

## 📄 许可证

[MIT License](./LICENSE) © Days Matter Desktop
