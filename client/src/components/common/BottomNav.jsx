import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  // Don't show nav on login/register pages
  if (!user || ['/login', '/register'].includes(location.pathname)) {
    return null
  }

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      activeIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      )
    },
    {
      to: '/matches',
      label: 'Matches',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12a4 4 0 0 0 8 0" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
        </svg>
      ),
      activeIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12a4 4 0 0 0 8 0" fill="var(--bg-primary)"/>
          <circle cx="12" cy="6" r="2" fill="var(--bg-primary)"/>
        </svg>
      )
    },
    {
      to: '/leaderboard',
      label: 'Ranks',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 21V11" strokeLinecap="round"/>
          <path d="M12 21V7" strokeLinecap="round"/>
          <path d="M16 21V13" strokeLinecap="round"/>
          <circle cx="12" cy="4" r="2" fill="currentColor"/>
        </svg>
      ),
      activeIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="11" width="4" height="10" rx="1"/>
          <rect x="10" y="7" width="4" height="14" rx="1"/>
          <rect x="14" y="13" width="4" height="8" rx="1"/>
          <circle cx="12" cy="4" r="2"/>
        </svg>
      )
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      activeIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="nav-icon">
                {isActive ? item.activeIcon : item.icon}
              </div>
              <span className="nav-label">{item.label}</span>
              {isActive && <div className="nav-indicator"></div>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
