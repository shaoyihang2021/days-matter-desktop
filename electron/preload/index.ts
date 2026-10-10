import { contextBridge, ipcRenderer } from 'electron'

// 使用 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 小组件相关
  toggleWidget: (show: boolean, eventId?: string) =>
    ipcRenderer.invoke('widget:toggle', show, eventId),
  updateWidgetEvent: (eventId: string) =>
    ipcRenderer.invoke('widget:update-event', eventId),
  closeWidget: () => ipcRenderer.invoke('widget:close'),

  // 主窗口（Windows 自绘栏控制）
  minimize: () => ipcRenderer.invoke('main:minimize'),
  maximize: () => ipcRenderer.invoke('main:maximize'),
  close: () => ipcRenderer.invoke('main:close'),

  // 小组件接收更新
  onWidgetUpdateEvent: (callback: (eventId: string) => void) => {
    ipcRenderer.on('widget:update-event', (_event, eventId) => callback(eventId))
  },
})
