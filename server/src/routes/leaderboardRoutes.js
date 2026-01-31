const express = require('express');
const {
  getIndividualMatchLeaderboard,
  getTeamMatchLeaderboard,
  getOverallIndividualLeaderboard,
  getMyRank
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public leaderboards
router.get('/individual/:matchId', getIndividualMatchLeaderboard);
router.get('/team/:matchId', getTeamMatchLeaderboard);
router.get('/individual/overall', getOverallIndividualLeaderboard);

// Protected routes
router.get('/my-rank/:matchId', protect, getMyRank);

module.exports = router;
