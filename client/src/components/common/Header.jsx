import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="6" r="2" fill="currentColor"/>
              <path d="M6 16l2-2M18 16l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-title">Cricket Fantasy</span>
            <span className="logo-subtitle">T20 World Cup</span>
          </div>
        </Link>

        <div className="header-right">
          {user && (
            <>
              <div className="header-points" onClick={() => navigate('/profile')}>
                <div className="points-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div className="points-info">
                  <span className="points-value">{user.virtualPoints?.toLocaleString() || '0'}</span>
                  <span className="points-label">Points</span>
                </div>
              </div>

              <div className="header-avatar" onClick={() => navigate('/profile')}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} />
                ) : (
                  <div className="avatar-placeholder">
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="avatar-status online"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
