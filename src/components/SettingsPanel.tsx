import { AppSettings } from '@/types'

interface Props {
  settings: AppSettings
  onUpdate: (updates: Partial<AppSettings>) => void
}

const COLORS = [
  '#FF6B6B', '#FF9F0A', '#FFD60A', '#30D158',
  '#64D2FF', '#5E5CE6', '#BF5AF2', '#FF2D55',
]

const THEMES = [
  { key: 'auto' as const,  label: '跟随', icon: '⌁' },
  { key: 'light' as const, label: '浅色', icon: '☀︎' },
  { key: 'dark' as const,  label: '深色', icon: '☾' },
]

export default function SettingsPanel({ settings, onUpdate }: Props) {
  return (
    <div className="settings-panel">

      <div className="setting-item">
        <h3>外观主题</h3>
        <p>选择界面颜色模式</p>
        <div className="theme-selector">
          {THEMES.map(t => (
            <button key={t.key}
              className={`theme-option ${settings.theme === t.key ? 'active' : ''}`}
              onClick={() => onUpdate({ theme: t.key })}
              title={t.label}>{t.icon}</button>
          ))}
        </div>
      </div>

      <div className="setting-item">
        <h3>事件颜色</h3>
        <p>新事件将使用此颜色</p>
        <div className="color-picker-row">
          {COLORS.map(c => (
            <div key={c}
              className={`color-swatch ${settings.defaultColor === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => onUpdate({ defaultColor: c })} />
          ))}
        </div>
      </div>

      <div className="setting-item">
        <h3>小组件透明度</h3>
        <p>桌面小组件的背景透明度</p>
        <div className="setting-control">
          <input type="range" min="30" max="100" value={settings.widgetOpacity}
            onChange={e => onUpdate({ widgetOpacity: parseInt(e.target.value) })} />
          <span className="value-display">{settings.widgetOpacity}%</span>
        </div>
      </div>

      <div className="setting-item">
        <h3>详细时间</h3>
        <p>不足一天时显示时:分:秒</p>
        <div className="setting-control">
          <div className={`toggle-switch ${settings.showSecondaryInfo ? 'on' : ''}`}
            onClick={() => onUpdate({ showSecondaryInfo: !settings.showSecondaryInfo })} />
        </div>
      </div>

      <div className="setting-item">
        <h3>开机自启动</h3>
        <p>电脑开机时自动启动应用</p>
        <div className="setting-control">
          <div className={`toggle-switch ${settings.launchAtLogin ? 'on' : ''}`}
            onClick={() => onUpdate({ launchAtLogin: !settings.launchAtLogin })} />
        </div>
      </div>

      <div className="setting-item" style={{ gridColumn: '1 / -1' }}>
        <h3>安装路径</h3>
        <p>安装新版本时，安装向导将允许您自定义安装路径。默认安装到系统应用程序目录。</p>
      </div>

      <div className="setting-item">
        <h3>关于</h3>
        <p>倒数日 · Days Matter Desktop v0.2.0</p>
      </div>

    </div>
  )
}
