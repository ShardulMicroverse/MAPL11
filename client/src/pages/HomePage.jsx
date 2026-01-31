import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { matchService } from '../services/matchService'
import Loading from '../components/common/Loading'
import MatchCard from '../components/match/MatchCard'

export default function HomePage() {
  const { user } = useAuth()
  const [liveMatches, setLiveMatches] = useState([])
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Scorecard states
  const [showScorecards, setShowScorecards] = useState(false)
  const [scorecards, setScorecards] = useState([])
  const [loadingScorecards, setLoadingScorecards] = useState(false)
  const [selectedScorecard, setSelectedScorecard] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [liveRes, upcomingRes] = await Promise.all([
          matchService.getLiveMatches(),
          matchService.getUpcomingMatches()
        ])
        setLiveMatches(liveRes.data || [])
        setUpcomingMatches(upcomingRes.data || [])
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const fetchScorecards = async () => {
    setLoadingScorecards(true)
    try {
      const response = await matchService.getScorecards()
      setScorecards(response.data || [])
    } catch (error) {
      console.error('Error fetching scorecards:', error)
    } finally {
      setLoadingScorecards(false)
    }
  }

  const handleShowScorecards = () => {
    if (!showScorecards && scorecards.length === 0) {
      fetchScorecards()
    }
    setShowScorecards(!showScorecards)
    setSelectedScorecard(null)
  }

  const handleViewScorecard = async (scorecardId) => {
    setLoadingDetail(true)
    try {
      const response = await matchService.getScorecardById(scorecardId)
      setSelectedScorecard(response.data)
    } catch (error) {
      console.error('Error fetching scorecard detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCloseDetail = () => {
    setSelectedScorecard(null)
  }

  if (loading) {
    return <Loading fullScreen message="Loading matches" />
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="home-page">
      {/* Hero Welcome Section */}
      <div className="welcome-hero">
        <div className="welcome-content">
          <span className="welcome-greeting">{getGreeting()}</span>
          <h1 className="welcome-name">{user?.displayName || 'Champion'}</h1>
          <p className="welcome-subtitle">Ready to play fantasy cricket?</p>
        </div>
        <div className="welcome-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.displayName} />
          ) : (
            <div className="avatar-large">
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-value">{user?.virtualPoints?.toLocaleString() || '1,000'}</span>
            <span className="stat-label">Total Points</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12a4 4 0 0 0 8 0"/>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-value">{user?.stats?.matchesPlayed || 0}</span>
            <span className="stat-label">Matches</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <rect x="6" y="3" width="12" height="10" rx="2"/>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-value">#{user?.stats?.bestRank || '-'}</span>
            <span className="stat-label">Best Rank</span>
          </div>
        </div>
      </div>

      {/* Scorecards Section */}
      <section className="scorecards-section">
        <button 
          className={`scorecard-toggle-btn ${showScorecards ? 'active' : ''}`}
          onClick={handleShowScorecards}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6"/>
            <path d="M9 16h6"/>
          </svg>
          {showScorecards ? 'Hide Scorecards' : 'Show Available Scorecards'}
          <span className="scorecard-count">{scorecards.length || '•'}</span>
        </button>

        {showScorecards && (
          <div className="scorecards-container">
            {loadingScorecards ? (
              <div className="scorecard-loading">
                <Loading message="Loading scorecards..." />
              </div>
            ) : scorecards.length === 0 ? (
              <div className="no-scorecards">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                <p>No scorecards available yet</p>
                <span>Scorecards will appear here after matches are completed</span>
              </div>
            ) : (
              <div className="scorecards-grid">
                {scorecards.map(sc => (
                  <div 
                    key={sc._id} 
                    className="scorecard-card"
                    onClick={() => handleViewScorecard(sc._id)}
                  >
                    <div className="scorecard-header">
                      <div className="teams">
                        <span className="team">{sc.matchId?.team1?.shortName || sc.firstInnings?.battingTeam?.substring(0, 3)}</span>
                        <span className="vs">vs</span>
                        <span className="team">{sc.matchId?.team2?.shortName || sc.secondInnings?.battingTeam?.substring(0, 3)}</span>
                      </div>
                      <div className="match-date">
                        {sc.matchInfo?.date ? new Date(sc.matchInfo.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="scorecard-scores">
                      <div className="innings-score">
                        <span className="team-name">{sc.firstInnings?.battingTeam}</span>
                        <span className="score">{sc.firstInnings?.total?.runs}/{sc.firstInnings?.total?.wickets}</span>
                        <span className="overs">({sc.firstInnings?.total?.overs} ov)</span>
                      </div>
                      <div className="innings-score">
                        <span className="team-name">{sc.secondInnings?.battingTeam}</span>
                        <span className="score">{sc.secondInnings?.total?.runs}/{sc.secondInnings?.total?.wickets}</span>
                        <span className="overs">({sc.secondInnings?.total?.overs} ov)</span>
                      </div>
                    </div>

                    <div className="scorecard-result">
                      {sc.matchInfo?.result || 'Match completed'}
                    </div>

                    <div className="scorecard-footer">
                      <div className="quick-stats-row">
                        <span title="Most Sixes">6️⃣ {sc.computedStats?.mostSixes?.playerName?.split(' ').pop() || '-'}</span>
                        <span title="Most Wickets">🎳 {sc.computedStats?.mostWickets?.playerName?.split(' ').pop() || '-'}</span>
                        <span title="Fifties">💯 {sc.computedStats?.fiftiesCount || 0}</span>
                      </div>
                      <button className="view-detail-btn">
                        View Full Scorecard →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Scorecard Detail Modal */}
      {selectedScorecard && (
        <div className="scorecard-modal-overlay" onClick={handleCloseDetail}>
          <div className="scorecard-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseDetail}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {loadingDetail ? (
              <div className="modal-loading">
                <Loading message="Loading scorecard..." />
              </div>
            ) : (
              <div className="scorecard-detail">
                {/* Match Header */}
                <div className="detail-header">
                  <div className="match-title">
                    <h2>
                      {selectedScorecard.matchId?.team1?.name || selectedScorecard.firstInnings?.battingTeam}
                      <span className="vs-text">vs</span>
                      {selectedScorecard.matchId?.team2?.name || selectedScorecard.secondInnings?.battingTeam}
                    </h2>
                    <p className="match-info-text">
                      {selectedScorecard.matchInfo?.series} • {selectedScorecard.matchInfo?.matchNumber}
                    </p>
                    <p className="venue-text">
                      📍 {selectedScorecard.matchInfo?.venue}
                    </p>
                    <p className="date-text">
                      📅 {selectedScorecard.matchInfo?.date ? new Date(selectedScorecard.matchInfo.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="result-badge">
                    🏆 {selectedScorecard.matchInfo?.result}
                  </div>
                </div>

                {/* Toss Info */}
                {selectedScorecard.matchInfo?.toss && (
                  <div className="toss-info">
                    🪙 {selectedScorecard.matchInfo.toss}
                  </div>
                )}

                {/* First Innings */}
                <div className="innings-section">
                  <div className="innings-header">
                    <h3>{selectedScorecard.firstInnings?.battingTeam} - 1st Innings</h3>
                    <div className="innings-total">
                      {selectedScorecard.firstInnings?.total?.runs}/
                      {selectedScorecard.firstInnings?.total?.wickets}
                      <span className="overs-text">
                        ({selectedScorecard.firstInnings?.total?.overs} overs)
                      </span>
                    </div>
                  </div>

                  {/* Batting Table */}
                  <div className="table-container">
                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th className="player-col">Batter</th>
                          <th>R</th>
                          <th>B</th>
                          <th>4s</th>
                          <th>6s</th>
                          <th>SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScorecard.firstInnings?.batting?.map((bat, idx) => (
                          <tr key={idx} className={bat.runs >= 50 ? 'highlight-row' : ''}>
                            <td className="player-col">
                              <span className="player-name">{bat.playerName}</span>
                              <span className="dismissal">{bat.dismissal}</span>
                            </td>
                            <td className="runs-col">{bat.runs}</td>
                            <td>{bat.balls}</td>
                            <td>{bat.fours}</td>
                            <td>{bat.sixes}</td>
                            <td>{bat.strikeRate?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Extras */}
                  <div className="extras-row">
                    <span>Extras:</span>
                    <span>{selectedScorecard.firstInnings?.extras?.total} ({selectedScorecard.firstInnings?.extras?.details})</span>
                  </div>

                  {/* Bowling Table */}
                  <div className="table-container">
                    <h4>Bowling</h4>
                    <table className="scorecard-table bowling-table">
                      <thead>
                        <tr>
                          <th className="player-col">Bowler</th>
                          <th>O</th>
                          <th>M</th>
                          <th>R</th>
                          <th>W</th>
                          <th>Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScorecard.firstInnings?.bowling?.map((bowl, idx) => (
                          <tr key={idx} className={bowl.wickets >= 3 ? 'highlight-row' : ''}>
                            <td className="player-col">{bowl.playerName}</td>
                            <td>{bowl.overs}</td>
                            <td>{bowl.maidens}</td>
                            <td>{bowl.runs}</td>
                            <td className="wickets-col">{bowl.wickets}</td>
                            <td>{bowl.economy?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Second Innings */}
                <div className="innings-section">
                  <div className="innings-header">
                    <h3>{selectedScorecard.secondInnings?.battingTeam} - 2nd Innings</h3>
                    <div className="innings-total">
                      {selectedScorecard.secondInnings?.total?.runs}/
                      {selectedScorecard.secondInnings?.total?.wickets}
                      <span className="overs-text">
                        ({selectedScorecard.secondInnings?.total?.overs} overs)
                      </span>
                    </div>
                  </div>

                  {/* Batting Table */}
                  <div className="table-container">
                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th className="player-col">Batter</th>
                          <th>R</th>
                          <th>B</th>
                          <th>4s</th>
                          <th>6s</th>
                          <th>SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScorecard.secondInnings?.batting?.map((bat, idx) => (
                          <tr key={idx} className={bat.runs >= 50 ? 'highlight-row' : ''}>
                            <td className="player-col">
                              <span className="player-name">{bat.playerName}</span>
                              <span className="dismissal">{bat.dismissal}</span>
                            </td>
                            <td className="runs-col">{bat.runs}</td>
                            <td>{bat.balls}</td>
                            <td>{bat.fours}</td>
                            <td>{bat.sixes}</td>
                            <td>{bat.strikeRate?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Extras */}
                  <div className="extras-row">
                    <span>Extras:</span>
                    <span>{selectedScorecard.secondInnings?.extras?.total} ({selectedScorecard.secondInnings?.extras?.details})</span>
                  </div>

                  {/* Bowling Table */}
                  <div className="table-container">
                    <h4>Bowling</h4>
                    <table className="scorecard-table bowling-table">
                      <thead>
                        <tr>
                          <th className="player-col">Bowler</th>
                          <th>O</th>
                          <th>M</th>
                          <th>R</th>
                          <th>W</th>
                          <th>Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScorecard.secondInnings?.bowling?.map((bowl, idx) => (
                          <tr key={idx} className={bowl.wickets >= 3 ? 'highlight-row' : ''}>
                            <td className="player-col">{bowl.playerName}</td>
                            <td>{bowl.overs}</td>
                            <td>{bowl.maidens}</td>
                            <td>{bowl.runs}</td>
                            <td className="wickets-col">{bowl.wickets}</td>
                            <td>{bowl.economy?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Match Stats Summary */}
                <div className="stats-summary">
                  <h4>Match Highlights</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-icon">🏏</span>
                      <span className="stat-label">Total Runs</span>
                      <span className="stat-value">{selectedScorecard.computedStats?.totalMatchScore}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">6️⃣</span>
                      <span className="stat-label">Most Sixes</span>
                      <span className="stat-value">
                        {selectedScorecard.computedStats?.mostSixes?.playerName || '-'}
                        {selectedScorecard.computedStats?.mostSixes?.count > 0 && 
                          ` (${selectedScorecard.computedStats.mostSixes.count})`}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">4️⃣</span>
                      <span className="stat-label">Most Fours</span>
                      <span className="stat-value">
                        {selectedScorecard.computedStats?.mostFours?.playerName || '-'}
                        {selectedScorecard.computedStats?.mostFours?.count > 0 && 
                          ` (${selectedScorecard.computedStats.mostFours.count})`}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">🎳</span>
                      <span className="stat-label">Most Wickets</span>
                      <span className="stat-value">
                        {selectedScorecard.computedStats?.mostWickets?.playerName || '-'}
                        {selectedScorecard.computedStats?.mostWickets?.count > 0 && 
                          ` (${selectedScorecard.computedStats.mostWickets.count})`}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">💯</span>
                      <span className="stat-label">Fifties</span>
                      <span className="stat-value">{selectedScorecard.computedStats?.fiftiesCount || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⭐</span>
                      <span className="stat-label">Player of Match</span>
                      <span className="stat-value">{selectedScorecard.matchInfo?.playerOfTheMatch || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="matches-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </span>
              Matches
            </h3>
          </div>
          <div className="matches-list">
            {liveMatches.map(match => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      <section className="matches-section">
        <div className="section-header">
          <h3 className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Upcoming Matches
          </h3>
          {upcomingMatches.length > 3 && (
            <Link to="/matches" className="see-all-link">
              See All
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          )}
        </div>

        {upcomingMatches.length > 0 ? (
          <div className="matches-list">
            {upcomingMatches.slice(0, 3).map(match => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No upcoming matches scheduled</p>
            <span>Check back later for new matches</span>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <Link to="/matches" className="action-card">
          <div className="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12a4 4 0 0 0 8 0"/>
              <circle cx="12" cy="6" r="1.5"/>
            </svg>
          </div>
          <span>All Matches</span>
        </Link>

        <Link to="/leaderboard" className="action-card">
          <div className="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 21V11"/>
              <path d="M12 21V7"/>
              <path d="M16 21V13"/>
              <circle cx="12" cy="4" r="2"/>
            </svg>
          </div>
          <span>Leaderboard</span>
        </Link>

        <Link to="/profile" className="action-card">
          <div className="action-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span>My Profile</span>
        </Link>
      </section>

      {/* Scorecard Styles */}
      <style>{`
        /* Scorecard Toggle Button */
        .scorecards-section {
          margin: var(--spacing-lg) 0;
        }

        .scorecard-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .scorecard-toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .scorecard-toggle-btn.active {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        .scorecard-toggle-btn svg {
          width: 24px;
          height: 24px;
        }

        .scorecard-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
        }

        /* Scorecards Container */
        .scorecards-container {
          margin-top: var(--spacing-md);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scorecard-loading,
        .no-scorecards {
          text-align: center;
          padding: var(--spacing-xl);
          background: var(--gray-50);
          border-radius: var(--radius-lg);
        }

        .no-scorecards svg {
          width: 48px;
          height: 48px;
          stroke: var(--gray-400);
          margin-bottom: var(--spacing-sm);
        }

        .no-scorecards p {
          margin: 0;
          font-weight: 600;
          color: var(--gray-600);
        }

        .no-scorecards span {
          font-size: 0.85rem;
          color: var(--gray-500);
        }

        /* Scorecards Grid */
        .scorecards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .scorecard-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid var(--gray-200);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .scorecard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: var(--primary);
        }

        .scorecard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-sm);
        }

        .scorecard-header .teams {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .scorecard-header .team {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--gray-800);
        }

        .scorecard-header .vs {
          font-size: 0.75rem;
          color: var(--gray-500);
          font-weight: 400;
        }

        .scorecard-header .match-date {
          font-size: 0.75rem;
          color: var(--gray-500);
          background: var(--gray-100);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
        }

        .scorecard-scores {
          background: var(--gray-50);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
        }

        .innings-score {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: 4px 0;
        }

        .innings-score .team-name {
          flex: 1;
          font-size: 0.85rem;
          color: var(--gray-600);
        }

        .innings-score .score {
          font-weight: 700;
          color: var(--gray-800);
        }

        .innings-score .overs {
          font-size: 0.75rem;
          color: var(--gray-500);
        }

        .scorecard-result {
          font-size: 0.85rem;
          color: var(--success);
          font-weight: 600;
          padding: var(--spacing-xs) 0;
          border-top: 1px solid var(--gray-100);
          border-bottom: 1px solid var(--gray-100);
          margin-bottom: var(--spacing-sm);
        }

        .scorecard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .quick-stats-row {
          display: flex;
          gap: var(--spacing-sm);
          font-size: 0.75rem;
          color: var(--gray-600);
        }

        .view-detail-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: background 0.2s;
        }

        .view-detail-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        /* Modal Styles */
        .scorecard-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-md);
          backdrop-filter: blur(4px);
        }

        .scorecard-modal {
          background: white;
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: modalSlide 0.3s ease;
        }

        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-close {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          background: var(--gray-100);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .modal-close:hover {
          background: var(--gray-200);
          transform: rotate(90deg);
        }

        .modal-close svg {
          width: 20px;
          height: 20px;
        }

        .modal-loading {
          padding: var(--spacing-xl);
        }

        .scorecard-detail {
          padding: var(--spacing-lg);
        }

        /* Detail Header */
        .detail-header {
          text-align: center;
          padding-bottom: var(--spacing-md);
          border-bottom: 2px solid var(--gray-100);
          margin-bottom: var(--spacing-md);
        }

        .detail-header h2 {
          font-size: 1.5rem;
          margin: 0 0 var(--spacing-xs) 0;
        }

        .vs-text {
          font-size: 0.85rem;
          font-weight: 400;
          color: var(--gray-500);
          margin: 0 var(--spacing-sm);
        }

        .match-info-text {
          font-size: 0.9rem;
          color: var(--gray-600);
          margin: var(--spacing-xs) 0;
        }

        .venue-text,
        .date-text {
          font-size: 0.85rem;
          color: var(--gray-500);
          margin: 2px 0;
        }

        .result-badge {
          display: inline-block;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.9rem;
          margin-top: var(--spacing-sm);
        }

        .toss-info {
          background: var(--gray-50);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          text-align: center;
          font-size: 0.85rem;
          color: var(--gray-600);
          margin-bottom: var(--spacing-md);
        }

        /* Innings Section */
        .innings-section {
          margin-bottom: var(--spacing-lg);
          background: var(--gray-50);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
        }

        .innings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-sm);
          border-bottom: 2px solid var(--primary);
        }

        .innings-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--gray-800);
        }

        .innings-total {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
        }

        .overs-text {
          font-size: 0.85rem;
          font-weight: 400;
          color: var(--gray-600);
          margin-left: var(--spacing-xs);
        }

        /* Tables */
        .table-container {
          overflow-x: auto;
          margin-bottom: var(--spacing-md);
        }

        .table-container h4 {
          margin: var(--spacing-md) 0 var(--spacing-sm) 0;
          font-size: 0.9rem;
          color: var(--gray-600);
        }

        .scorecard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .scorecard-table th {
          background: var(--gray-100);
          padding: var(--spacing-sm);
          text-align: center;
          font-weight: 600;
          color: var(--gray-600);
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .scorecard-table td {
          padding: var(--spacing-sm);
          text-align: center;
          border-bottom: 1px solid var(--gray-100);
        }

        .scorecard-table .player-col {
          text-align: left;
          min-width: 150px;
        }

        .scorecard-table .player-name {
          display: block;
          font-weight: 600;
          color: var(--gray-800);
        }

        .scorecard-table .dismissal {
          display: block;
          font-size: 0.75rem;
          color: var(--gray-500);
          font-style: italic;
        }

        .scorecard-table .runs-col {
          font-weight: 700;
          color: var(--gray-800);
        }

        .scorecard-table .wickets-col {
          font-weight: 700;
          color: var(--primary);
        }

        .scorecard-table .highlight-row {
          background: rgba(102, 126, 234, 0.08);
        }

        .scorecard-table .highlight-row .runs-col,
        .scorecard-table .highlight-row .wickets-col {
          color: var(--primary);
        }

        .extras-row {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm);
          background: white;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: var(--gray-600);
          margin-bottom: var(--spacing-sm);
        }

        /* Stats Summary */
        .stats-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          color: white;
        }

        .stats-summary h4 {
          margin: 0 0 var(--spacing-md) 0;
          text-align: center;
          font-size: 1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-sm);
        }

        .stat-item {
          text-align: center;
          padding: var(--spacing-sm);
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
        }

        .stat-item .stat-icon {
          font-size: 1.25rem;
          display: block;
          margin-bottom: 4px;
        }

        .stat-item .stat-label {
          display: block;
          font-size: 0.7rem;
          opacity: 0.8;
          margin-bottom: 2px;
        }

        .stat-item .stat-value {
          display: block;
          font-weight: 600;
          font-size: 0.85rem;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .scorecards-grid {
            grid-template-columns: 1fr;
          }

          .scorecard-modal {
            max-height: 95vh;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          }

          .scorecard-detail {
            padding: var(--spacing-md);
          }

          .innings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .scorecard-table {
            font-size: 0.75rem;
          }

          .scorecard-table th,
          .scorecard-table td {
            padding: var(--spacing-xs);
          }

          .scorecard-table .player-col {
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  )
}