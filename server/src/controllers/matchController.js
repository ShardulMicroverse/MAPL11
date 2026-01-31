const Match = require('../models/Match');
const Player = require('../models/Player');
const ApiError = require('../utils/ApiError');

// @desc    Get all matches
// @route   GET /api/matches
const getMatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const matches = await Match.find(filter)
      .sort({ matchDate: 1 })
      .lean();

    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming matches
// @route   GET /api/matches/upcoming
const getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      status: 'upcoming',
      matchDate: { $gte: new Date() }
    })
      .sort({ matchDate: 1 })
      .lean();

    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live matches
// @route   GET /api/matches/live
const getLiveMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .sort({ matchDate: 1 })
      .lean();

    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed matches
// @route   GET /api/matches/completed
const getCompletedMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'completed' })
      .sort({ matchDate: -1 })
      .lean();

    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single match
// @route   GET /api/matches/:id
const getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).lean();

    if (!match) {
      return next(new ApiError(404, 'Match not found'));
    }

    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get players for a match
// @route   GET /api/matches/:id/players
const getMatchPlayers = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).lean();

    if (!match) {
      return next(new ApiError(404, 'Match not found'));
    }

    // Get players from both teams
    const players = await Player.find({
      team: { $in: [match.team1.shortName, match.team2.shortName] },
      isActive: true
    })
      .sort({ creditValue: -1, name: 1 })
      .lean();

    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get live score for a match
// @route   GET /api/matches/:id/live-score
const getLiveScore = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .select('liveData result status')
      .lean();

    if (!match) {
      return next(new ApiError(404, 'Match not found'));
    }

    res.json({
      success: true,
      data: {
        status: match.status,
        liveData: match.liveData,
        result: match.result
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all available scorecards (public)
 * GET /api/matches/scorecards
 */
const getScorecards = async (req, res, next) => {
  try {
    const MatchScorecard = require('../models/MatchScorecard');
    
    const scorecards = await MatchScorecard.find()
      .populate('matchId', 'team1 team2 matchDate venue')
      .sort({ 'matchInfo.date': -1 })
      .lean();

    res.json({
      success: true,
      count: scorecards.length,
      data: scorecards
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get scorecard by ID (public)
 * GET /api/matches/scorecards/:id
 */
const getScorecardById = async (req, res, next) => {
  try {
    const MatchScorecard = require('../models/MatchScorecard');
    
    const scorecard = await MatchScorecard.findById(req.params.id)
      .populate('matchId', 'team1 team2 matchDate venue status')
      .populate('firstInnings.batting.playerId', 'name team role')
      .populate('firstInnings.bowling.playerId', 'name team role')
      .populate('secondInnings.batting.playerId', 'name team role')
      .populate('secondInnings.bowling.playerId', 'name team role')
      .lean();

    if (!scorecard) {
      return next(new ApiError(404, 'Scorecard not found'));
    }

    res.json({
      success: true,
      data: scorecard
    });
  } catch (error) {
    next(error);
  }
};

// Update the module.exports to include new methods
module.exports = {
  getMatches,
  getUpcomingMatches,
  getLiveMatches,
  getCompletedMatches,
  getMatch,
  getMatchPlayers,
  getLiveScore,
  getScorecards,      // ADD THIS
  getScorecardById    // ADD THIS
};
