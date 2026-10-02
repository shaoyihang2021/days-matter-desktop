import { useState, useEffect } from 'react'
import { DaysEvent } from '@/types'
import { getDaysText, formatDate, calculateTimeRemaining } from '@/utils/dateUtils'

const EVENTS_KEY = 'days-matter-events'

function loadEvents(): DaysEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export default function Widget() {
  const [events, setEvents] = useState<DaysEvent[]>(loadEvents())
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const [opacity, setOpacity] = useState(0.92)
  const [showSettings, setShowSettings] = useState(false)
  const [clickThrough, setClickThrough] = useState(false)

  // 每秒更新时间
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 监听主进程的事件更新
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onWidgetUpdateEvent((eventId: string) => {
        setCurrentEventId(eventId)
        // 重新加载事件
        setEvents(loadEvents())
      })
    }

    // 定时检查事件变化
    const checkInterval = setInterval(() => {
      setEvents(loadEvents())
    }, 5000)

    return () => clearInterval(checkInterval)
  }, [])

  // 如果没有指定事件，显示第一个
  const currentEvent =
    events.find((e) => e.id === currentEventId) ||
    events[0] ||
    null

  if (!currentEvent) {
    return (
      <div className="widget-empty">
        <div className="widget-empty-icon">⏳</div>
        <div className="widget-empty-text">请在主应用中添加事件</div>
      </div>
    )
  }

  const { number, label } = getDaysText(currentEvent)
  const typeText = currentEvent.type === 'countdown' ? '距离' : '已过'
  const timeRemaining = calculateTimeRemaining(currentEvent)

  const handleToggleClickThrough = async () => {
    const newValue = !clickThrough
    setClickThrough(newValue)
    if (window.electronAPI) {
      await window.electronAPI.setWidgetClickThrough(newValue)
    }
  }

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeWidget()
    }
  }

  // 切换显示下一个事件
  const cycleEvent = () => {
    if (events.length <= 1) return
    const idx = events.findIndex((e) => e.id === currentEvent.id)
    const next = events[(idx + 1) % events.length]
    setCurrentEventId(next.id)
    if (window.electronAPI) {
      window.electronAPI.updateWidgetEvent(next.id)
    }
  }

  return (
    <div
      className="widget"
      style={{
        opacity: clickThrough ? 0.85 : opacity,
        '--accent-color': currentEvent.color,
      } as React.CSSProperties}
    >
      {/* 可拖拽区域（通过 CSS -webkit-app-region: drag 实现） */}
      <div className="widget-header drag-area">
        <span className="widget-icon">{currentEvent.icon || '📅'}</span>
        <div className="widget-title" onClick={cycleEvent} title="点击切换事件">
          {currentEvent.title}
          {events.length > 1 && <span className="cycle-hint"> ↻</span>}
        </div>
        {!clickThrough && (
          <div className="widget-controls no-drag">
            <button
              className="ctrl-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="设置"
            >
              ⚙️
            </button>
            <button className="ctrl-btn" onClick={handleClose} title="关闭">
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="widget-body">
        <div className="widget-days">
          <span className="days-number">{number}</span>
          {label && <span className="days-label">{label}</span>}
        </div>
        <div className="widget-meta">
          <span>{typeText}</span>
          <span>{formatDate(currentEvent.date)}</span>
        </div>

        {currentEvent.type === 'countdown' && (
          <div className="widget-time">{timeRemaining}</div>
        )}
      </div>

      {/* 设置弹窗 */}
      {showSettings && !clickThrough && (
        <div className="widget-settings no-drag">
          <div className="setting-row">
            <span>点击穿透</span>
            <div
              className={`mini-toggle ${clickThrough ? 'on' : ''}`}
              onClick={handleToggleClickThrough}
            />
          </div>
          <div className="setting-row">
            <span>透明度</span>
            <input
              type="range"
              min="40"
              max="100"
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
              style={{ width: 80 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
