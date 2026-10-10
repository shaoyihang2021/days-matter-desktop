/// <reference types="vite/client" />

interface ElectronAPI {
  toggleWidget: (show: boolean, eventId?: string) => Promise<boolean>
  updateWidgetEvent: (eventId: string) => Promise<boolean>
  closeWidget: () => Promise<boolean>
  minimize: () => Promise<boolean>
  maximize: () => Promise<boolean>
  close: () => Promise<boolean>
  onWidgetUpdateEvent: (callback: (eventId: string) => void) => void
}

declare global {
  /** 构建时由 vite define 注入（来自 package.json version） */
  const __APP_VERSION__: string

  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
