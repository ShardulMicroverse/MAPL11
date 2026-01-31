const mongoose = require('mongoose');

const battingPerformanceSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  playerName: {
    type: String,
    required: true
  },
  runs: {
    type: Number,
    default: 0
  },
  balls: {
    type: Number,
    default: 0
  },
  fours: {
    type: Number,
    default: 0
  },
  sixes: {
    type: Number,
    default: 0
  },
  strikeRate: {
    type: Number,
    default: 0
  },
  dismissal: {
    type: String,
    default: ''
  },
  isMatched: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const bowlingPerformanceSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  playerName: {
    type: String,
    required: true
  },
  overs: {
    type: Number,
    default: 0
  },
  maidens: {
    type: Number,
    default: 0
  },
  runs: {
    type: Number,
    default: 0
  },
  wickets: {
    type: Number,
    default: 0
  },
  economy: {
    type: Number,
    default: 0
  },
  isMatched: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const inningsSchema = new mongoose.Schema({
  battingTeam: {
    type: String,
    required: true
  },
  bowlingTeam: {
    type: String,
    required: true
  },
  batting: [battingPerformanceSchema],
  bowling: [bowlingPerformanceSchema],
  extras: {
    total: { type: Number, default: 0 },
    details: { type: String, default: '' }
  },
  total: {
    runs: { type: Number, default: 0 },
    wickets: { type: String, default: '' },
    overs: { type: String, default: '' },
    runRate: { type: Number, default: 0 }
  },
  fallOfWickets: [String],
  didNotBat: [String]
}, { _id: false });

const matchScorecardSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    unique: true
  },
  externalMatchCode: {
    type: String,
    sparse: true
  },
  matchInfo: {
    matchNumber: String,
    series: String,
    venue: String,
    date: Date,
    result: String,
    toss: String,
    matchType: String,
    overs: Number,
    playerOfTheMatch: String
  },
  firstInnings: inningsSchema,
  secondInnings: inningsSchema,
  computedStats: {
    totalMatchScore: { type: Number, default: 0 },
    mostSixes: {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      playerName: String,
      count: { type: Number, default: 0 }
    },
    mostFours: {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      playerName: String,
      count: { type: Number, default: 0 }
    },
    mostWickets: {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      playerName: String,
      count: { type: Number, default: 0 }
    },
    powerplayScore: { type: Number, default: 0 },
    fiftiesCount: { type: Number, default: 0 }
  },
  processingStatus: {
    fantasyPointsCalculated: { type: Boolean, default: false },
    predictionsEvaluated: { type: Boolean, default: false },
    leaderboardUpdated: { type: Boolean, default: false }
  },
  importedAt: {
    type: Date,
    default: Date.now
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

matchScorecardSchema.index({ matchId: 1 });
matchScorecardSchema.index({ externalMatchCode: 1 });
matchScorecardSchema.index({ 'matchInfo.date': 1 });

module.exports = mongoose.model('MatchScorecard', matchScorecardSchema);