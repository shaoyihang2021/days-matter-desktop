/// <reference types="vite/client" />

interface ElectronAPI {
  toggleWidget: (show: boolean, eventId?: string) => Promise<boolean>
  updateWidgetEvent: (eventId: string) => Promise<boolean>
  setWidgetClickThrough: (enabled: boolean) => Promise<boolean>
  getWidgetStatus: () => Promise<{ visible: boolean; eventId: string | null }>
  closeWidget: () => Promise<boolean>
  resizeWidget: (width: number, height: number) => Promise<boolean>
  hideToTray: () => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  onWidgetUpdateEvent: (callback: (eventId: string) => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
