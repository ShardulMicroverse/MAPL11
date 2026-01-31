import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { matchService } from '../services/matchService'
import { fantasyService } from '../services/fantasyService'
import { teamService } from '../services/teamService'
import { useMatchSocket } from '../hooks/useSocket'
import { useToast } from '../hooks/useToast'
import Loading from '../components/common/Loading'
import TeamLineup from '../components/fantasy/TeamLineup'

export default function MatchDetailPage() {
  const { matchId } = useParams()
  const [match, setMatch] = useState(null)
  const [fantasyTeam, setFantasyTeam] = useState(null)
  const [teamStatus, setTeamStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLineup, setShowLineup] = useState(false)
  const { success, error: showError } = useToast()

  // Socket handlers for live updates
  useMatchSocket(matchId, {
    onScoreUpdate: (data) => {
      if (data.matchId === matchId) {
        setMatch(prev => ({ ...prev, liveData: data.liveData }))
      }
    },
    onTeamMatched: (data) => {
      if (data.matchId === matchId) {
        setTeamStatus({ status: 'matched', team: data })
        success('You have been matched with a team!')
      }
    },
    onMatchLocked: (data) => {
      if (data.matchId === matchId) {
        setMatch(prev => ({ ...prev, isTeamSelectionOpen: false }))
      }
    }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchRes, fantasyRes, teamStatusRes] = await Promise.all([
          matchService.getMatch(matchId),
          fantasyService.getFantasyTeam(matchId),
          teamService.getQueueStatus(matchId)
        ])
        setMatch(matchRes.data)
        setFantasyTeam(fantasyRes.data)
        setTeamStatus(teamStatusRes.data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [matchId])

  const handleJoinQueue = async () => {
    try {
      const result = await teamService.joinQueue(matchId)
      setTeamStatus(result.data)
      if (result.data.matched) {
        success('Matched with a team!')
      } else {
        success('Joined the queue!')
      }
    } catch (err) {
      showError(err.message)
    }
  }

  if (loading) return <Loading />
  if (!match) return <div className="empty-state">Match not found</div>

  const isUpcoming = match.status === 'upcoming'
  const isLive = match.status === 'live'
  const canCreateTeam = isUpcoming && match.isTeamSelectionOpen

  return (
    <div className="match-detail-page">
      {/* Match Header */}
      <div className="card mb-md">
        <div className="card-body">
          <div className="match-teams">
            <div className="match-team">
              <div className="match-team-logo">{match.team1.shortName}</div>
              <div className="match-team-name">{match.team1.name}</div>
              {match.result?.team1Score && (
                <div className="match-score font-bold">{match.result.team1Score}</div>
              )}
            </div>

            <div className="match-vs">
              <span className={`match-status ${match.status}`}>
                {match.status.toUpperCase()}
              </span>
            </div>

            <div className="match-team">
              <div className="match-team-logo">{match.team2.shortName}</div>
              <div className="match-team-name">{match.team2.name}</div>
              {match.result?.team2Score && (
                <div className="match-score font-bold">{match.result.team2Score}</div>
              )}
            </div>
          </div>

          {isLive && match.liveData && (
            <div className="live-score text-center mt-md">
              <div className="text-danger font-bold text-lg">
                {match.liveData.currentScore}
              </div>
              <div className="text-gray text-sm">
                {match.liveData.currentOver} overs
              </div>
            </div>
          )}

          <div className="match-info mt-md">
            <div className="text-gray text-sm">{match.venue}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {canCreateTeam && (
        <div className="card mb-md">
          <div className="card-body">
            <h3 className="mb-md">Create Your Team</h3>

            {/* Fantasy Team Status */}
            {fantasyTeam ? (
              <>
                <div className="status-box success mb-sm">
                  <span>Fantasy team created ({fantasyTeam.players?.length || 0} players)</span>
                </div>
                <div className="team-actions mb-md">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowLineup(true)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <ellipse cx="12" cy="12" rx="3" ry="8"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                    </svg>
                    View My Team
                  </button>
                  <Link to={`/match/${matchId}/team-builder`} className="btn btn-secondary">
                    Edit Team
                  </Link>
                </div>
              </>
            ) : (
              <Link to={`/match/${matchId}/team-builder`} className="btn btn-primary btn-block mb-md">
                Create Fantasy Team
              </Link>
            )}

            {/* Predictions */}
            <Link to={`/match/${matchId}/predictions`} className="btn btn-secondary btn-block mb-md">
              Make Predictions
            </Link>

            {/* Auto-Match Queue */}
            {fantasyTeam && (
              <div className="mt-md">
                <h4 className="mb-sm">Team Competition</h4>
                {teamStatus?.status === 'matched' ? (
                  <div className="status-box success">
                    <span>Matched: {teamStatus.team?.teamName}</span>
                    <Link to={`/match/${matchId}/my-team`} className="btn btn-primary btn-sm">
                      View Team
                    </Link>
                  </div>
                ) : teamStatus?.status === 'waiting' ? (
                  <div className="status-box warning">
                    <span>In queue ({teamStatus.position} / waiting for {teamStatus.needMore} more)</span>
                  </div>
                ) : (
                  <button onClick={handleJoinQueue} className="btn btn-success btn-block">
                    Join Team Competition
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Link */}
      <Link to={`/leaderboard/${matchId}`} className="btn btn-secondary btn-block">
        View Leaderboard
      </Link>

      {/* Team Lineup Modal */}
      {showLineup && fantasyTeam && (
        <TeamLineup
          players={fantasyTeam.players?.map(p => p.playerId) || []}
          captain={fantasyTeam.players?.find(p => p.isCaptain)?.playerId?._id}
          viceCaptain={fantasyTeam.players?.find(p => p.isViceCaptain)?.playerId?._id}
          onClose={() => setShowLineup(false)}
        />
      )}

      <style>{`
        .status-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
        }
        .status-box.success {
          background: rgba(22, 163, 74, 0.1);
          color: var(--success);
        }
        .status-box.warning {
          background: rgba(217, 119, 6, 0.1);
          color: var(--warning);
        }
        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 0.75rem;
        }
        .live-score {
          padding: var(--spacing-md);
          background: var(--gray-50);
          border-radius: var(--radius-md);
        }
        .text-lg {
          font-size: 1.25rem;
        }
        .team-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        .team-actions .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
        }
      `}</style>
    </div>
  )
}
