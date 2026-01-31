const Prediction = require('../models/Prediction');
const Match = require('../models/Match');
const Player = require('../models/Player');
const ApiError = require('../utils/ApiError');

// @desc    Get user's predictions for a match
// @route   GET /api/predictions/:matchId
const getPredictions = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOne({
      userId: req.user._id,
      matchId: req.params.matchId
    });

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit predictions
// @route   POST /api/predictions/:matchId
const submitPredictions = async (req, res, next) => {
  try {
    const { predictions } = req.body;
    const matchId = req.params.matchId;

    // Check if match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return next(new ApiError(404, 'Match not found'));
    }

    // Check if match has started
    if (match.status !== 'upcoming') {
      return next(new ApiError(400, 'Predictions are closed for this match'));
    }

    if (new Date() >= match.lockTime) {
      return next(new ApiError(400, 'Prediction deadline has passed'));
    }

    // Validate predictions format
    const requiredFields = ['totalScore', 'mostSixes', 'mostFours', 'mostWickets', 'powerplayScore', 'fiftiesCount'];
    for (const field of requiredFields) {
      if (predictions[field] === undefined || predictions[field].answer === undefined) {
        return next(new ApiError(400, `Missing prediction for ${field}`));
      }
    }

    // Build predictions object
    const predictionData = {
      totalScore: { answer: predictions.totalScore.answer },
      mostSixes: {
        answer: predictions.mostSixes.answer,
        answerName: predictions.mostSixes.answerName
      },
      mostFours: {
        answer: predictions.mostFours.answer,
        answerName: predictions.mostFours.answerName
      },
      mostWickets: {
        answer: predictions.mostWickets.answer,
        answerName: predictions.mostWickets.answerName
      },
      powerplayScore: { answer: predictions.powerplayScore.answer },
      fiftiesCount: { answer: predictions.fiftiesCount.answer }
    };

    // Check for existing prediction
    let prediction = await Prediction.findOne({
      userId: req.user._id,
      matchId
    });

    if (prediction) {
      if (prediction.isLocked) {
        return next(new ApiError(400, 'Your predictions are locked'));
      }

      // Update existing prediction
      prediction.predictions = predictionData;
      await prediction.save();
    } else {
      // Create new prediction
      prediction = await Prediction.create({
        userId: req.user._id,
        matchId,
        predictions: predictionData
      });
    }

    res.status(prediction.isNew ? 201 : 200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prediction options (players for selection)
// @route   GET /api/predictions/:matchId/options
const getPredictionOptions = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.matchId).lean();

    if (!match) {
      return next(new ApiError(404, 'Match not found'));
    }

    // Get players from both teams
    const players = await Player.find({
      team: { $in: [match.team1.shortName, match.team2.shortName] },
      isActive: true
    })
      .select('_id name shortName team role')
      .sort({ name: 1 })
      .lean();

    // Group by team
    const team1Players = players.filter(p => p.team === match.team1.shortName);
    const team2Players = players.filter(p => p.team === match.team2.shortName);

    res.json({
      success: true,
      data: {
        team1: {
          name: match.team1.name,
          shortName: match.team1.shortName,
          players: team1Players
        },
        team2: {
          name: match.team2.name,
          shortName: match.team2.shortName,
          players: team2Players
        },
        allPlayers: players
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPredictions,
  submitPredictions,
  getPredictionOptions
};
