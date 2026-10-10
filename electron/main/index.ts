import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, nativeTheme, type NativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let widgetWindow: BrowserWindow | null = null
let tray: Tray | null = null
let currentWidgetEventId: string | null = null
let widgetClickThrough = false  // 主进程维护穿透状态（避免死锁）

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

function getIsDark(): boolean {
  try {
    const settings = JSON.parse(localStorage.getItem('days-matter-settings') || '{}')
    if (settings.theme === 'dark') return true
    if (settings.theme === 'light') return false
  } catch {}
  return nativeTheme.shouldUseDarkColors  // 跟随系统
}

function createMainWindow() {
  const isDark = getIsDark()
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 720,
    minHeight: 520,
    title: '倒数日',
    backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7',
    frame: false,  // Windows-only：彻底自绘标题栏（无原生栏）
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '/index.html')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function createWidgetWindow() {
  if (widgetWindow) { widgetWindow.show(); widgetWindow.focus(); return widgetWindow }
  widgetWindow = new BrowserWindow({
    width: 320, height: 170,  /* 初始尺寸，完整展示事件信息 */
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: false, movable: true, hasShadow: false,
    skipTaskbar: true, focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  })
  widgetWindow.setAlwaysOnTop(true, 'screen-saver')
  if (isDev) widgetWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '/widget.html')
  else widgetWindow.loadFile(path.join(__dirname, '../../dist/widget.html'))
  widgetWindow.on('closed', () => { widgetWindow = null; currentWidgetEventId = null })

  const { workArea } = screen.getPrimaryDisplay()
  const b = widgetWindow.getBounds()
  widgetWindow.setBounds({
    x: workArea.x + workArea.width - b.width - 30,
    y: workArea.y + workArea.height - b.height - 60,
    width: b.width, height: b.height,
  })
  return widgetWindow
}

function buildTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: '显示主界面', click: () => { if (!mainWindow) createMainWindow(); mainWindow?.show(); mainWindow?.focus() } },
    { label: widgetWindow?.isVisible() ? '隐藏小组件' : '显示小组件', click: () => { if (!widgetWindow) createWidgetWindow(); else widgetWindow.isVisible() ? widgetWindow.hide() : widgetWindow.show() } },
    // ↓ 关键：即使小组件设了穿透，托盘菜单永远能解锁（避免死锁）
    { label: widgetClickThrough ? '🔓 解锁小组件点击' : '🔒 锁定小组件点击', click: () => { widgetClickThrough = !widgetClickThrough; widgetWindow?.setIgnoreMouseEvents(widgetClickThrough, { forward: true }); tray?.setContextMenu(buildTrayMenu()) } },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])
}

// 托盘图标兜底（内嵌 base64 22px PNG，即使打包路径异常也保证托盘图标可见）
const TRAY_FALLBACK_BLUE = 'iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABL0lEQVR4nLWVMUvDUBDHf3lGLA5CFQQdxUF0sJ/AxVEQBCe/gi6uTp0cpYObs506SMWPoKMoiBYEcRDBwRbjYjAmDq9isO/eSxrzX96Ru/vdvcuRQEnynBF7SWJ8vu9Zc2WnBMxYQBWCWmIHwXmglhzlChgW7kmOqx1YntF2FMN7CA9dOO1A4wLePoQC/ZmbZ5zS8TWM12HlCJ4CqK/C5TbMTtjzlKnbv/r8gpsX2GzC/SvMTUJjTQjus5wdpxXFcHKr7fUFGB1xdZxDz4E+x3yoVv4R/DPbMIKe9ALzgn0FG4vabnf07AuBfQVL09DagvkpvXa7Z/acTHscJxCE8NiD9h0cnLv32Jcq1g6z3EXW7ygcn8FMSjGU5CgCHQQPCzfkmLciD1yILe3XVJq+AfykYLpYgMZOAAAAAElFTkSuQmCC'
const TRAY_FALLBACK_WHITE = 'iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABKElEQVR4nLWVvUoDQRRGz4wrm8aVaBEQCxGEKILBMj6CJFhYmdo++AR5Axt9BStBECxtfAOLhBRiaUBQwUIU16zFsBCz85PZdb9mLsz9zlzu3NmFkiRcCUmSJFqjEFavcdMEnPUAWQRqy82AfaA2j3Ql5IUL00bjDO5HKg4kLISwvgStOnSbsFjRH5D2XNvjSXV24KMHd8ewGkHvFnbP4end7pO6aqc1PwfbNbg8go1leHyF7o0+N2U5K55UIOFgS8XXQ/j+cVTso5VIrV8xvH3+IzjtbRhA1XCB3uB4DFcDFbfrqveFwPEY+s9weAEPL2rsTvftnpnmWAqIQlirQnsTTvbcc2wE51Xmgbg+gz7QP+Ci8Glv5vLywHUe7VT4wE25pf2aStMvZFhhUz7MrbIAAAAASUVORK5CYII='

function loadTrayIcon(): NativeImage {
  // Windows 深色任务栏用白色版，浅色任务栏用彩色版
  const isDark = nativeTheme.shouldUseDarkColors
  const names = isDark
    ? ['icon-white-32.png', 'icon-white-22.png', 'icon.ico', 'icon.png']
    : ['icon.ico', 'icon-22.png', 'icon.png']
  // 打包后图标实际位置：<install>/resources/resources/（extraResources 落地处）
  // 开发时图标位置：<project>/resources/
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
  // 兜底：内嵌 base64，保证托盘图标永不缺失
  return nativeImage.createFromDataURL(
    'data:image/png;base64,' + (isDark ? TRAY_FALLBACK_WHITE : TRAY_FALLBACK_BLUE)
  )
}

function createTray() {
  tray = new Tray(loadTrayIcon())
  tray.setToolTip('倒数日')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => { if (!mainWindow) createMainWindow(); mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show() })
  // 系统深浅色切换时自动换托盘图标
  nativeTheme.on('updated', () => tray?.setImage(loadTrayIcon()))
}

function setWidgetClickThrough(enabled: boolean) {
  widgetClickThrough = enabled
  widgetWindow?.setIgnoreMouseEvents(enabled, { forward: true })
  tray?.setContextMenu(buildTrayMenu())  // 刷新菜单文案
}

// IPC
ipcMain.handle('widget:toggle', (_e, show: boolean, eventId?: string) => {
  if (show) { currentWidgetEventId = eventId ?? currentWidgetEventId; const w = createWidgetWindow(); currentWidgetEventId && w.webContents.send('widget:update-event', currentWidgetEventId) }
  else widgetWindow?.hide()
  return true
})
ipcMain.handle('widget:update-event', (_e, id: string) => { currentWidgetEventId = id; widgetWindow?.webContents.send('widget:update-event', id); return true })
ipcMain.handle('widget:close', () => { widgetWindow?.close(); return true })
ipcMain.handle('main:minimize', () => { mainWindow?.minimize(); return true })
ipcMain.handle('main:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize(); return true })
ipcMain.handle('main:close', () => { mainWindow?.close(); return true })

// App lifecycle
app.whenReady().then(() => {
  createMainWindow(); createTray()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow() })
})
app.on('before-quit', () => { tray?.destroy() })
