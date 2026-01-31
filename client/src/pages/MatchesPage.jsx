import { useState, useEffect } from 'react'
import { matchService } from '../services/matchService'
import Loading from '../components/common/Loading'
import MatchCard from '../components/match/MatchCard'

export default function MatchesPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true)
      try {
        let response
        if (filter === 'all') {
          response = await matchService.getMatches()
        } else if (filter === 'upcoming') {
          response = await matchService.getUpcomingMatches()
        } else if (filter === 'live') {
          response = await matchService.getLiveMatches()
        } else {
          response = await matchService.getCompletedMatches()
        }
        setMatches(response.data || [])
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [filter])

  return (
    <div className="matches-page">
      <h1 className="mb-md">Matches</h1>

      {/* Filter Tabs */}
      <div className="tabs">
        <button
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`tab ${filter === 'live' ? 'active' : ''}`}
          onClick={() => setFilter('live')}
        >
          Live
        </button>
        <button
          className={`tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : matches.length > 0 ? (
        <div className="matches-list">
          {matches.map(match => (
            <MatchCard key={match._id} match={match} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No {filter !== 'all' ? filter : ''} matches found</p>
        </div>
      )}
    </div>
  )
}
