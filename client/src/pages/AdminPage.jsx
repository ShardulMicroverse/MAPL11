import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../hooks/useToast'
import Loading from '../components/common/Loading'

export default function AdminPage() {
  const { success, error: showError } = useToast()
  const [apiStatus, setApiStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [series, setSeries] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [selectedSeriesId, setSelectedSeriesId] = useState('')

  // Player management state
  const [activeTab, setActiveTab] = useState('sync')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [dbPlayers, setDbPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamShortName, setTeamShortName] = useState('')

  // Match management state
  const [dbMatches, setDbMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [newMatch, setNewMatch] = useState({
    team1Name: '',
    team1ShortName: '',
    team2Name: '',
    team2ShortName: '',
    venue: '',
    matchDate: '',
    matchTime: ''
  })

  // Scorecard import state (NEW)
  const [csvContent, setCsvContent] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [matchesWithoutScorecard, setMatchesWithoutScorecard] = useState([])
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  const [scorecards, setScorecards] = useState([])
  const [loadingScorecards, setLoadingScorecards] = useState(false)

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await api.get('/admin/api-status')
      setApiStatus(response.data)
    } catch (err) {
      showError('Failed to check API status')
    } finally {
      setLoading(false)
    }
  }

  const fetchSeries = async () => {
    try {
      setSyncing(true)
      const response = await api.get('/admin/series')
      setSeries(response.data || [])
      success(`Found ${response.count} series`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const fetchLiveMatches = async () => {
    try {
      setSyncing(true)
      const response = await api.get('/admin/live-matches')
      setLiveMatches(response.data || [])
      success(`Found ${response.count} India matches (${response.allMatchesCount} total)`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const syncMatches = async () => {
    try {
      setSyncing(true)
      const body = selectedSeriesId ? { seriesId: selectedSeriesId } : {}
      const response = await api.post('/admin/sync-matches', body)
      success(`Synced ${response.data.synced} new, updated ${response.data.updated} matches`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const syncPlayers = async () => {
    if (!selectedSeriesId) {
      showError('Please select a series first')
      return
    }
    try {
      setSyncing(true)
      const response = await api.post('/admin/sync-players', {
        seriesId: selectedSeriesId,
        teamNames: ['india', 'pakistan', 'australia', 'england', 'south africa']
      })
      success(`Synced ${response.data.synced} new, updated ${response.data.updated} players`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const updateLiveScores = async () => {
    try {
      setSyncing(true)
      const response = await api.post('/admin/update-live-scores')
      success(`Updated ${response.data.updated} live matches`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  // Player search functions
  const searchPlayers = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      showError('Enter at least 2 characters to search')
      return
    }
    try {
      setSearching(true)
      const response = await api.get(`/admin/search-players?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(response.data || [])
      if (response.data?.length === 0) {
        showError('No players found')
      } else {
        success(`Found ${response.count} players`)
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const addPlayer = async (player) => {
    try {
      const response = await api.post('/admin/add-player', {
        playerId: player.id,
        team: player.country || 'UNK'
      })
      if (response.message === 'Player already exists in database') {
        showError('Player already exists')
      } else {
        success(`Added ${player.name}`)
      }
      if (activeTab === 'database') {
        fetchDbPlayers()
      }
    } catch (err) {
      showError(err.message)
    }
  }

  const addTeamPlayersFromApi = async () => {
    if (!teamName) {
      showError('Enter a team name')
      return
    }
    try {
      setSyncing(true)
      const response = await api.post('/admin/add-team-players', {
        teamName,
        teamShortName: teamShortName || teamName.substring(0, 3).toUpperCase()
      })
      success(`Found ${response.data.found}, added ${response.data.added}, skipped ${response.data.skipped} players`)
      setTeamName('')
      setTeamShortName('')
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const fetchDbPlayers = async () => {
    try {
      setLoadingPlayers(true)
      const response = await api.get('/admin/players')
      setDbPlayers(response.data || [])
    } catch (err) {
      showError(err.message)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const deletePlayerFromDb = async (playerId, playerName) => {
    if (!confirm(`Delete ${playerName}?`)) return
    try {
      await api.delete(`/admin/players/${playerId}`)
      success(`Deleted ${playerName}`)
      fetchDbPlayers()
    } catch (err) {
      showError(err.message)
    }
  }

  // Match management functions
  const fetchDbMatches = async () => {
    try {
      setLoadingMatches(true)
      const response = await api.get('/admin/matches')
      setDbMatches(response.data || [])
    } catch (err) {
      showError(err.message)
    } finally {
      setLoadingMatches(false)
    }
  }

  const createMatch = async () => {
    if (!newMatch.team1Name || !newMatch.team2Name || !newMatch.venue || !newMatch.matchDate) {
      showError('Please fill in all required fields')
      return
    }
    try {
      setSyncing(true)
      await api.post('/admin/create-match', newMatch)
      success('Match created successfully!')
      setNewMatch({
        team1Name: '',
        team1ShortName: '',
        team2Name: '',
        team2ShortName: '',
        venue: '',
        matchDate: '',
        matchTime: ''
      })
      fetchDbMatches()
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const updateMatchStatus = async (matchId, status) => {
    try {
      await api.patch(`/admin/matches/${matchId}/status`, { status })
      success(`Match status updated to ${status}`)
      fetchDbMatches()
    } catch (err) {
      showError(err.message)
    }
  }

  const deleteMatchFromDb = async (matchId, matchName) => {
    if (!confirm(`Delete match "${matchName}"?`)) return
    try {
      await api.delete(`/admin/matches/${matchId}`)
      success('Match deleted')
      fetchDbMatches()
    } catch (err) {
      showError(err.message)
    }
  }

  const calculatePoints = async (matchId) => {
    if (!confirm('Calculate fantasy points for this match? This will generate random test points for all fantasy teams.')) return
    try {
      setSyncing(true)
      const response = await api.post(`/admin/calculate-points/${matchId}`, {
        useApi: true
      })
      success(`Points calculated for ${response.data.teamsUpdated} teams`)
    } catch (err) {
      showError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  // Scorecard functions (NEW)
  const fetchMatchesWithoutScorecard = async () => {
    try {
      const response = await api.get('/admin/matches-without-scorecards')
      setMatchesWithoutScorecard(response.data || [])
    } catch (err) {
      console.error('Error fetching matches without scorecard:', err)
    }
  }

  const fetchScorecards = async () => {
    try {
      setLoadingScorecards(true)
      const response = await api.get('/admin/scorecards')
      setScorecards(response.data || [])
    } catch (err) {
      showError(err.message)
    } finally {
      setLoadingScorecards(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvContent(event.target.result)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  const handleImportScorecard = async () => {
    if (!csvContent) {
      showError('Please upload a CSV file first')
      return
    }

    try {
      setImporting(true)
      setImportResult(null)

      const response = await api.post('/admin/import-scorecard', {
        csvContent,
        matchId: selectedMatchId || null
      })

      setImportResult(response.data)

      if (response.data.success) {
        success(`Scorecard imported! ${response.data.playersMatched} players matched.`)
        setCsvContent('')
        setSelectedMatchId('')
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ''
        fetchScorecards()
        fetchMatchesWithoutScorecard()
      } else {
        showError(response.data.errors?.join(', ') || 'Import failed')
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteScorecard = async (scorecardId, matchName) => {
    if (!confirm(`Delete scorecard for ${matchName}?`)) return
    try {
      await api.delete(`/admin/scorecards/${scorecardId}`)
      success('Scorecard deleted')
      fetchScorecards()
      fetchMatchesWithoutScorecard()
    } catch (err) {
      showError(err.message)
    }
  }

  // Tab change effect
  useEffect(() => {
    if (activeTab === 'database') {
      fetchDbPlayers()
    }
    if (activeTab === 'matches') {
      fetchDbMatches()
    }
    if (activeTab === 'scorecard') {
      fetchMatchesWithoutScorecard()
      fetchScorecards()
    }
  }, [activeTab])

  if (loading) return <Loading />

  return (
    <div className="admin-page">
      <h1 className="mb-md">🔧 Admin Panel</h1>

      {/* API Status */}
      <div className="card mb-md">
        <div className="card-header">Cricket API Status</div>
        <div className="card-body">
          {apiStatus?.configured ? (
            <div className={`status-badge ${apiStatus.connected ? 'success' : 'error'}`}>
              {apiStatus.connected ? `✓ Connected (${apiStatus.seriesCount} series)` : '✗ Not Connected'}
            </div>
          ) : (
            <div className="status-badge warning">
              ⚠ API Key Not Configured
            </div>
          )}
          {apiStatus?.configured && !apiStatus?.connected && apiStatus?.error && (
            <p className="text-sm text-danger mt-sm">
              Error: {apiStatus.error}
            </p>
          )}
          {apiStatus?.configured && !apiStatus?.connected && (
            <p className="text-sm text-gray mt-sm">
              The CricAPI free tier has 100 requests/day limit. You may have exceeded it, or the API key is invalid.
              You can still create matches and add players manually using the tabs below.
            </p>
          )}
          {!apiStatus?.configured && (
            <p className="text-sm text-gray mt-sm">
              Add your CricketData.org API key to server/.env file:<br/>
              <code>CRICKET_API_KEY=your-api-key</code>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-md">
        <button
          className={`tab ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          📡 Sync Data
        </button>
        <button
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          🏏 Matches
        </button>
        <button
          className={`tab ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          👤 Add Players
        </button>
        <button
          className={`tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          💾 Players DB
        </button>
        <button
          className={`tab ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          📊 Import Scorecard
        </button>
      </div>

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <>
          <div className="card mb-md">
            <div className="card-header">Fetch from API</div>
            <div className="card-body">
              <div className="btn-group">
                <button
                  className="btn btn-secondary"
                  onClick={fetchSeries}
                  disabled={syncing}
                >
                  Get Series
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={fetchLiveMatches}
                  disabled={syncing}
                >
                  Get Live Matches
                </button>
              </div>

              {series.length > 0 && (
                <div className="mt-md">
                  <label className="form-label">Select Series:</label>
                  <select
                    className="form-input"
                    value={selectedSeriesId}
                    onChange={(e) => setSelectedSeriesId(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {series.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {liveMatches.length > 0 && (
                <div className="mt-md">
                  <h4>Live/Current Matches:</h4>
                  <div className="matches-list">
                    {liveMatches.map(m => (
                      <div key={m.id} className="match-item-simple">
                        <div className="match-name">{m.name}</div>
                        <div className="match-status text-sm text-gray">
                          {m.status} | {m.venue}
                        </div>
                        <code className="text-xs">ID: {m.id}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-md">
            <div className="card-header">Sync to Database</div>
            <div className="card-body">
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={syncMatches}
                  disabled={syncing}
                >
                  {syncing ? 'Syncing...' : 'Sync Matches'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={syncPlayers}
                  disabled={syncing || !selectedSeriesId}
                >
                  {syncing ? 'Syncing...' : 'Sync Squad'}
                </button>
                <button
                  className="btn btn-success"
                  onClick={updateLiveScores}
                  disabled={syncing}
                >
                  Update Live Scores
                </button>
              </div>
              {!selectedSeriesId && (
                <p className="text-sm text-gray mt-sm">
                  Select a series above to sync squad
                </p>
              )}
              <p className="text-sm text-gray mt-sm">
                Note: If squad sync doesn't work, use "Add Players" tab to search and add players manually.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <>
          <div className="card mb-md">
            <div className="card-header">Create Match Manually</div>
            <div className="card-body">
              <p className="text-sm text-gray mb-md">
                Create a match that isn't available in the API (e.g., NZ vs India)
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Team 1 Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., India"
                    value={newMatch.team1Name}
                    onChange={(e) => setNewMatch({ ...newMatch, team1Name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., IND"
                    value={newMatch.team1ShortName}
                    onChange={(e) => setNewMatch({ ...newMatch, team1ShortName: e.target.value.toUpperCase() })}
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Team 2 Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., New Zealand"
                    value={newMatch.team2Name}
                    onChange={(e) => setNewMatch({ ...newMatch, team2Name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., NZ"
                    value={newMatch.team2ShortName}
                    onChange={(e) => setNewMatch({ ...newMatch, team2ShortName: e.target.value.toUpperCase() })}
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Venue *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Eden Gardens, Kolkata"
                  value={newMatch.venue}
                  onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Match Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newMatch.matchDate}
                    onChange={(e) => setNewMatch({ ...newMatch, matchDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newMatch.matchTime}
                    onChange={(e) => setNewMatch({ ...newMatch, matchTime: e.target.value })}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={createMatch}
                disabled={syncing}
              >
                {syncing ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </div>

          <div className="card mb-md">
            <div className="card-header">
              Matches in Database ({dbMatches.length})
              <button
                className="btn btn-sm btn-secondary ml-auto"
                onClick={fetchDbMatches}
                disabled={loadingMatches}
              >
                Refresh
              </button>
            </div>
            <div className="card-body">
              {loadingMatches ? (
                <Loading />
              ) : dbMatches.length === 0 ? (
                <p className="text-gray">No matches in database. Create one above or sync from API.</p>
              ) : (
                <div className="match-list">
                  {dbMatches.map(match => (
                    <div key={match._id} className="match-item">
                      <div className="match-info">
                        <div className="match-name">
                          {match.team1.name} vs {match.team2.name}
                        </div>
                        <div className="match-details text-sm text-gray">
                          {match.venue} | {new Date(match.matchDate).toLocaleDateString()}
                        </div>
                        <div className="match-status-row">
                          <span className={`status-badge ${match.status}`}>
                            {match.status}
                          </span>
                          {match.scorecardId && (
                            <span className="status-badge has-scorecard">
                              📊 Scorecard
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="match-actions">
                        <select
                          className="form-input form-input-sm"
                          value={match.status}
                          onChange={(e) => updateMatchStatus(match._id, e.target.value)}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => calculatePoints(match._id)}
                          disabled={syncing}
                          title="Calculate fantasy points for this match"
                        >
                          Calc Points
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteMatchFromDb(match._id, `${match.team1.name} vs ${match.team2.name}`)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Players Tab */}
      {activeTab === 'players' && (
        <>
          <div className="card mb-md">
            <div className="card-header">Search Players in API</div>
            <div className="card-body">
              <div className="search-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search player name (e.g., Virat, Rohit)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
                />
                <button
                  className="btn btn-primary"
                  onClick={searchPlayers}
                  disabled={searching}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-md">
                  <h4>Search Results ({searchResults.length}):</h4>
                  <div className="player-list">
                    {searchResults.map(player => (
                      <div key={player.id} className="player-item">
                        <div className="player-info">
                          <div className="player-name">{player.name}</div>
                          <div className="player-details text-sm text-gray">
                            {player.country || 'Unknown'} | {player.role || 'Unknown Role'}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => addPlayer(player)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-md">
            <div className="card-header">Bulk Add Players by Team</div>
            <div className="card-body">
              <p className="text-sm text-gray mb-sm">
                Search and add all players from a team (e.g., "India", "Australia")
              </p>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., India, Australia"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Team Short Name (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., IND, AUS (auto-generated if empty)"
                  value={teamShortName}
                  onChange={(e) => setTeamShortName(e.target.value.toUpperCase())}
                  maxLength={5}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={addTeamPlayersFromApi}
                disabled={syncing || !teamName}
              >
                {syncing ? 'Adding...' : 'Add Team Players'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="card mb-md">
          <div className="card-header">
            Players in Database ({dbPlayers.length})
            <button
              className="btn btn-sm btn-secondary ml-auto"
              onClick={fetchDbPlayers}
              disabled={loadingPlayers}
            >
              Refresh
            </button>
          </div>
          <div className="card-body">
            {loadingPlayers ? (
              <Loading />
            ) : dbPlayers.length === 0 ? (
              <p className="text-gray">No players in database. Use "Add Players" tab to add some.</p>
            ) : (
              <div className="player-list">
                {dbPlayers.map(player => (
                  <div key={player._id} className="player-item">
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-details text-sm text-gray">
                        {player.team} | {player.role} | ₹{player.creditValue}Cr
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deletePlayerFromDb(player._id, player.name)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scorecard Import Tab (NEW) */}
      {activeTab === 'scorecard' && (
        <>
          <div className="card mb-md">
            <div className="card-header">📤 Import Scorecard CSV</div>
            <div className="card-body">
              <div className="info-box mb-md">
                <p><strong>How it works:</strong></p>
                <ul>
                  <li>Run your Python scraper to generate the CSV file</li>
                  <li>Upload the CSV here</li>
                  <li>System auto-detects the match by teams and date</li>
                  <li>Players are fuzzy-matched to database</li>
                  <li>Stats are computed for predictions evaluation</li>
                </ul>
              </div>

              <div className="form-group">
                <label className="form-label">Select Match (optional - auto-detect if not selected)</label>
                <select
                  className="form-input"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                >
                  <option value="">-- Auto-detect from CSV --</option>
                  {matchesWithoutScorecard.map(match => (
                    <option key={match._id} value={match._id}>
                      {match.team1?.shortName || match.team1?.name} vs {match.team2?.shortName || match.team2?.name} - {new Date(match.matchDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {matchesWithoutScorecard.length === 0 && (
                  <p className="text-sm text-gray mt-xs">No matches without scorecards found.</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="form-input file-input"
                  onChange={handleFileUpload}
                />
              </div>

              {csvContent && (
                <div className="csv-preview mt-sm">
                  <label className="form-label">Preview (first 500 characters):</label>
                  <pre className="code-block">{csvContent.substring(0, 500)}...</pre>
                </div>
              )}

              <button
                className="btn btn-primary mt-md"
                onClick={handleImportScorecard}
                disabled={importing || !csvContent}
              >
                {importing ? '⏳ Importing...' : '📊 Import Scorecard'}
              </button>

              {importResult && (
                <div className={`import-result mt-md ${importResult.success ? 'success' : 'error'}`}>
                  <h4>{importResult.success ? '✅ Import Successful!' : '❌ Import Failed'}</h4>
                  
                  {importResult.success && (
                    <div className="result-stats">
                      <div className="stat">
                        <span className="stat-value">{importResult.playersMatched}</span>
                        <span className="stat-label">Players Matched</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{importResult.playersUnmatched}</span>
                        <span className="stat-label">Unmatched</span>
                      </div>
                    </div>
                  )}
                  
                  {importResult.unmatchedPlayers?.length > 0 && (
                    <div className="unmatched-list mt-sm">
                      <p className="text-sm"><strong>Unmatched players (add these to database):</strong></p>
                      <ul className="text-sm">
                        {importResult.unmatchedPlayers.slice(0, 10).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                        {importResult.unmatchedPlayers.length > 10 && (
                          <li>...and {importResult.unmatchedPlayers.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {importResult.errors?.length > 0 && (
                    <ul className="error-list mt-sm">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card mb-md">
            <div className="card-header">
              📋 Imported Scorecards ({scorecards.length})
              <button
                className="btn btn-sm btn-secondary ml-auto"
                onClick={fetchScorecards}
                disabled={loadingScorecards}
              >
                Refresh
              </button>
            </div>
            <div className="card-body">
              {loadingScorecards ? (
                <Loading />
              ) : scorecards.length === 0 ? (
                <p className="text-gray">No scorecards imported yet. Upload a CSV above to import.</p>
              ) : (
                <div className="scorecard-list">
                  {scorecards.map(sc => (
                    <div key={sc._id} className="scorecard-item">
                      <div className="scorecard-info">
                        <div className="scorecard-match">
                          {sc.matchId?.team1?.shortName || '?'} vs {sc.matchId?.team2?.shortName || '?'}
                        </div>
                        <div className="scorecard-details text-sm text-gray">
                          📅 {sc.matchInfo?.date ? new Date(sc.matchInfo.date).toLocaleDateString() : 'N/A'} |
                          🏟️ {sc.matchInfo?.venue?.substring(0, 30) || 'N/A'}
                        </div>
                        <div className="scorecard-result text-sm">
                          🏆 {sc.matchInfo?.result || 'Result pending'}
                        </div>
                        <div className="scorecard-stats text-xs mt-xs">
                          <span title="Total Match Score">🏏 {sc.computedStats?.totalMatchScore || 0} runs</span>
                          <span className="mx-sm">|</span>
                          <span title="Most Sixes">6️⃣ {sc.computedStats?.mostSixes?.playerName || '-'} ({sc.computedStats?.mostSixes?.count || 0})</span>
                          <span className="mx-sm">|</span>
                          <span title="Most Fours">4️⃣ {sc.computedStats?.mostFours?.playerName || '-'} ({sc.computedStats?.mostFours?.count || 0})</span>
                          <span className="mx-sm">|</span>
                          <span title="Most Wickets">🎳 {sc.computedStats?.mostWickets?.playerName || '-'} ({sc.computedStats?.mostWickets?.count || 0})</span>
                          <span className="mx-sm">|</span>
                          <span title="Fifties">💯 {sc.computedStats?.fiftiesCount || 0} fifties</span>
                        </div>
                        <div className="scorecard-meta text-xs text-gray mt-xs">
                          Imported: {new Date(sc.importedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="scorecard-actions">
                        <div className="badge-group">
                          <span className={`badge ${sc.processingStatus?.fantasyPointsCalculated ? 'success' : 'pending'}`}>
                            {sc.processingStatus?.fantasyPointsCalculated ? '✓ Points' : '○ Points'}
                          </span>
                          <span className={`badge ${sc.processingStatus?.predictionsEvaluated ? 'success' : 'pending'}`}>
                            {sc.processingStatus?.predictionsEvaluated ? '✓ Predictions' : '○ Predictions'}
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteScorecard(sc._id, `${sc.matchId?.team1?.shortName} vs ${sc.matchId?.team2?.shortName}`)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .status-badge {
          display: inline-block;
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.875rem;
        }
        .status-badge.success {
          background: rgba(22, 163, 74, 0.1);
          color: var(--success);
        }
        .status-badge.error {
          background: rgba(220, 38, 38, 0.1);
          color: var(--danger);
        }
        .status-badge.warning {
          background: rgba(217, 119, 6, 0.1);
          color: var(--warning);
        }
        .status-badge.upcoming {
          background: rgba(100, 116, 139, 0.1);
          color: var(--gray-600);
        }
        .status-badge.live {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }
        .status-badge.completed {
          background: rgba(22, 163, 74, 0.1);
          color: var(--success);
        }
        .status-badge.has-scorecard {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary);
          margin-left: var(--spacing-xs);
        }
        
        .btn-group {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }
        
        code {
          background: var(--gray-100);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
        }
        
        .tabs {
          display: flex;
          gap: var(--spacing-xs);
          border-bottom: 2px solid var(--gray-200);
          padding-bottom: var(--spacing-xs);
          overflow-x: auto;
        }
        .tab {
          padding: var(--spacing-sm) var(--spacing-md);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--gray-600);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .tab.active {
          background: var(--primary);
          color: white;
        }
        .tab:hover:not(.active) {
          background: var(--gray-100);
        }
        
        .search-row {
          display: flex;
          gap: var(--spacing-sm);
        }
        .search-row .form-input {
          flex: 1;
        }
        
        .player-list, .scorecard-list {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .player-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-sm);
          transition: all 0.2s;
        }
        .player-item:hover {
          border-color: var(--primary);
          background: var(--gray-50);
        }
        
        .player-info {
          flex: 1;
        }
        .player-name {
          font-weight: 600;
        }
        .player-details {
          font-size: 0.8rem;
        }
        
        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 0.8rem;
        }
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        .btn-danger:hover {
          background: #b91c1c;
        }
        
        .form-group {
          margin-bottom: var(--spacing-sm);
        }
        .card-header {
          display: flex;
          align-items: center;
        }
        .ml-auto {
          margin-left: auto;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        .match-list {
          max-height: 500px;
          overflow-y: auto;
        }
        .match-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--spacing-md);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-sm);
          gap: var(--spacing-md);
          transition: all 0.2s;
        }
        .match-item:hover {
          border-color: var(--primary);
          background: var(--gray-50);
        }
        .match-item-simple {
          padding: var(--spacing-sm);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-sm);
        }
        .match-info {
          flex: 1;
        }
        .match-name {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .match-details {
          margin-bottom: 8px;
        }
        .match-status-row {
          margin-top: 4px;
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }
        .match-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          align-items: flex-end;
        }
        .form-input-sm {
          padding: 6px 10px;
          font-size: 0.8rem;
        }
        
        /* Scorecard specific styles */
        .info-box {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
        }
        .info-box p {
          margin: 0 0 var(--spacing-xs) 0;
        }
        .info-box ul {
          margin: var(--spacing-xs) 0 0 var(--spacing-md);
          padding: 0;
        }
        .info-box li {
          margin-bottom: var(--spacing-xs);
        }
        
        .file-input {
          padding: var(--spacing-sm);
          border: 2px dashed var(--gray-300);
          cursor: pointer;
        }
        .file-input:hover {
          border-color: var(--primary);
        }
        
        .csv-preview {
          max-height: 200px;
          overflow: auto;
        }
        .code-block {
          background: var(--gray-100);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: 0.7rem;
          white-space: pre-wrap;
          word-break: break-all;
          font-family: monospace;
          margin: 0;
        }
        
        .import-result {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
        }
        .import-result.success {
          background: rgba(22, 163, 74, 0.1);
          border: 1px solid var(--success);
        }
        .import-result.error {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid var(--danger);
        }
        .import-result h4 {
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .result-stats {
          display: flex;
          gap: var(--spacing-lg);
          margin-top: var(--spacing-sm);
        }
        .stat {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--gray-600);
        }
        
        .unmatched-list ul {
          margin: var(--spacing-xs) 0 0 var(--spacing-md);
          padding: 0;
        }
        .error-list {
          color: var(--danger);
          margin: 0;
          padding-left: var(--spacing-md);
        }
        
        .scorecard-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--spacing-md);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-sm);
          gap: var(--spacing-md);
          transition: all 0.2s;
        }
        .scorecard-item:hover {
          border-color: var(--primary);
          background: var(--gray-50);
        }
        .scorecard-info {
          flex: 1;
        }
        .scorecard-match {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .scorecard-details {
          margin-top: var(--spacing-xs);
        }
        .scorecard-result {
          margin-top: var(--spacing-xs);
          color: var(--success);
        }
        .scorecard-stats {
          color: var(--gray-600);
        }
        .scorecard-meta {
          margin-top: var(--spacing-xs);
        }
        
        .scorecard-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          align-items: flex-end;
        }
        
        .badge-group {
          display: flex;
          gap: var(--spacing-xs);
        }
        
        .badge {
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 600;
        }
        .badge.success {
          background: rgba(22, 163, 74, 0.1);
          color: var(--success);
        }
        .badge.pending {
          background: rgba(217, 119, 6, 0.1);
          color: var(--warning);
        }
        
        .mx-sm {
          margin: 0 var(--spacing-xs);
        }
        .mt-xs {
          margin-top: var(--spacing-xs);
        }
      `}</style>
    </div>
  )
}