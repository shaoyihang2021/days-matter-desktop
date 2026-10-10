# v0.2.3 小组件重做 + 托盘图标修复 Implementation Plan

> **For agentic workers:** 按 Task 顺序执行。Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复用户实测三问题：① 小组件全透明无底色 ② 小组件有滑块/设置浮层（应像安卓小组件一样完整展示） ③ 托盘图标透明不可见。

**Architecture:** 小组件放弃 `backdrop-filter`（Windows 透明窗口下 Chromium 会整卡渲染失效），改用**实色卡片 + 自包含 CSS 变量**，主题跟随主应用设置；Widget 纯展示化（删除透明度滑块、穿透开关、设置浮层）；托盘图标路径改用 `process.resourcesPath`（打包后实际位置）+ 内嵌 base64 兜底。

**Tech Stack:** Electron 33 / React 18 / Vite 5 / electron-builder / GitHub Actions（3 平台）

**本次调查实证（打包产物解剖）：**
- `v0.2.2-win.zip` → `resources/resources/icon.ico` 存在（extraResources 正常）✅
- 但 main 代码 `path.join(__dirname, "../../resources/...")` 在 asar 内解析 = `app.asar/resources/icon.ico` ❌ 不存在 → `createEmpty()` → 托盘透明
- `widget-*.css` 含 `backdrop-filter: blur(24px)` + 窗口 `transparent:true` → Windows 下整卡全透明 ❌
- `Widget.tsx` 仍含设置浮层：点击穿透开关 + 透明度滑块 ❌

---

### Task 1: widget.css 全量重写（实色卡片，无 backdrop-filter）

**Files:**
- Modify: `src/widget/widget.css`（全量重写）

- [ ] **Step 1: 写入新 widget.css**

关键规则（完整代码见实施）：

```css
/* 禁止 backdrop-filter！Windows 透明窗口会整卡渲染失效 */
:root, [data-theme="light"] { --w-bg:#FFFFFF; --w-text:#1D1D1F; --w-sub:rgba(29,29,31,.55); ... }
[data-theme="dark"] { --w-bg:#2C2C2E; --w-text:#F2F2F7; ... }
@media (prefers-color-scheme: dark) { [data-theme="auto"] { /* 同 dark */ } }

.widget {
  background: var(--w-bg);        /* 实色，绝不全透明 */
  border-radius: 16px;
  -webkit-app-region: drag;       /* 整卡可拖（安卓小组件手感）*/
}
```

- [ ] **Step 2: 验证构建产物无 backdrop-filter**

Run: `npm run build:renderer`
Expected: `dist/assets/widget-*.css` 中 `grep backdrop-filter` 计数 = 0

- [ ] **Step 3: Commit**

```bash
git add src/widget/widget.css && git commit -m "fix(widget): 实色卡片替代 backdrop-filter（Windows 透明窗口渲染修复）"
```

---

### Task 2: Widget.tsx 纯展示化（删滑块/设置浮层，完整展示）

**Files:**
- Modify: `src/widget/Widget.tsx`（全量重写）

- [ ] **Step 1: 删除** 透明度滑块、点击穿透开关、设置浮层（`.widget-settings`/`.mini-slider`/`.mini-toggle`）、`opacity`/`showSettings`/`clickThrough` 状态
- [ ] **Step 2: 新增** 主题同步：读 `days-matter-settings` → `document.documentElement.dataset.theme`
- [ ] **Step 3: 完整展示**：标题 + 天数 + 日期 + 星期 + 倒计时 + 备注（有则显示）
- [ ] **Step 4: 保留**：点击标题切换事件、hover 关闭按钮（✕）
- [ ] **Step 5: TypeScript 验证**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: Commit**

```bash
git add src/widget/Widget.tsx && git commit -m "fix(widget): 纯展示化 — 去滑块/设置浮层，跟随主题"
```

---

### Task 3: 托盘图标修复（路径 + base64 兜底）

**Files:**
- Modify: `electron/main/index.ts:loadTrayIcon`

- [ ] **Step 1: 替换 loadTrayIcon**

```ts
function loadTrayIcon(): NativeImage {
  const isDark = nativeTheme.shouldUseDarkColors
  const names = isDark
    ? ['icon-white-32.png', 'icon-white-22.png', 'icon.ico', 'icon.png']
    : ['icon.ico', 'icon-22.png', 'icon.png']
  // 打包后：<install>/resources/resources/（extraResources 落地处）
  // 开发时：<project>/resources/
  const roots = app.isPackaged
    ? [path.join(process.resourcesPath, 'resources')]
    : [path.join(__dirname, '../../resources')]
  for (const root of roots) {
    for (const n of names) {
      try {
        const img = nativeImage.createFromPath(path.join(root, n))
        if (!img.isEmpty()) return img
      } catch {}
    }
  }
  return nativeImage.createFromDataURL(isDark ? TRAY_FALLBACK_WHITE : TRAY_FALLBACK_BLUE)
}
```

- [ ] **Step 2: 内嵌 base64 兜底常量**（`TRAY_FALLBACK_BLUE` / `TRAY_FALLBACK_WHITE`，取 resources/icon-22.png 与 icon-white-22.png）
- [ ] **Step 3: Commit**

```bash
git add electron/main/index.ts && git commit -m "fix(tray): 图标路径改 process.resourcesPath + base64 兜底"
```

---

### Task 4: 小组件窗口尺寸适配完整内容

**Files:**
- Modify: `electron/main/index.ts:createWidgetWindow`

- [ ] **Step 1:** `width: 300, height: 150` → `width: 320, height: 170`
- [ ] **Step 2: Commit**

```bash
git add electron/main/index.ts && git commit -m "fix(widget): 窗口 320x170 适配完整内容"
```

---

### Task 5: 构建验证 + v0.2.3 发布 + 取回

- [ ] **Step 1: 本地全量构建验证**：`npm run build:app`
- [ ] **Step 2: 版本号 0.2.2 → 0.2.3**（package.json）
- [ ] **Step 3: push main → API 打 tag v0.2.3**
- [ ] **Step 4: 跟踪 CI 三平台 + Create Release**
- [ ] **Step 5: 取回**：`GH_TOKEN=xxx bash scripts/download-release.sh v0.2.3`（新版本目录，不覆盖 v0.2.2）

---

## 自检清单

- [ ] 小组件有实色底色（light 白 / dark 深灰），无 backdrop-filter
- [ ] 小组件无滑块、无设置浮层
- [ ] 小组件展示：标题/天数/日期/星期/倒计时/备注
- [ ] 托盘图标可见（路径 + base64 双保险）
- [ ] v0.2.3 Release 不覆盖旧版