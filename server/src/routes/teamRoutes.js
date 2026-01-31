const express = require('express');
const {
  joinQueue,
  getQueueStatus,
  getMyTeam,
  leaveQueue
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All team routes require authentication

router.post('/:matchId/join', joinQueue);
router.get('/:matchId/status', getQueueStatus);
router.get('/:matchId/my-team', getMyTeam);
router.delete('/:matchId/leave', leaveQueue);

module.exports = router;
