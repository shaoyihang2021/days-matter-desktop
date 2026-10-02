import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, shell, type NativeImage } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 窗口引用
let mainWindow: BrowserWindow | null = null
let widgetWindow: BrowserWindow | null = null
let tray: Tray | null = null
let currentWidgetEventId: string | null = null

// 开发模式判断
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

// 主窗口创建
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 720,
    minHeight: 520,
    title: 'Days Matter Desktop',
    backgroundColor: '#1a1a2e',
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 桌面小组件窗口创建（无边框、置顶、半透明、可拖拽）
function createWidgetWindow() {
  if (widgetWindow) {
    widgetWindow.show()
    widgetWindow.focus()
    return widgetWindow
  }

  widgetWindow = new BrowserWindow({
    width: 260,
    height: 140,
    minWidth: 180,
    minHeight: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 让窗口穿透鼠标事件（小组件模式）——通过 IPC 切换
  widgetWindow.setAlwaysOnTop(true, 'screen-saver')

  if (isDev) {
    widgetWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '/widget.html')
  } else {
    widgetWindow.loadFile(path.join(__dirname, '../../dist/widget.html'))
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null
    currentWidgetEventId = null
  })

  // 默认定位到屏幕右下角
  const primaryDisplay = screen.getPrimaryDisplay()
  const { workArea } = primaryDisplay
  const widgetBounds = widgetWindow.getBounds()
  widgetWindow.setBounds({
    x: workArea.x + workArea.width - widgetBounds.width - 30,
    y: workArea.y + workArea.height - widgetBounds.height - 60,
    width: widgetBounds.width,
    height: widgetBounds.height,
  })

  return widgetWindow
}

// 切换窗口穿透（小组件点击穿透）
function setWidgetClickThrough(clickThrough: boolean) {
  if (!widgetWindow) return
  widgetWindow.setIgnoreMouseEvents(clickThrough, { forward: true })
}

// 创建系统托盘
function createTray() {
  // 使用一个简单的透明图标（实际应该放 .ico/.png）
  const iconPath = path.join(__dirname, '../../resources/icon.png')
  let icon: NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) throw new Error('empty')
  } catch {
    // 创建一个 16x16 空图标作为 fallback
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Days Matter Desktop')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        if (!mainWindow) createMainWindow()
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    {
      label: '显示/隐藏小组件',
      click: () => {
        if (!widgetWindow) {
          createWidgetWindow()
        } else {
          widgetWindow.isVisible() ? widgetWindow.hide() : widgetWindow.show()
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (!mainWindow) createMainWindow()
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
  })
}

// ============ IPC 处理 ============

// 打开/关闭小组件
ipcMain.handle('widget:toggle', (_event, show: boolean, eventId?: string) => {
  if (show) {
    currentWidgetEventId = eventId ?? currentWidgetEventId
    const win = createWidgetWindow()
    if (currentWidgetEventId) {
      win.webContents.send('widget:update-event', currentWidgetEventId)
    }
  } else {
    widgetWindow?.hide()
  }
  return true
})

// 更新小组件显示的事件
ipcMain.handle('widget:update-event', (_event, eventId: string) => {
  currentWidgetEventId = eventId
  if (widgetWindow) {
    widgetWindow.webContents.send('widget:update-event', eventId)
  }
  return true
})

// 设置点击穿透
ipcMain.handle('widget:set-click-through', (_event, enabled: boolean) => {
  setWidgetClickThrough(enabled)
  return true
})

// 获取小组件状态
ipcMain.handle('widget:get-status', () => {
  return {
    visible: widgetWindow?.isVisible() ?? false,
    eventId: currentWidgetEventId,
  }
})

// 关闭小组件窗口
ipcMain.handle('widget:close', () => {
  widgetWindow?.close()
  return true
})

// 调整小组件大小
ipcMain.handle('widget:resize', (_event, width: number, height: number) => {
  widgetWindow?.setSize(width, height)
  return true
})

// 保存窗口位置
ipcMain.handle('main:hide-to-tray', () => {
  mainWindow?.hide()
  return true
})

// 打开外部链接
ipcMain.handle('app:open-external', (_event, url: string) => {
  shell.openExternal(url)
  return true
})

// ============ App 生命周期 ============

app.whenReady().then(() => {
  createMainWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // 保持后台运行（托盘），除非显式退出
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
})

app.on('before-quit', () => {
  tray?.destroy()
})
