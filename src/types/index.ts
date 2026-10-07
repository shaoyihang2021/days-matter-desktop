export type EventType = 'countdown' | 'countup' // 倒数 / 正计时

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface DaysEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm (可选)
  type: EventType
  color: string // hex: #RRGGBB
  icon?: string
  note?: string
  repeat?: 'none' | 'yearly' | 'monthly'
  createdAt: number
}

export interface AppSettings {
  launchAtLogin: boolean
  widgetOpacity: number // 0-100
  defaultColor: string
  showSecondaryInfo: boolean
  theme: ThemeMode
}

export const DEFAULT_SETTINGS: AppSettings = {
  launchAtLogin: false,
  widgetOpacity: 92,
  defaultColor: '#64D2FF',
  showSecondaryInfo: true,
  theme: 'auto',
}

export const DEFAULT_EVENTS: DaysEvent[] = [
  {
    id: 'demo-1',
    title: '新年元旦',
    date: `${new Date().getFullYear() + 1}-01-01`,
    type: 'countdown',
    color: '#FF6B6B',
    repeat: 'yearly',
    createdAt: Date.now(),
  },
  {
    id: 'demo-2',
    title: '已活天数',
    date: '2000-01-01',
    type: 'countup',
    color: '#30D158',
    createdAt: Date.now(),
  },
]
