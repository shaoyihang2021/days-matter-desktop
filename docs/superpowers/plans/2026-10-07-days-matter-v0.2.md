# Days Matter Desktop v0.2 — 完整重构实现计划

> **Agentic Workers:** 按 Task 顺序执行，每个 Task 独立可验证。

**Goal:** 把 v0.1 的 AI 风 UI 改成苹果原生风，加深浅色切换，全部汉化，支持自定义安装路径，响应式设置页。

**Architecture:** 引入 CSS 变量主题系统（`[data-theme="light|dark"]`），重写全局样式，NSIS installer 配置自定义安装路径，版本号升到 0.2.0。

**Tech Stack:** Electron 33 + React 18 + TypeScript 5 + Vite 5 + electron-builder 25

---

## 文件矩阵

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/types/index.ts` | 修改 | AppSettings 加 theme 字段 |
| `src/index.css` | 重写 | CSS 变量主题系统（light + dark），统一色板 |
| `src/App.css` | 重写 | 苹果风组件样式 |
| `src/App.tsx` | 修改 | 主题切换按钮、统一中文文案 |
| `src/components/SettingsPanel.tsx` | 重写 | 主题切换、安装路径说明、响应式布局 |
| `src/components/EventCard.tsx` | 修改 | 去 emoji 图标、统一中文文案 |
| `src/components/EventForm.tsx` | 修改 | 去 emoji 图标、中文 placeholder |
| `electron/main/index.ts` | 修改 | 根据主题设置窗口 backgroundColor |
| `package.json` | 修改 | version 0.1.0→0.2.0, build.nsis 自定义安装路径 |
| `installer.nsh` | 新建 | NSIS 自定义安装路径页面 |
| `.github/workflows/build.yml` | 修改 | version 不 hardcode, 保持现有 |

---

## Task 1: 主题系统基础设施

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/hooks/useEvents.ts` (useSettings)

**Step 1: 更新 types**

在 AppSettings 加 theme 字段：

```ts
// src/types/index.ts
export interface AppSettings {
  widgetOpacity: number
  defaultColor: string
  showSecondaryInfo: boolean
  launchAtLogin: boolean
  theme: 'light' | 'dark' | 'auto'  // NEW
}

export const DEFAULT_SETTINGS: AppSettings = {
  widgetOpacity: 80,
  defaultColor: '#6C5CE7',
  showSecondaryInfo: true,
  launchAtLogin: false,
  theme: 'auto',  // NEW: 跟随系统
}
```

**Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add theme field to AppSettings"
```

---

## Task 2: CSS 变量主题系统（核心）

**Files:**
- 重写: `src/index.css`

苹果风设计原则：
- 去深紫蓝渐变背景 → 柔和单色底
- Light 版：#F5F5F7（macOS 标准窗口色）
- Dark 版：#1C1C1E（macOS 标准深色窗口色）
- 卡片 / 面板：半透明磨砂
- 强调色：保留紫但调柔（#5E5CE6 → Apple 系统蓝 #007AFF）
- 圆角：10-12px（macOS 标准）
- 字体：SF Pro 栈

```css
/* src/index.css — 完整重写 */

/* ===== 主题变量系统 ===== */
:root,
[data-theme="light"] {
  /* 背景层级 */
  --bg-app: #F5F5F7;
  --bg-window: #FFFFFF;
  --bg-card: #FFFFFF;
  --bg-header: rgba(255, 255, 255, 0.8);
  --bg-overlay: rgba(0, 0, 0, 0.4);
  
  /* 文字层级 */
  --text-primary: #1D1D1F;
  --text-secondary: #6E6E73;
  --text-tertiary: #AEAEB2;
  --text-inverse: #FFFFFF;
  
  /* 边框 / 分割线 */
  --border: rgba(60, 60, 67, 0.12);
  --border-strong: rgba(60, 60, 67, 0.24);
  --divider: rgba(60, 60, 67, 0.08);
  
  /* 交互 */
  --accent: #007AFF;
  --accent-hover: #0A84FF;
  --accent-bg: rgba(0, 122, 255, 0.08);
  --danger: #FF3B30;
  --success: #34C759;
  --warning: #FF9500;
  
  /* 阴影 */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.2);
  
  /* 滚动条 */
  --scrollbar-thumb: rgba(0, 0, 0, 0.18);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.28);
}

