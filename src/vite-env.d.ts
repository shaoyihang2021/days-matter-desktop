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
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
