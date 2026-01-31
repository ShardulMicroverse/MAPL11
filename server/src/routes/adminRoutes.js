const express = require('express');
const {
  checkApiStatus,
  getAvailableSeries,
  getLiveMatchesFromApi,
  syncMatchesFromApi,
  syncPlayersFromApi,
  updateLiveScores,
  searchPlayersInApi,
  addPlayerFromApi,
  addTeamPlayers,
  getPlayersFromDb,
  deletePlayer,
  // NEW imports
  importScorecard,
  getScorecards,
  getScorecardByMatch,
  deleteScorecardById,
  getMatchesWithoutScorecards
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication
router.use(protect);

// API Status
router.get('/api-status', checkApiStatus);

// Fetch from API (read-only)
router.get('/series', getAvailableSeries);
router.get('/live-matches', getLiveMatchesFromApi);
router.get('/search-players', searchPlayersInApi);

// Sync to database
router.post('/sync-matches', syncMatchesFromApi);
router.post('/sync-players', syncPlayersFromApi);
router.post('/update-live-scores', updateLiveScores);

// Player management
router.get('/players', getPlayersFromDb);
router.post('/add-player', addPlayerFromApi);
router.post('/add-team-players', addTeamPlayers);
router.delete('/players/:id', deletePlayer);

// NEW: Scorecard import routes
router.get('/matches-without-scorecards', getMatchesWithoutScorecards);
router.get('/scorecards', getScorecards);
router.get('/scorecards/:matchId', getScorecardByMatch);
router.post('/import-scorecard', importScorecard);
router.delete('/scorecards/:id', deleteScorecardById);

module.exports = router;