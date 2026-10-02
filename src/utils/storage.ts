import Store from 'electron-store'
import { DaysEvent, AppSettings, DEFAULT_SETTINGS, DEFAULT_EVENTS } from '@/types'

// electron-store 在 Node 环境下可用，浏览器环境用 localStorage fallback
// 为了让同一份代码在主进程和渲染进程都能用，我们做一个兼容层

interface StorageAdapter {
  getEvents(): DaysEvent[]
  saveEvents(events: DaysEvent[]): void
  getSettings(): AppSettings
  saveSettings(settings: AppSettings): void
}

class NodeStorage implements StorageAdapter {
  private eventStore: Store<{ events: DaysEvent[] }>
  private settingsStore: Store<{ settings: AppSettings }>

  constructor() {
    this.eventStore = new Store<{ events: DaysEvent[] }>({
      name: 'days-matter-events',
      defaults: { events: DEFAULT_EVENTS },
    })
    this.settingsStore = new Store<{ settings: AppSettings }>({
      name: 'days-matter-settings',
      defaults: { settings: DEFAULT_SETTINGS },
    })
  }

  getEvents(): DaysEvent[] {
    return this.eventStore.get('events')
  }

  saveEvents(events: DaysEvent[]): void {
    this.eventStore.set('events', events)
  }

  getSettings(): AppSettings {
    return this.settingsStore.get('settings')
  }

  saveSettings(settings: AppSettings): void {
    this.settingsStore.set('settings', settings)
  }
}

class BrowserStorage implements StorageAdapter {
  private readonly EVENTS_KEY = 'days-matter-events'
  private readonly SETTINGS_KEY = 'days-matter-settings'

  getEvents(): DaysEvent[] {
    const raw = localStorage.getItem(this.EVENTS_KEY)
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return DEFAULT_EVENTS
      }
    }
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS))
    return DEFAULT_EVENTS
  }

  saveEvents(events: DaysEvent[]): void {
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events))
  }

  getSettings(): AppSettings {
    const raw = localStorage.getItem(this.SETTINGS_KEY)
    if (raw) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      } catch {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
  }
}

// 根据运行环境选择适配器
function createStorage(): StorageAdapter {
  if (typeof window !== 'undefined' && window.electronAPI) {
    // Electron 渲染进程：也用 localStorage（因为 electron-store 只在 Node 端）
    // 但其实 electron-store 的数据文件在用户目录，和 localStorage 不同
    // 这里简化处理：渲染进程统一用 localStorage
    return new BrowserStorage()
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron')
    return new NodeStorage()
  } catch {
    return new BrowserStorage()
  }
}

export const storage = createStorage()
