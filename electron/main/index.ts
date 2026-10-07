import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, shell, type NativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let widgetWindow: BrowserWindow | null = null
let tray: Tray | null = null
let currentWidgetEventId: string | null = null

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

function getIsDark(): boolean {
  try {
    const settings = JSON.parse(localStorage.getItem('days-matter-settings') || '{}')
    if (settings.theme === 'dark') return true
    if (settings.theme === 'light') return false
  } catch {}
  return screen.isAskForDisplay
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
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
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
    width: 260, height: 140, minWidth: 180, minHeight: 100,
    frame: false, transparent: true, alwaysOnTop: true,
    resizable: true, movable: true, hasShadow: false,
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

function createTray() {
  const iconPath = path.join(__dirname, '../../resources/icon.png')
  let icon: NativeImage
  try { icon = nativeImage.createFromPath(iconPath); if (icon.isEmpty()) throw new Error() }
  catch { icon = nativeImage.createEmpty() }
  tray = new Tray(icon)
  tray.setToolTip('倒数日')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主界面', click: () => { if (!mainWindow) createMainWindow(); mainWindow?.show(); mainWindow?.focus() } },
    { label: '显示/隐藏小组件', click: () => { if (!widgetWindow) createWidgetWindow(); else widgetWindow.isVisible() ? widgetWindow.hide() : widgetWindow.show() } },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]))
  tray.on('click', () => { if (!mainWindow) createMainWindow(); mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show() })
}

function setWidgetClickThrough(enabled: boolean) { widgetWindow?.setIgnoreMouseEvents(enabled, { forward: true }) }

// IPC
ipcMain.handle('widget:toggle', (_e, show: boolean, eventId?: string) => {
  if (show) { currentWidgetEventId = eventId ?? currentWidgetEventId; const w = createWidgetWindow(); currentWidgetEventId && w.webContents.send('widget:update-event', currentWidgetEventId) }
  else widgetWindow?.hide()
  return true
})
ipcMain.handle('widget:update-event', (_e, id: string) => { currentWidgetEventId = id; widgetWindow?.webContents.send('widget:update-event', id); return true })
ipcMain.handle('widget:set-click-through', (_e, e: boolean) => { setWidgetClickThrough(e); return true })
ipcMain.handle('widget:get-status', () => ({ visible: widgetWindow?.isVisible() ?? false, eventId: currentWidgetEventId }))
ipcMain.handle('widget:close', () => { widgetWindow?.close(); return true })
ipcMain.handle('widget:resize', (_e, w: number, h: number) => { widgetWindow?.setSize(w, h); return true })
ipcMain.handle('main:hide-to-tray', () => { mainWindow?.hide(); return true })
ipcMain.handle('app:open-external', (_e, u: string) => { shell.openExternal(u); return true })

// App lifecycle
app.whenReady().then(() => {
  createMainWindow(); createTray()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow() })
})
app.on('before-quit', () => { tray?.destroy() })
