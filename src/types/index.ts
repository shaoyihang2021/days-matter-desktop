export type EventType = 'countdown' | 'countup' // 倒数 / 正计时

export interface DaysEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm (可选)
  type: EventType
  color: string // hex: #RRGGBB
  icon?: string // emoji 图标
  note?: string
  repeat?: 'none' | 'yearly' | 'monthly'
  createdAt: number
}

export interface AppSettings {
  launchAtLogin: boolean
  widgetOpacity: number // 0-100
  defaultColor: string
  showSecondaryInfo: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  launchAtLogin: false,
  widgetOpacity: 92,
  defaultColor: '#6C5CE7',
  showSecondaryInfo: true,
}

export const DEFAULT_EVENTS: DaysEvent[] = [
  {
    id: 'demo-1',
    title: '新年元旦',
    date: `${new Date().getFullYear() + 1}-01-01`,
    type: 'countdown',
    color: '#E17055',
    icon: '🎊',
    repeat: 'yearly',
    createdAt: Date.now(),
  },
  {
    id: 'demo-2',
    title: '已活天数',
    date: '2000-01-01',
    type: 'countup',
    color: '#00B894',
    icon: '🌟',
    createdAt: Date.now(),
  },
]
