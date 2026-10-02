import { useState, useEffect, useCallback } from 'react'
import { DaysEvent, AppSettings, DEFAULT_SETTINGS, DEFAULT_EVENTS } from '@/types'
import { generateId } from '@/utils/dateUtils'

// 使用 localStorage 做持久化（简单跨环境方案）
const EVENTS_KEY = 'days-matter-events'
const SETTINGS_KEY = 'days-matter-settings'

function loadEvents(): DaysEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS))
  return DEFAULT_EVENTS
}

function saveEvents(events: DaysEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function useEvents() {
  const [events, setEvents] = useState<DaysEvent[]>(loadEvents())

  useEffect(() => {
    saveEvents(events)
  }, [events])

  const addEvent = useCallback(
    (event: Omit<DaysEvent, 'id' | 'createdAt'>) => {
      const newEvent: DaysEvent = {
        ...event,
        id: generateId(),
        createdAt: Date.now(),
      }
      setEvents((prev) => [newEvent, ...prev])
      return newEvent
    },
    []
  )

  const updateEvent = useCallback(
    (id: string, updates: Partial<DaysEvent>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      )
    },
    []
  )

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { events, addEvent, updateEvent, deleteEvent }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings())

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  return { settings, updateSettings }
}
