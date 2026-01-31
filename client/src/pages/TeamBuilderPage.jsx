import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { matchService } from '../services/matchService'
import { fantasyService } from '../services/fantasyService'
import { useToast } from '../hooks/useToast'
import Loading from '../components/common/Loading'

const MAX_CREDITS = 100
const TEAM_SIZE = 11

export default function TeamBuilderPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()

  const [match, setMatch] = useState(null)
  const [players, setPlayers] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [captain, setCaptain] = useState(null)
  const [viceCaptain, setViceCaptain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [step, setStep] = useState(1) // 1: select players, 2: select captain/vc

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchRes, playersRes, teamRes] = await Promise.all([
          matchService.getMatch(matchId),
          matchService.getMatchPlayers(matchId),
          fantasyService.getFantasyTeam(matchId)
        ])
        setMatch(matchRes.data)
        setPlayers(playersRes.data || [])

        // Load existing team if any
        if (teamRes.data) {
          const existingPlayers = teamRes.data.players.map(p => p.playerId._id || p.playerId)
          setSelectedPlayers(existingPlayers)
          const captainPlayer = teamRes.data.players.find(p => p.isCaptain)
          const vcPlayer = teamRes.data.players.find(p => p.isViceCaptain)
          if (captainPlayer) setCaptain(captainPlayer.playerId._id || captainPlayer.playerId)
          if (vcPlayer) setViceCaptain(vcPlayer.playerId._id || vcPlayer.playerId)
        }
      } catch (error) {
        showError('Error loading data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId])

  const filteredPlayers = useMemo(() => {
    if (filter === 'all') return players
    return players.filter(p => p.role === filter)
  }, [players, filter])

  const usedCredits = useMemo(() => {
    return players
      .filter(p => selectedPlayers.includes(p._id))
      .reduce((sum, p) => sum + p.creditValue, 0)
  }, [players, selectedPlayers])

  const remainingCredits = MAX_CREDITS - usedCredits

  const togglePlayer = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        // Deselect
        if (captain === playerId) setCaptain(null)
        if (viceCaptain === playerId) setViceCaptain(null)
        return prev.filter(id => id !== playerId)
      } else {
        // Select
        if (prev.length >= TEAM_SIZE) {
          showError(`Maximum ${TEAM_SIZE} players allowed`)
          return prev
        }
        const player = players.find(p => p._id === playerId)
        if (player.creditValue > remainingCredits) {
          showError('Not enough credits')
          return prev
        }
        return [...prev, playerId]
      }
    })
  }

  const handleContinue = () => {
    if (selectedPlayers.length !== TEAM_SIZE) {
      showError(`Please select ${TEAM_SIZE} players`)
      return
    }
    setStep(2)
  }

  const handleSave = async () => {
    if (!captain || !viceCaptain) {
      showError('Please select captain and vice-captain')
      return
    }

    setSaving(true)
    try {
      await fantasyService.createOrUpdateTeam(matchId, {
        players: selectedPlayers,
        captainId: captain,
        viceCaptainId: viceCaptain
      })
      success('Team saved successfully!')
      navigate(`/match/${matchId}`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (!match) return <div className="empty-state">Match not found</div>

  const selectedPlayerObjects = players.filter(p => selectedPlayers.includes(p._id))

  return (
    <div className="team-builder-page">
      {/* Credit Counter */}
      <div className="credit-counter">
        <div>
          <div className="credit-value">{selectedPlayers.length}/{TEAM_SIZE}</div>
          <div className="credit-label">Players</div>
        </div>
        <div>
          <div className="credit-value">{remainingCredits.toFixed(1)}</div>
          <div className="credit-label">Credits Left</div>
        </div>
      </div>

      {step === 1 ? (
        <>
          {/* Role Filter */}
          <div className="tabs">
            {['all', 'Wicket-Keeper', 'Batsman', 'All-Rounder', 'Bowler'].map(role => (
              <button
                key={role}
                className={`tab ${filter === role ? 'active' : ''}`}
                onClick={() => setFilter(role)}
              >
                {role === 'all' ? 'All' : role.split('-')[0]}
              </button>
            ))}
          </div>

          {/* Players List */}
          <div className="players-list">
            {filteredPlayers.map(player => {
              const isSelected = selectedPlayers.includes(player._id)
              const canSelect = isSelected || (selectedPlayers.length < TEAM_SIZE && player.creditValue <= remainingCredits)

              return (
                <div
                  key={player._id}
                  className={`player-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                  onClick={() => canSelect && togglePlayer(player._id)}
                >
                  <div className="player-avatar">
                    {player.image ? (
                      <img
                        src={player.image}
                        alt={player.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span className="avatar-fallback" style={{ display: player.image ? 'none' : 'flex' }}>
                      {player.name.charAt(0)}
                    </span>
                  </div>
                  <div className="player-info">
                    <div className="player-name">{player.name}</div>
                    <div className="player-role">{player.team} - {player.role}</div>
                  </div>
                  <div className="player-credits">{player.creditValue}</div>
                  {isSelected && (
                    <div className="player-check">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--success)">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleContinue}
            disabled={selectedPlayers.length !== TEAM_SIZE}
          >
            Continue ({selectedPlayers.length}/{TEAM_SIZE})
          </button>
        </>
      ) : (
        <>
          {/* Captain Selection */}
          <div className="card mb-md">
            <div className="card-header">Select Captain & Vice-Captain</div>
            <div className="card-body">
              <p className="text-sm text-gray mb-md">
                Captain gets 2x points, Vice-captain gets 1.5x points
              </p>

              {selectedPlayerObjects.map(player => (
                <div key={player._id} className="captain-row">
                  <div className="captain-player">
                    <div className="player-avatar small">
                      {player.image ? (
                        <img src={player.image} alt={player.name} />
                      ) : (
                        <span className="avatar-fallback">{player.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-role">{player.role}</div>
                    </div>
                  </div>
                  <div className="captain-buttons">
                    <button
                      className={`captain-btn ${captain === player._id ? 'active c' : ''}`}
                      onClick={() => {
                        if (viceCaptain === player._id) setViceCaptain(null)
                        setCaptain(captain === player._id ? null : player._id)
                      }}
                    >
                      C
                    </button>
                    <button
                      className={`captain-btn ${viceCaptain === player._id ? 'active vc' : ''}`}
                      onClick={() => {
                        if (captain === player._id) setCaptain(null)
                        setViceCaptain(viceCaptain === player._id ? null : player._id)
                      }}
                    >
                      VC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleSave}
              disabled={saving || !captain || !viceCaptain}
            >
              {saving ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </>
      )}

      <style>{`
        .player-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .player-avatar {
          position: relative;
          overflow: hidden;
        }
        .player-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
        }
        .player-avatar .avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          color: white;
        }
        .player-avatar.small {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--primary-gradient);
          flex-shrink: 0;
        }
        .player-avatar.small .avatar-fallback {
          font-size: 0.85rem;
        }
        .player-check {
          margin-left: var(--spacing-sm);
        }
        .captain-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--gray-100);
        }
        .captain-row:last-child {
          border-bottom: none;
        }
        .captain-player {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .captain-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }
        .captain-btn {
          width: 36px;
          height: 36px;
          border: 2px solid var(--gray-300);
          border-radius: var(--radius-full);
          background: transparent;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .captain-btn.active.c {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }
        .captain-btn.active.vc {
          background: var(--secondary);
          border-color: var(--secondary);
          color: white;
        }
      `}</style>
    </div>
  )
}
