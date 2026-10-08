import { contextBridge, ipcRenderer } from 'electron'

// 使用 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 小组件相关
  toggleWidget: (show: boolean, eventId?: string) =>
    ipcRenderer.invoke('widget:toggle', show, eventId),
  updateWidgetEvent: (eventId: string) =>
    ipcRenderer.invoke('widget:update-event', eventId),
  setWidgetClickThrough: (enabled: boolean) =>
    ipcRenderer.invoke('widget:set-click-through', enabled),
  getWidgetStatus: () => ipcRenderer.invoke('widget:get-status'),
  closeWidget: () => ipcRenderer.invoke('widget:close'),
  resizeWidget: (width: number, height: number) =>
    ipcRenderer.invoke('widget:resize', width, height),

  // 主窗口（Windows 自绘栏控制）
  hideToTray: () => ipcRenderer.invoke('main:hide-to-tray'),
  minimize: () => ipcRenderer.invoke('main:minimize'),
  maximize: () => ipcRenderer.invoke('main:maximize'),
  close: () => ipcRenderer.invoke('main:close'),

  // 工具
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),

  // 小组件接收更新
  onWidgetUpdateEvent: (callback: (eventId: string) => void) => {
    ipcRenderer.on('widget:update-event', (_event, eventId) => callback(eventId))
  },
})
