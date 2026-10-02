import { useState } from 'react'
import { DaysEvent } from '@/types'
import { useEvents, useSettings } from '@/hooks/useEvents'
import EventCard from '@/components/EventCard'
import EventForm from '@/components/EventForm'
import SettingsPanel from '@/components/SettingsPanel'
import './App.css'

type Tab = 'events' | 'settings'

export default function App() {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { settings, updateSettings } = useSettings()
  const [tab, setTab] = useState<Tab>('events')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DaysEvent | null>(null)

  const handleAdd = () => {
    setEditingEvent(null)
    setShowForm(true)
  }

  const handleEdit = (event: DaysEvent) => {
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleSubmit = (data: Omit<DaysEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data)
    } else {
      addEvent(data)
    }
    setShowForm(false)
    setEditingEvent(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个事件吗？')) {
      deleteEvent(id)
    }
  }

  const handleShowWidget = async (event: DaysEvent) => {
    if (window.electronAPI) {
      await window.electronAPI.toggleWidget(true, event.id)
    } else {
      alert('请在 Electron 环境中运行以使用桌面小组件功能')
    }
  }

  return (
    <div className="app">
      {/* 标题栏 */}
      <header className="app-header">
        <div className="app-title">
          <span className="logo">⏳</span>
          <span>Days Matter Desktop</span>
        </div>
        <div className="app-actions">
          <button className="btn btn-primary" onClick={handleAdd}>
            + 添加事件
          </button>
        </div>
      </header>

      {/* Tab 切换 */}
      <nav className="app-tabs">
        <button
          className={`tab-btn ${tab === 'events' ? 'active' : ''}`}
          onClick={() => setTab('events')}
        >
          📅 事件列表 ({events.length})
        </button>
        <button
          className={`tab-btn ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          ⚙️ 设置
        </button>
      </nav>

      {/* 主内容 */}
      <main className="app-main">
        {tab === 'events' && (
          <div className="events-grid">
            {events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>还没有事件，点击上方按钮添加吧！</p>
              </div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShowWidget={handleShowWidget}
                />
              ))
            )}
          </div>
        )}

        {tab === 'settings' && (
          <SettingsPanel settings={settings} onUpdate={updateSettings} />
        )}
      </main>

      {/* 添加/编辑弹窗 */}
      {showForm && (
        <EventForm
          initialEvent={editingEvent}
          defaultColor={settings.defaultColor}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}
