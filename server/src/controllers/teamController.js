const autoMatchService = require('../services/autoMatchService');
const FantasyTeam = require('../models/FantasyTeam');
const Match = require('../models/Match');
const ApiError = require('../utils/ApiError');

// @desc    Join auto-match queue
// @route   POST /api/teams/:matchId/join
const joinQueue = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    // Check if match exists and is upcoming
    const match = await Match.findById(matchId);
    if (!match) {
      return next(new ApiError(404, 'Match not found'));
    }

    if (!match.isTeamSelectionOpen) {
      return next(new ApiError(400, 'Team selection is closed for this match'));
    }

    // Get user's fantasy team
    const fantasyTeam = await FantasyTeam.findOne({
      userId: req.user._id,
      matchId
    });

    if (!fantasyTeam) {
      return next(new ApiError(400, 'Please create your fantasy team first'));
    }

    const result = await autoMatchService.joinQueue(
      req.user._id,
      matchId,
      fantasyTeam._id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get auto-match status
// @route   GET /api/teams/:matchId/status
const getQueueStatus = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const status = await autoMatchService.getQueueStatus(req.user._id, matchId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assigned team details
// @route   GET /api/teams/:matchId/my-team
const getMyTeam = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    const team = await autoMatchService.getUserTeam(req.user._id, matchId);

    if (!team) {
      return res.json({
        success: true,
        data: null,
        message: 'Not yet matched to a team'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave queue (before matched)
// @route   DELETE /api/teams/:matchId/leave
const leaveQueue = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    await autoMatchService.leaveQueue(req.user._id, matchId);

    res.json({
      success: true,
      message: 'Left the queue successfully'
    });
  } catch (error) {
    if (error.message === 'Not in queue') {
      return next(new ApiError(400, error.message));
    }
    next(error);
  }
};

module.exports = {
  joinQueue,
  getQueueStatus,
  getMyTeam,
  leaveQueue
};
