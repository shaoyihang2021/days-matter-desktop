import { AppSettings } from '@/types'

interface Props {
  settings: AppSettings
  onUpdate: (updates: Partial<AppSettings>) => void
}

const COLORS = [
  '#E17055', '#FDCB6E', '#00B894', '#0984E3', '#6C5CE7',
  '#FD79A8', '#00CEC9', '#A29BFE',
]

export default function SettingsPanel({ settings, onUpdate }: Props) {
  const handleLaunchAtLogin = async () => {
    // 在 Electron 环境下可以调用 app.setLoginItemSettings
    // 这里简化处理
    onUpdate({ launchAtLogin: !settings.launchAtLogin })
  }

  return (
    <div className="settings-panel">
      <div className="setting-item">
        <h3>🖥️ 桌面小组件透明度</h3>
        <p>调整桌面小组件的背景透明度</p>
        <div className="setting-control">
          <input
            type="range"
            min="30"
            max="100"
            value={settings.widgetOpacity}
            onChange={(e) => onUpdate({ widgetOpacity: parseInt(e.target.value) })}
          />
          <span className="value-display">{settings.widgetOpacity}%</span>
        </div>
      </div>

      <div className="setting-item">
        <h3>🎨 默认颜色</h3>
        <p>新事件将使用此颜色</p>
        <div className="setting-control">
          <div className="color-picker-row" style={{ marginBottom: 0 }}>
            {COLORS.map((c) => (
              <div
                key={c}
                className={`color-swatch ${settings.defaultColor === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => onUpdate({ defaultColor: c })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="setting-item">
        <h3>🔢 显示详细时间</h3>
        <p>当不足一天时，显示时:分:秒</p>
        <div className="setting-control">
          <div
            className={`toggle-switch ${settings.showSecondaryInfo ? 'on' : ''}`}
            onClick={() => onUpdate({ showSecondaryInfo: !settings.showSecondaryInfo })}
          />
        </div>
      </div>

      <div className="setting-item">
        <h3>🚀 开机自启动</h3>
        <p>电脑开机时自动启动本应用</p>
        <div className="setting-control">
          <div
            className={`toggle-switch ${settings.launchAtLogin ? 'on' : ''}`}
            onClick={handleLaunchAtLogin}
          />
        </div>
      </div>

      <div className="setting-item">
        <h3>ℹ️ 关于</h3>
        <p>Days Matter Desktop - 电脑版倒数日</p>
        <p style={{ marginTop: 4, color: 'rgba(232,232,240,0.4)' }}>
          v0.1.0 · 基于 Electron + React 构建
        </p>
      </div>
    </div>
  )
}
