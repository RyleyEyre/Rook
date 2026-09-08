import { cn } from '@shared/utils/cn.js'
import './Tabs.css'

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          // tabs__tab is targeted by shared/styles/global-icon-triggers.css
          // to nudge a tab's icon on hover (none currently render one, but
          // the hook stays available for any that do).
          className={cn('tabs__tab', value === t.value && 'is-active')}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
