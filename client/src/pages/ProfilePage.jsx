import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="profile-page">
      <div className="card mb-md">
        <div className="card-body text-center">
          <div className="profile-avatar">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <h2 className="profile-name">{user?.displayName}</h2>
          <p className="text-gray">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="card mb-md">
        <div className="card-header">Statistics</div>
        <div className="card-body">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{user?.virtualPoints || 0}</div>
              <div className="stat-label">Virtual Points</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user?.stats?.matchesPlayed || 0}</div>
              <div className="stat-label">Matches Played</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user?.stats?.totalFantasyPoints || 0}</div>
              <div className="stat-label">Fantasy Points</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user?.stats?.bestRank || '-'}</div>
              <div className="stat-label">Best Rank</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user?.stats?.predictionsCorrect || 0}</div>
              <div className="stat-label">Correct Predictions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{user?.stats?.predictionsTotal || 0}</div>
              <div className="stat-label">Total Predictions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Rules */}
      <div className="card mb-md">
        <div className="card-header">Scoring Rules</div>
        <div className="card-body">
          <div className="rules-section">
            <h4>Batting</h4>
            <ul className="rules-list">
              <li>+1 per run</li>
              <li>+1 boundary bonus (4)</li>
              <li>+2 six bonus</li>
              <li>+8 half-century, +16 century</li>
              <li>Strike rate bonuses/penalties</li>
            </ul>
          </div>
          <div className="rules-section">
            <h4>Bowling</h4>
            <ul className="rules-list">
              <li>+25 per wicket</li>
              <li>+8 LBW/Bowled bonus</li>
              <li>Economy rate bonuses/penalties</li>
            </ul>
          </div>
          <div className="rules-section">
            <h4>Fielding</h4>
            <ul className="rules-list">
              <li>+8 catch</li>
              <li>+12 stumping, direct hit</li>
            </ul>
          </div>
          <div className="rules-section">
            <h4>Captain/Vice-Captain</h4>
            <ul className="rules-list">
              <li>Captain: 2x points</li>
              <li>Vice-Captain: 1.5x points</li>
            </ul>
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="btn btn-danger btn-block">
        Logout
      </button>

      <style>{`
        .profile-avatar {
          width: 80px;
          height: 80px;
          background: var(--primary);
          color: white;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 auto var(--spacing-md);
        }
        .profile-name {
          margin-bottom: var(--spacing-xs);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }
        .stat-item {
          text-align: center;
          padding: var(--spacing-sm);
          background: var(--gray-50);
          border-radius: var(--radius-md);
        }
        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--gray-500);
        }
        .rules-section {
          margin-bottom: var(--spacing-md);
        }
        .rules-section:last-child {
          margin-bottom: 0;
        }
        .rules-section h4 {
          font-size: 0.875rem;
          color: var(--primary);
          margin-bottom: var(--spacing-xs);
        }
        .rules-list {
          list-style: disc;
          padding-left: var(--spacing-lg);
          font-size: 0.875rem;
          color: var(--gray-600);
        }
        .rules-list li {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  )
}