[data-theme="dark"] {
  --bg-app: #1C1C1E;
  --bg-window: #1C1C1E;
  --bg-card: #2C2C2E;
  --bg-header: rgba(28, 28, 30, 0.8);
  --bg-overlay: rgba(0, 0, 0, 0.6);
  
  --text-primary: #F2F2F7;
  --text-secondary: #8E8E93;
  --text-tertiary: #636366;
  --text-inverse: #1D1D1F;
  
  --border: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.2);
  --divider: rgba(255, 255, 255, 0.06);
  
  --accent: #0A84FF;
  --accent-hover: #409CFF;
  --accent-bg: rgba(10, 132, 255, 0.16);
  --danger: #FF453A;
  --success: #30D158;
  --warning: #FF9F0A;
  
  --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.5);
  
  --scrollbar-thumb: rgba(255, 255, 255, 0.2);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.3);
}

/* auto 模式跟随系统 */
@media (prefers-color-scheme: dark) {
  [data-theme="auto"] {
    --bg-app: #1C1C1E;
    --bg-window: #1C1C1E;
    --bg-card: #2C2C2E;
    --bg-header: rgba(28, 28, 30, 0.8);
    --bg-overlay: rgba(0, 0, 0, 0.6);
    --text-primary: #F2F2F7;
    --text-secondary: #8E8E93;
    --text-tertiary: #636366;
    --text-inverse: #1D1D1F;
    --border: rgba(255, 255, 255, 0.12);
    --border-strong: rgba(255, 255, 255, 0.2);
    --divider: rgba(255, 255, 255, 0.06);
    --accent: #0A84FF;
    --accent-hover: #409CFF;
    --accent-bg: rgba(10, 132, 255, 0.16);
    --danger: #FF453A;
    --success: #30D158;
    --warning: #FF9F0A;
    --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
    --shadow-modal: 0 20px 60px rgba(0,0,0,0.5);
    --scrollbar-thumb: rgba(255, 255, 255, 0.2);
    --scrollbar-thumb-hover: rgba(255, 255, 255, 0.3);
  }
}

/* ===== 全局重置 ===== */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #root {
  width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
    'Helvetica Neue', 'PingFang SC', 'Noto Sans SC', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
}

body {
  background: var(--bg-app);
  color: var(--text-primary);
  overflow: hidden;
  transition: background 0.25s ease, color 0.25s ease;
}

.widget-body { background: transparent !important; overflow: hidden; }

/* 滚动条 */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

/* 通用元素 */
button {
  cursor: pointer; border: none; outline: none; font-family: inherit;
  background: none; color: inherit;
}
input, select, textarea {
  font-family: inherit; outline: none;
}
```

**Step 3: 提交**

```bash
git add src/index.css
git commit -m "feat: theme variable system with light/dark/auto modes"
```

---

## Task 3: App.css 苹果风重写

**Files:**
- 重写: `src/App.css`

核心改动：
- 标题栏：去掉渐变 → 半透明磨砂 + 底部 1px divider → 和主界面颜色完全一致（同色背景）
- Tab 切换：macOS 分段控制器风格
- 卡片：扁平 + 细边框 + 柔和阴影
- Modal：苹果风 sheet 样式
- 按钮：SF Symbols 风格去 emoji

```css
/* src/App.css — 完整重写为苹果风 */

.app {
  display: flex; flex-direction: column;
  height: 100%; width: 100%;
  background: var(--bg-app);
}

/* ===== 标题栏（和主界面同色，不刺眼）===== */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-header);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--divider);
  -webkit-app-region: drag;
}

