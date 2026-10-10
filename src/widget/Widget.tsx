import { useState, useEffect } from 'react'
import { DaysEvent } from '@/types'
import { getDaysText, formatDate, getWeekday, calculateTimeRemaining } from '@/utils/dateUtils'
import '@/widget/widget.css'

const EVENTS_KEY = 'days-matter-events'
const SETTINGS_KEY = 'days-matter-settings'

function loadEvents(): DaysEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

/** 跟随主应用的主题设置（light / dark / auto） */
function applyTheme() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    document.documentElement.dataset.theme = s.theme || 'auto'
  } catch {
    document.documentElement.dataset.theme = 'auto'
  }
}

export default function Widget() {
  const [events, setEvents] = useState<DaysEvent[]>(loadEvents())
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [, setNow] = useState(Date.now())

  useEffect(() => {
    applyTheme()

    // 每秒刷新（倒计时秒数用）
    const tick = setInterval(() => setNow(Date.now()), 1000)
    // 定期同步事件与主题（主窗口改动后自动生效）
    const sync = () => {
      setEvents(loadEvents())
      applyTheme()
    }
    const poll = setInterval(sync, 3000)
    window.addEventListener('storage', sync)

    if (window.electronAPI?.onWidgetUpdateEvent) {
      window.electronAPI.onWidgetUpdateEvent(() => sync())
    }
    return () => {
      clearInterval(tick)
      clearInterval(poll)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const currentEvent = events.find((e) => e.id === currentEventId) || events[0] || null

  if (!currentEvent) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">D</div>
        <div className="widget-empty-text">请在主应用中添加事件</div>
      </div>
    )
  }

  const { number, label } = getDaysText(currentEvent)
  const typeText = currentEvent.type === 'countdown' ? '距离' : '已过'
  const timeRemaining = calculateTimeRemaining(currentEvent)

  const handleClose = async () => {
    if (window.electronAPI) await window.electronAPI.closeWidget()
  }

  /** 点击标题切换显示下一个事件 */
  const cycleEvent = () => {
    if (events.length <= 1) return
    const idx = events.findIndex((e) => e.id === currentEvent.id)
    const next = events[(idx + 1) % events.length]
    setCurrentEventId(next.id)
    window.electronAPI?.updateWidgetEvent(next.id)
  }

  return (
    <div className="widget" style={{ ['--accent-color' as any]: currentEvent.color }}>
      <div className="widget-header">
        <div className="widget-icon">◆</div>
        <div
          className="widget-title"
          onClick={cycleEvent}
          title={events.length > 1 ? '点击切换事件' : currentEvent.title}
        >
          {currentEvent.title}
          {events.length > 1 && <span className="cycle-hint">↻</span>}
        </div>
        <button className="widget-close" onClick={handleClose} title="关闭">✕</button>
      </div>

      <div className="widget-body">
        <div className="widget-days">
          <span className="days-number">{number}</span>
          {label && <span className="days-label">{label}</span>}
        </div>
        <div className="widget-meta">
          <span>{typeText}</span>
          <span>{formatDate(currentEvent.date)}</span>
          <span>{getWeekday(currentEvent.date)}</span>
        </div>
        {currentEvent.type === 'countdown' && (
          <div className="widget-time">{timeRemaining}</div>
        )}
        {currentEvent.note && <div className="widget-note">{currentEvent.note}</div>}
      </div>
    </div>
  )
}
