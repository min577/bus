import { NavLink } from 'react-router-dom'

const BusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z" />
    <path d="M4 11h16" />
    <path d="M8 18v2M16 18v2" />
    <path d="M8 14.5h.01M16 14.5h.01" strokeWidth="2.4" />
  </svg>
)

const ChartIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 20v-7M12 20V5M19 20v-10" />
  </svg>
)

const RouteIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h6a4 4 0 0 0 4-4v-1M16 5h-6a4 4 0 0 0-4 4v1" />
  </svg>
)

const tabs = [
  { to: '/', icon: BusIcon, label: '실시간' },
  { to: '/pattern', icon: ChartIcon, label: '탑승 패턴' },
  { to: '/compare', icon: RouteIcon, label: '동선 비교' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}>
          {t.icon}
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