.app-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 15px; font-weight: 600;
  color: var(--text-primary);
}

.app-title .logo {
  width: 22px; height: 22px;
  background: var(--accent);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 12px; font-weight: 700;
}

.app-actions { -webkit-app-region: no-drag; }

/* ===== 按钮（苹果风）===== */
.btn {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px; font-weight: 500;
  transition: all 0.15s ease;
  display: inline-flex; align-items: center; gap: 5px;
}

.btn-primary {
  background: var(--accent);
  color: white;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:active { transform: scale(0.97); }

.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--accent-bg); }

.btn-danger {
  background: rgba(255, 59, 48, 0.08);
  color: var(--danger);
}
.btn-danger:hover { background: rgba(255, 59, 48, 0.15); }

/* ===== Tab 分段控制器（macOS Style）===== */
.app-tabs {
  display: flex; gap: 0;
  padding: 12px 20px 0;
  border-bottom: 1px solid var(--divider);
  -webkit-app-region: no-drag;
}

.tab-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: color 0.15s ease;
}

.tab-btn:hover { color: var(--text-primary); }

.tab-btn.active {
  color: var(--accent);
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 10%; right: 10%;
  height: 2px;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
}

/* ===== 主内容区 ===== */
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* ===== 事件网格 ===== */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
}
.empty-icon {
  font-size: 40px; margin-bottom: 12px;
  opacity: 0.5;
}

/* ===== 事件卡片 ===== */
.event-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 18px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.event-card:hover {
  box-shadow: var(--shadow-card);
  border-color: var(--border-strong);
}

.event-card .color-indicator {
  position: absolute; top: 0; left: 0;
  width: 4px; height: 100%;
  background: var(--event-color, #007AFF);
}

.event-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
}

