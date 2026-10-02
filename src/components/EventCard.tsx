import { DaysEvent } from '@/types'
import { getDaysText, formatDate, getWeekday, calculateDays } from '@/utils/dateUtils'

interface Props {
  event: DaysEvent
  onEdit: (event: DaysEvent) => void
  onDelete: (id: string) => void
  onShowWidget: (event: DaysEvent) => void
}

export default function EventCard({ event, onEdit, onDelete, onShowWidget }: Props) {
  const { number, label } = getDaysText(event)
  const days = calculateDays(event)
  const typeClass = event.type === 'countdown' ? 'type-countdown' : 'type-countup'
  const typeLabel = event.type === 'countdown' ? '倒数' : '正值'

  return (
    <div className="event-card">
      <div className="color-indicator" style={{ backgroundColor: event.color }} />

      <div className="event-header">
        <span className="event-icon">{event.icon || '📅'}</span>
        <span className="event-title">{event.title}</span>
        <span className="event-badge" style={{ borderColor: event.color }}>
          {typeLabel}
        </span>
      </div>

      <div className={`event-days ${typeClass}`}>
        <span className="number" style={{ color: event.type === 'countdown' ? undefined : event.color }}>
          {number}
        </span>
        {label && <span className="label">{label}</span>}
      </div>

      <div className="event-date">
        📆 {formatDate(event.date)} · {getWeekday(event.date)}
        {event.repeat === 'yearly' && <span style={{ marginLeft: 8 }}>🔁 每年重复</span>}
      </div>

      {event.note && (
        <div className="event-date" style={{ marginTop: 4, fontStyle: 'italic' }}>
          💬 {event.note}
        </div>
      )}

      <div className="event-actions">
        <button className="btn btn-primary" onClick={() => onShowWidget(event)} title="显示桌面小组件">
          🖥️ 小组件
        </button>
        <button className="btn btn-secondary" onClick={() => onEdit(event)}>
          ✏️ 编辑
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(event.id)}>
          🗑️
        </button>
      </div>
    </div>
  )
}
