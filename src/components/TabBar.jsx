import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', icon: '🚌', label: '실시간' },
  { to: '/pattern', icon: '📊', label: '탑승 패턴' },
  { to: '/compare', icon: '🔀', label: '동선 비교' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}>
          <span className="tab-icon" aria-hidden>{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
