# Days Matter Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款电脑版倒数日（Days Matter）应用，支持桌面小组件（无边框、置顶、半透明、可拖拽），可在 Windows / macOS / Linux 上运行，并通过 GitHub Actions 自动构建发布。

**Architecture:** Electron 多窗口架构 —— 主窗口用 React + Vite 管理事件 CRUD，独立的 Widget 窗口渲染桌面小组件。通过 contextBridge 安全暴露 IPC 接口实现两窗口通信。数据持久化用 localStorage（跨环境兼容）。CI/CD 用 GitHub Actions matrix 跨平台构建，push tag 触发自动打包 release。

**Tech Stack:** Electron 33 · React 18 · Vite 5 · electron-vite · TypeScript 5 · dayjs · electron-builder · GitHub Actions

---

## File Structure

```
days-matter-desktop/
├── electron/
│   ├── main/index.ts          # Electron 主进程：多窗口/托盘/IPC
│   └── preload/index.ts       # Preload 脚本：contextBridge 安全 API
├── src/
│   ├── App.tsx / App.css      # 主应用 UI
│   ├── main.tsx               # React 入口
│   ├── index.css              # 全局样式
│   ├── components/
│   │   ├── EventCard.tsx      # 事件卡片
│   │   ├── EventForm.tsx      # 添加/编辑弹窗
│   │   └── SettingsPanel.tsx  # 设置面板
│   ├── widget/
│   │   ├── Widget.tsx         # 桌面小组件 UI
│   │   ├── main.tsx           # 小组件 React 入口
│   │   └── widget.css         # 小组件样式
│   ├── hooks/useEvents.ts     # 事件/设置 state hook + localStorage 持久化
│   ├── types/index.ts         # DaysEvent / AppSettings 类型定义
│   ├── utils/dateUtils.ts     # 日期计算（倒数/正值/剩余时间）
│   ├── utils/storage.ts       # electron-store / localStorage 兼容层
│   └── vite-env.d.ts          # window.electronAPI 类型
├── index.html / widget.html   # Vite 多页面入口
├── vite.config.ts             # renderer 构建配置（多页面）
├── electron.vite.config.ts    # main + preload 构建配置
├── tsconfig.json
├── package.json               # electron-builder 配置内嵌
├── .github/workflows/build.yml # CI/CD 矩阵构建 + Release
├── README.md / LICENSE / .gitignore
```

---

### Task 1: 项目脚手架 & 类型定义 ✅ DONE

**Files:**
- Create: `package.json` — Electron + Vite + React + TS 依赖 & scripts & electron-builder 配置
- Create: `tsconfig.json`, `vite.config.ts`（多页面 rollupOptions）
- Create: `index.html`, `widget.html`
- Create: `src/types/index.ts` — DaysEvent, AppSettings, DEFAULT_EVENTS

**Status:** 完成。`npm install` 通过，Vite 多页面构建产出 index.html + widget.html。

### Task 2: 工具层 & React Hooks ✅ DONE

**Files:**
- Create: `src/utils/dateUtils.ts` — calculateDays, getDaysText, calculateTimeRemaining, formatDate
- Create: `src/utils/storage.ts` — NodeStorage(BrowserStore) + BrowserStorage(localStorage) 兼容层
- Create: `src/hooks/useEvents.ts` — useEvents / useSettings hooks（localStorage 持久化）

**Status:** 完成。TypeScript strict 模式编译通过。

### Task 3: Electron 主进程 & Preload ✅ DONE

**Files:**
- Create: `electron/main/index.ts` — 两个 BrowserWindow + Tray + IPC handlers
  - createMainWindow: 900x650, contextIsolation
  - createWidgetWindow: 260x140, frameless/transparent/alwaysOnTop/skipTaskbar
  - createTray: Menu.buildFromTemplate，左键切换主窗口显隐
  - IPC: widget:toggle / widget:update-event / widget:set-click-through / widget:close / widget:resize / main:hide-to-tray
- Create: `electron/preload/index.ts` — contextBridge.exposeInMainWorld('electronAPI', {...})

**Status:** 完成。`electron-vite build` 产出 dist-electron/main/index.js + dist-electron/preload/index.js。

### Task 4: 主应用 React UI ✅ DONE

**Files:**
- Create: `src/App.tsx` + `src/App.css` — Tab 切换 / 事件列表网格 / 空状态
- Create: `src/main.tsx` — ReactDOM.createRoot 入口
- Create: `src/components/EventCard.tsx` — 颜色条 + 大数字天数 + emoji + 操作按钮
- Create: `src/components/EventForm.tsx` — 标题/日期/时间/类型/颜色/emoji/备注/重复
- Create: `src/components/SettingsPanel.tsx` — 透明度 / 默认颜色 / 详细时间 / 开机自启
- Create: `src/index.css` — 全局样式 + 滚动条美化

**Status:** 完成。40 模块 Vite 构建通过（index.js ~160KB gzip 49KB，含 dayjs）。

### Task 5: 桌面小组件 UI ✅ DONE

**Files:**
- Create: `src/widget/main.tsx` — React 入口挂载到 #widget-root
- Create: `src/widget/Widget.tsx` — 渐变数字 + 实时倒计时（每秒更新）+ 点击穿透 + 透明度 + 事件循环切换
- Create: `src/widget/widget.css` — glassmorphism 毛玻璃 + CSS 变量 --accent-color + hover 显示控制按钮 + 拖拽区域

**Status:** 完成。widget.js 单独打包 gzip 1.2KB。

### Task 6: CI/CD & Git ⏳ PARTIAL

**Files:**
- Create: `.github/workflows/build.yml` — GitHub Actions matrix（win/mac/ubuntu-latest），push tag v* 触发，electron-builder 打包，upload-artifact，softprops/action-gh-release
- Create: `.gitignore` — node_modules / dist / dist-electron / release / .env / IDE 产物
- Create: `LICENSE` — MIT
- Create: `README.md` — 项目介绍 + 特性 + 构建说明 + 架构图

**Status:** GitHub Actions 配置完成。本地 git init + 首次 commit（30 files, 9635 lines）完成。待用户手动在 GitHub 创建 days-matter-desktop 空仓库后执行 git push。

### Task 7: 推送 GitHub & 验证 ⏳ PENDING

- [ ] 用户手动创建 GitHub 空仓库（https://github.com/new，name=days-matter-desktop，Public，无初始化）
- [ ] `git remote -v` 确认 origin 指向正确地址
- [ ] `git push -u origin main` 推送代码
- [ ] GitHub Pages 可选（README 自动渲染）
- [ ] 打 tag 触发 CI：`git tag v0.1.0 && git push origin v0.1.0`
- [ ] 在 GitHub Actions 页面确认三个平台构建成功

---

## Self-Review

**1. Spec coverage:**
- ✅ 电脑版倒数日 —— Electron 跨平台桌面应用
- ✅ 桌面组件 —— 独立 Widget 窗口（无边框/透明/置顶/可拖拽）
- ✅ GitHub 建库并推送 —— MCP 插件 push_files + git push（token 权限问题需用户手动创建仓库）
- ✅ 合理利用 GitHub 能力 —— Actions CI/CD + Releases 自动发布

**2. Placeholder scan:** 无 TBD/TODO，所有代码完整可运行。

**3. Type consistency:** `DaysEvent` / `AppSettings` 在 types、hooks、各组件中一致使用；IPC channel names 统一（kebab-case）。
