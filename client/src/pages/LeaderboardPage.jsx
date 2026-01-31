import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { leaderboardService } from '../services/leaderboardService'
import { matchService } from '../services/matchService'
import { useAuth } from '../hooks/useAuth'
import Loading from '../components/common/Loading'

export default function LeaderboardPage() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const [tab, setTab] = useState('individual')
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        if (matchId) {
          const [matchRes, myRankRes] = await Promise.all([
            matchService.getMatch(matchId),
            leaderboardService.getMyRank(matchId)
          ])
          setMatch(matchRes.data?.data || matchRes.data)
          setMyRank(myRankRes.data?.data || myRankRes.data)
        }

        const leaderboardRes = matchId
          ? tab === 'individual'
            ? await leaderboardService.getIndividualMatchLeaderboard(matchId)
            : await leaderboardService.getTeamMatchLeaderboard(matchId)
          : await leaderboardService.getOverallIndividualLeaderboard()

        // Handle nested data structure
        const resData = leaderboardRes.data?.data || leaderboardRes.data
        setLeaderboard(resData?.entries || resData || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId, tab])

  const getRankClass = (rank) => {
    if (rank === 1) return 'top-1'
    if (rank === 2) return 'top-2'
    if (rank === 3) return 'top-3'
    return ''
  }

  return (
    <div className="leaderboard-page">
      <h1 className="mb-md">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
          <path d="M15.5 7.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z"/>
        </svg>
        Leaderboard
      </h1>

      {match && (
        <div className="match-header-card">
          <div className="match-header-teams">
            {match.team1?.name || match.team1} vs {match.team2?.name || match.team2}
          </div>
          <div className="match-header-status">{match.status}</div>
        </div>
      )}

      {/* My Rank Card */}
      {myRank && myRank.rank && (
        <div className="card mb-md">
          <div className="card-body">
            <div className="my-rank-card">
              <div>
                <div className="text-gray text-sm">Your Rank</div>
                <div className="my-rank-value">#{myRank.rank}</div>
              </div>
              <div className="text-right">
                <div className="text-gray text-sm">Total Points</div>
                <div className="my-points-value">{myRank.totalPoints || 0}</div>
              </div>
            </div>
            <div className="rank-breakdown mt-sm">
              <div className="rank-breakdown-item">
                <div className="rank-breakdown-value">{myRank.fantasyPoints || 0}</div>
                <div className="rank-breakdown-label">Fantasy</div>
              </div>
              <div className="rank-breakdown-item">
                <div className="rank-breakdown-value">{myRank.predictionPoints || 0}</div>
                <div className="rank-breakdown-label">Predictions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {matchId && (
        <div className="tabs">
          <button
            className={`tab ${tab === 'individual' ? 'active' : ''}`}
            onClick={() => setTab('individual')}
          >
            Individual
          </button>
          <button
            className={`tab ${tab === 'team' ? 'active' : ''}`}
            onClick={() => setTab('team')}
          >
            Team
          </button>
        </div>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <Loading />
      ) : (
        <div className="card">
          {leaderboard.length > 0 && (
            <div className="leaderboard-header">
              <div className="rank-col">Rank</div>
              <div className="name-col">{tab === 'team' ? 'Team' : 'Player'}</div>
              <div className="points-col">Points</div>
            </div>
          )}
          <div style={{ padding: 0 }}>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.userId || entry.teamId || index}
                  className={`leaderboard-row ${entry.userId === user?._id ? 'current-user' : ''}`}
                >
                  <div className={`leaderboard-rank ${getRankClass(entry.rank || index + 1)}`}>
                    {entry.rank || index + 1}
                  </div>
                  <div className="leaderboard-user">
                    <div className="leaderboard-name">
                      {entry.displayName || entry.teamName || entry.name || 'Unknown'}
                    </div>
                    {entry.teamName && entry.members && (
                      <div className="team-members text-gray">
                        {entry.members.map(m => m.displayName || m.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="leaderboard-points">
                    {entry.totalPoints || entry.points || 0}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {tab === 'team' ? (
                    <>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
                    </>
                  )}
                </svg>
                <p>{tab === 'team' ? 'No teams yet' : 'No entries yet'}</p>
                <span className="text-sm text-gray">
                  {tab === 'team'
                    ? 'Teams are formed when 4 users join the Team Competition queue'
                    : 'Create a fantasy team to participate'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .leaderboard-page h1 {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .leaderboard-page h1 svg {
          width: 24px;
          height: 24px;
          color: var(--primary);
        }
        .my-rank-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(79, 70, 229, 0.02) 100%);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
        }
        .my-rank-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.03em;
        }
        .my-points-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--success);
        }
        .rank-breakdown {
          padding-top: var(--spacing-sm);
          border-top: 1px solid var(--gray-200);
          display: flex;
          justify-content: space-around;
        }
        .rank-breakdown-item {
          text-align: center;
        }
        .rank-breakdown-value {
          font-weight: 700;
          font-size: 1rem;
          color: var(--gray-800);
        }
        .rank-breakdown-label {
          font-size: 0.7rem;
          color: var(--gray-500);
          text-transform: uppercase;
        }
        .leaderboard-row.current-user {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%);
          border-left: 3px solid var(--primary);
        }
        .team-members {
          margin-top: 2px;
          font-size: 0.75rem;
        }
        .leaderboard-header {
          display: flex;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--gray-50);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--gray-100);
        }
        .leaderboard-header .rank-col {
          width: 50px;
        }
        .leaderboard-header .name-col {
          flex: 1;
        }
        .leaderboard-header .points-col {
          width: 80px;
          text-align: right;
        }
        .match-header-card {
          background: var(--primary-gradient);
          color: white;
          padding: var(--spacing-md);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-md);
          text-align: center;
        }
        .match-header-teams {
          font-size: 1rem;
          font-weight: 700;
        }
        .match-header-status {
          font-size: 0.75rem;
          opacity: 0.9;
          margin-top: 4px;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  )
}
