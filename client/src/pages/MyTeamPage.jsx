import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { teamService } from '../services/teamService'
import { matchService } from '../services/matchService'
import Loading from '../components/common/Loading'

export default function MyTeamPage() {
  const { matchId } = useParams()
  const [team, setTeam] = useState(null)
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamRes, matchRes] = await Promise.all([
          teamService.getMyTeam(matchId),
          matchService.getMatch(matchId)
        ])
        setTeam(teamRes.data)
        setMatch(matchRes.data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  if (loading) return <Loading />

  if (!team) {
    return (
      <div className="empty-state">
        <p>You haven't been matched to a team yet</p>
        <Link to={`/match/${matchId}`} className="btn btn-primary mt-md">
          Go Back
        </Link>
      </div>
    )
  }

  return (
    <div className="my-team-page">
      <div className="card mb-md">
        <div className="card-body text-center">
          <h2 className="team-name">{team.teamName}</h2>
          <p className="text-gray">
            {match?.team1.shortName} vs {match?.team2.shortName}
          </p>
          <div className="team-points mt-md">
            <span className="points-value">{team.totalPoints}</span>
            <span className="points-label">Total Points</span>
          </div>
          {team.rank && (
            <div className="team-rank mt-sm">
              Rank: #{team.rank}
            </div>
          )}
        </div>
      </div>

      <h3 className="mb-md">Team Members</h3>
      <div className="card">
        <div className="card-body">
          {team.members.map((member, index) => (
            <div key={member.userId._id || member.userId} className="member-row">
              <div className="member-rank">{index + 1}</div>
              <div className="member-info">
                <div className="member-name">
                  {member.userId.displayName || 'Unknown'}
                </div>
                <div className="member-points text-gray text-sm">
                  {member.contributedPoints} pts
                </div>
              </div>
              <div className="member-avatar">
                {(member.userId.displayName || 'U').charAt(0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link to={`/leaderboard/${matchId}`} className="btn btn-secondary btn-block mt-md">
        View Full Leaderboard
      </Link>

      <style>{`
        .team-name {
          font-size: 1.5rem;
          color: var(--primary);
        }
        .team-points {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .points-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        .points-label {
          font-size: 0.875rem;
          color: var(--gray-500);
        }
        .team-rank {
          font-weight: 600;
          color: var(--accent);
        }
        .member-row {
          display: flex;
          align-items: center;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--gray-100);
        }
        .member-row:last-child {
          border-bottom: none;
        }
        .member-rank {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.75rem;
          margin-right: var(--spacing-sm);
        }
        .member-info {
          flex: 1;
        }
        .member-name {
          font-weight: 600;
        }
        .member-avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-light);
          color: white;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