.event-icon {
  width: 28px; height: 28px;
  border-radius: 7px;
  background: var(--accent-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}

.event-title {
  flex: 1; font-size: 15px; font-weight: 600;
  color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.event-badge {
  font-size: 11px; padding: 2px 8px;
  border-radius: 10px;
  background: var(--accent-bg);
  color: var(--accent);
  font-weight: 500;
}

.event-days {
  display: flex; align-items: baseline; gap: 4px;
  margin: 6px 0;
}

.event-days .number {
  font-size: 40px; font-weight: 700;
  line-height: 1; letter-spacing: -0.02em;
  color: var(--text-primary);
}
.event-days.type-countup .number { color: var(--success); }

.event-days .label {
  font-size: 13px; color: var(--text-secondary);
  font-weight: 400;
}

.event-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.event-actions {
  display: flex; gap: 6px;
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid var(--divider);
}
.event-actions .btn { flex: 1; padding: 6px 10px; font-size: 12px; }

/* ===== Modal ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.modal {
  background: var(--bg-window);
  border-radius: 14px;
  padding: 24px;
  width: 440px; max-width: 90vw;
  box-shadow: var(--shadow-modal);
  border: 1px solid var(--border);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

.modal h2 {
  font-size: 17px; font-weight: 600;
  margin-bottom: 18px; color: var(--text-primary);
}

.form-group { margin-bottom: 14px; }
.form-group label {
  display: block; font-size: 12px; font-weight: 500;
  color: var(--text-secondary); margin-bottom: 5px;
}

.form-group input,
.form-group select {
  width: 100%; padding: 9px 12px;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }

.color-picker-row {
  display: flex; gap: 6px; flex-wrap: wrap;
}

.color-swatch {
  width: 28px; height: 28px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s, border-color 0.15s;
}
.color-swatch:hover { transform: scale(1.08); }
.color-swatch.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-bg);
}

.form-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 20px;
}

/* ===== 设置面板（响应式）===== */
.settings-panel {
  max-width: 100%;  /* 响应式：不锁死 600px */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
}

/* 宽窗口：两列布局；窄窗口：单列 */
@media (min-width: 800px) {
  .settings-panel {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1100px) {
  .settings-panel {
    grid-template-columns: repeat(3, 1fr);
  }
}

.setting-item {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid var(--border);
}

.setting-item h3 {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.setting-item p {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 10px;
}

.setting-item .setting-control {
  display: flex; align-items: center; gap: 12px;
}

.setting-item input[type='range'] {
  flex: 1;
  accent-color: var(--accent);
}

.setting-item .value-display {
  font-size: 13px; color: var(--text-secondary);
  min-width: 40px; text-align: right;
}

.toggle-switch {
  position: relative;
  width: 40px; height: 22px;
  background: var(--border);
  border-radius: 11px;
  cursor: pointer;
  transition: background 0.25s ease;
  flex-shrink: 0;
}
.toggle-switch.on { background: var(--accent); }
.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle-switch.on::after { left: 20px; }

/* 主题选择器（三个圆点）*/
.theme-selector {
  display: flex; gap: 6px;
}
.theme-option {
  width: 36px; height: 28px;
  border-radius: 7px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  background: var(--bg-app);
  transition: all 0.15s;
}
.theme-option:hover { border-color: var(--border-strong); }
.theme-option.active {
  border-color: var(--accent);
  background: var(--accent-bg);
}
```

---

## Task 4: App.tsx — 主题切换 + 统一中文

**Files:**
- 重写: `src/App.tsx`

核心逻辑：从 `settings.theme` 读取，设 `document.documentElement.dataset.theme`，在 header 加主题切换按钮。

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'
import { DaysEvent, AppSettings } from '@/types'
import { useEvents, useSettings } from '@/hooks/useEvents'
import EventCard from '@/components/EventCard'
import EventForm from '@/components/EventForm'
import SettingsPanel from '@/components/SettingsPanel'
import './App.css'

type Tab = 'events' | 'settings'

// 应用主题到 documentElement
function applyTheme(theme: AppSettings['theme']) {
  document.documentElement.dataset.theme = theme
}

export default function App() {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { settings, updateSettings } = useSettings()
  const [tab, setTab] = useState<Tab>('events')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DaysEvent | null>(null)

  // 主题切换实时生效
  useEffect(() => { applyTheme(settings.theme) }, [settings.theme])

  const handleAdd = () => {
    setEditingEvent(null); setShowForm(true)
  }
  const handleEdit = (event: DaysEvent) => {
    setEditingEvent(event); setShowForm(true)
  }
  const handleSubmit = (data: Omit<DaysEvent, 'id' | 'createdAt'>) => {
    editingEvent ? updateEvent(editingEvent.id, data) : addEvent(data)
    setShowForm(false); setEditingEvent(null)
  }
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个事件吗？')) deleteEvent(id)
  }
  const handleShowWidget = async (event: DaysEvent) => {
    if (window.electronAPI) await window.electronAPI.toggleWidget(true, event.id)
    else alert('请在应用环境中运行以使用桌面小组件')
  }

  // 主题切换按钮 — header 右侧
  const cycleTheme = () => {
    const order: AppSettings['theme'][] = ['auto', 'light', 'dark']
    const next = order[(order.indexOf(settings.theme) + 1) % 3]
    updateSettings({ theme: next })
  }
  const themeIcon = { auto: '⌁', light: '☀︎', dark: '☾' }[settings.theme]
  const themeLabel = { auto: '跟随系统', light: '浅色', dark: '深色' }[settings.theme]

  return (
    <div className="app">
      {/* 标题栏 — 和主界面同色（无渐变）*/}
      <header className="app-header">
        <div className="app-title">
          <div className="logo">D</div>
          <span>倒数日</span>
        </div>
        <div className="app-actions" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={cycleTheme} title={`当前：${themeLabel} · 点击切换`}>
            {themeIcon} {themeLabel}
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            ＋ 添加事件
          </button>
        </div>
      </header>

      {/* Tab 分段 */}
      <nav className="app-tabs">
        <button className={`tab-btn ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
          事件列表 <span style={{ opacity: 0.6 }}>({events.length})</span>
        </button>
        <button className={`tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          设置
        </button>
      </nav>

      {/* 主内容 */}
      <main className="app-main">
        {tab === 'events' && (
          <div className="events-grid">
            {events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">D</div>
                <p>还没有事件，点击上方按钮添加吧</p>
              </div>
            ) : (
              events.map((event) => (
                <EventCard key={event.id} event={event}
                  onEdit={handleEdit} onDelete={handleDelete} onShowWidget={handleShowWidget} />
              ))
            )}
          </div>
        )}
        {tab === 'settings' && (
          <SettingsPanel settings={settings} onUpdate={updateSettings} />
        )}
      </main>

      {showForm && (
        <EventForm initialEvent={editingEvent} defaultColor={settings.defaultColor}
          onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingEvent(null) }} />
      )}
    </div>
  )
}
```

---

## Task 5: SettingsPanel 重写

**Files:**
- 重写: `src/components/SettingsPanel.tsx`

新增：主题切换、响应式 grid（宽窗口多列）、安装路径说明。

```tsx
// src/components/SettingsPanel.tsx
import { AppSettings } from '@/types'

interface Props {
  settings: AppSettings
  onUpdate: (updates: Partial<AppSettings>) => void
}

const COLORS = [
  '#FF6B6B', '#FF9F0A', '#FFD60A', '#30D158', '#64D2FF',
  '#5E5CE6', '#BF5AF2', '#FF2D55',
]

const THEMES: { key: AppSettings['theme']; label: string; icon: string }[] = [
  { key: 'auto',  label: '跟随系统', icon: '⌁' },
  { key: 'light', label: '浅色',     icon: '☀︎' },
  { key: 'dark',  label: '深色',     icon: '☾' },
]

export default function SettingsPanel({ settings, onUpdate }: Props) {
  return (
    <div className="settings-panel">

      {/* 主题 */}
      <div className="setting-item">
        <h3>外观主题</h3>
        <p>选择界面颜色模式</p>
        <div className="theme-selector">
          {THEMES.map(t => (
            <button key={t.key}
              className={`theme-option ${settings.theme === t.key ? 'active' : ''}`}
              onClick={() => onUpdate({ theme: t.key })}
              title={t.label}>
              {t.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 默认颜色 */}
      <div className="setting-item">
        <h3>事件颜色</h3>
        <p>新事件将使用此颜色</p>
        <div className="color-picker-row">
          {COLORS.map(c => (
            <div key={c}
              className={`color-swatch ${settings.defaultColor === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => onUpdate({ defaultColor: c })} />
          ))}
        </div>
      </div>

      {/* 小组件透明度 */}
      <div className="setting-item">
        <h3>桌面小组件透明度</h3>
        <p>调整小组件的背景透明度</p>
        <div className="setting-control">
          <input type="range" min="30" max="100" value={settings.widgetOpacity}
            onChange={e => onUpdate({ widgetOpacity: parseInt(e.target.value) })} />
          <span className="value-display">{settings.widgetOpacity}%</span>
        </div>
      </div>

      {/* 详细时间 */}
      <div className="setting-item">
        <h3>显示详细时间</h3>
        <p>不足一天时显示时:分:秒</p>
        <div className="setting-control">
          <div className={`toggle-switch ${settings.showSecondaryInfo ? 'on' : ''}`}
            onClick={() => onUpdate({ showSecondaryInfo: !settings.showSecondaryInfo })} />
        </div>
      </div>

      {/* 开机自启 */}
      <div className="setting-item">
        <h3>开机自启动</h3>
        <p>电脑开机时自动启动</p>
        <div className="setting-control">
          <div className={`toggle-switch ${settings.launchAtLogin ? 'on' : ''}`}
            onClick={() => onUpdate({ launchAtLogin: !settings.launchAtLogin })} />
        </div>
      </div>

      {/* 安装路径说明 */}
      <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
        <h3>安装路径</h3>
        <p>下次安装新版本时，安装向导将允许您自定义安装路径。默认安装到系统应用程序目录。</p>
      </div>

      {/* 关于 */}
      <div className="setting-item">
        <h3>关于</h3>
        <p>倒数日 · Days Matter Desktop</p>
        <p style={{ marginTop: 4, color: 'var(--text-tertiary)' }}>
          v0.2.0 · 基于 Electron + React
        </p>
      </div>

    </div>
  )
}
```

---

## Task 6: EventCard / EventForm 去 emoji

**Files:**
- Modify: `src/components/EventCard.tsx`
- Modify: `src/components/EventForm.tsx`

**Step 1: EventCard — 用 SF Symbol 风格替换 emoji**

把所有大 emoji 图标换成简洁的小圆点 + 颜色方块。EventCard 主要改：
- `.event-icon` 里的内容：`{event.icon || '📅'}` → 空 div（颜色方块已由 CSS 处理）
- `.event-badge` 的文案：保留 `倒数` / `正值`（已是中文）
- 按钮：`🖥️ 小组件` / `✏️ 编辑` / `🗑️` → `小组件` / `编辑` / `删除`

**Step 2: EventForm — 去 emoji 图标选择器**

EMOJIS 数组删除，图标选择器换成简洁的预设集或直接用默认颜色。或者保留但数量减半。

---

## Task 7: Electron main 进程 + NSIS 安装路径

**Files:**
- Modify: `electron/main/index.ts`
- Modify: `package.json`（build.nsis 配置）
- Create: `installer.nsh`（NSIS 自定义页面，可选）

**Step 1: 根据主题设窗口背景色**

```ts
// electron/main/index.ts — createMainWindow 内
function createMainWindow() {
  const settings = loadSettingsSync()  // 从 localStorage 或 app.getPath
  const isDark = settings.theme === 'dark' || 
    (settings.theme === 'auto' && shouldUseDarkColors())
  
  mainWindow = new BrowserWindow({
    width: 900, height: 650, minWidth: 720, minHeight: 520,
    title: '倒数日',  // 改中文名
    backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7',  // ← 和 CSS 变量同步
    // ...
  })
}
```

**Step 2: package.json — NSIS 自定义安装路径**

```json
// package.json — build.win.nsis
"nsis": {
  "oneClick": false,
  "perMachine": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "倒数日",
  "artifactName": "${productName}-Setup-${version}.${ext}"
}
```

**Step 3: package.json 版本号**

```json
"version": "0.2.0"
```

---

## Task 8: Release v0.2.0 全链路

**Step 1: 本地构建验证**

```bash
cd /workspace/days-matter-desktop
npm run electron:build
# 检查 release/ 目录下有 .exe / .dmg / .AppImage
```

**Step 2: 提交所有改动**

```bash
git add -A
git commit -m "feat: v0.2 complete redesign — theme system, 全汉化, 自定义安装路径, 苹果风 UI"
git push origin main
```

**Step 3: 打 tag 触发 CI**

```bash
git tag v0.2.0
git push origin v0.2.0
# 等 10 分钟
```

**Step 4: 取回核心包到 TRAE**

```bash
GH_TOKEN=xxx bash scripts/download-release.sh v0.2.0
```

---

## 自检清单

- [ ] 主题系统：三种模式（light/dark/auto）都能切换
- [ ] 统一色彩：标题栏和主界面同色（无刺眼渐变）
- [ ] 安装路径：nsis `allowToChangeInstallationDirectory: true`
- [ ] 汉化：所有可见 UI 文字都是中文
- [ ] 去 AI 味：无大 emoji、无紫蓝渐变、SF Pro 字体栈
- [ ] 设置页响应式：宽窗口多列、窄窗口单列
- [ ] Release v0.2.0：打 tag → CI → 取回 TRAE workspace
- [ ] 不覆盖上一版：v0.1.0 和 v0.2.0 各自独立
