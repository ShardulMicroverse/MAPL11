/**
 * Admin Controller
 * Handles data synchronization from Cricket API
 */

const cricketApiService = require('../services/cricketApiService');
const Match = require('../models/Match');
const Player = require('../models/Player');
const ApiError = require('../utils/ApiError');

const scorecardImportService = require('../services/scorecardImportService');
const MatchScorecard = require('../models/MatchScorecard');

/**
 * Check API status
 * GET /api/admin/api-status
 */
const checkApiStatus = async (req, res, next) => {
  try {
    const isConfigured = cricketApiService.isApiConfigured();

    if (!isConfigured) {
      return res.json({
        success: true,
        data: {
          configured: false,
          message: 'Cricket API key not configured. Add CRICKET_API_KEY to your .env file.'
        }
      });
    }

    // Test API connection
    try {
      const series = await cricketApiService.getSeries();
      res.json({
        success: true,
        data: {
          configured: true,
          connected: true,
          seriesCount: series.length
        }
      });
    } catch (apiError) {
      res.json({
        success: true,
        data: {
          configured: true,
          connected: false,
          error: apiError.message
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get available series/tournaments from API
 * GET /api/admin/series
 */
const getAvailableSeries = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    const series = await cricketApiService.getSeries();

    // Filter for T20 World Cup or India matches if needed
    const filteredSeries = series.filter(s =>
      s.name?.toLowerCase().includes('t20') ||
      s.name?.toLowerCase().includes('world cup') ||
      s.name?.toLowerCase().includes('india')
    );

    res.json({
      success: true,
      count: filteredSeries.length,
      data: filteredSeries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current/live matches from API
 * GET /api/admin/live-matches
 */
const getLiveMatchesFromApi = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    const matches = await cricketApiService.getCurrentMatches();

    // Filter for India matches if needed
    const indiaMatches = matches.filter(m =>
      m.teams?.some(t => t?.toLowerCase().includes('india')) ||
      m.name?.toLowerCase().includes('india')
    );

    res.json({
      success: true,
      count: indiaMatches.length,
      allMatchesCount: matches.length,
      data: indiaMatches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync matches from API to database
 * POST /api/admin/sync-matches
 */
const syncMatchesFromApi = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    const { seriesId, matchIds } = req.body;

    let matchesToSync = [];

    if (seriesId) {
      // Get matches from a specific series
      const seriesData = await cricketApiService.getSeriesMatches(seriesId);
      matchesToSync = seriesData.matchList || [];
    } else if (matchIds && matchIds.length > 0) {
      // Get specific matches by ID
      for (const id of matchIds) {
        const matchInfo = await cricketApiService.getMatchInfo(id);
        if (matchInfo) {
          matchesToSync.push(matchInfo);
        }
      }
    } else {
      // Get current matches
      matchesToSync = await cricketApiService.getCurrentMatches();
    }

    // Filter for India matches
    const indiaMatches = matchesToSync.filter(m =>
      m.teams?.some(t => t?.toLowerCase().includes('india')) ||
      m.name?.toLowerCase().includes('india')
    );

    const results = {
      synced: 0,
      updated: 0,
      errors: []
    };

    for (const apiMatch of indiaMatches) {
      try {
        const matchData = cricketApiService.transformMatchData(apiMatch);

        // Check if match already exists
        const existing = await Match.findOne({ externalMatchId: matchData.externalMatchId });

        if (existing) {
          // Update existing match
          await Match.findByIdAndUpdate(existing._id, matchData);
          results.updated++;
        } else {
          // Create new match
          await Match.create(matchData);
          results.synced++;
        }
      } catch (err) {
        results.errors.push({
          matchId: apiMatch.id,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalFound: indiaMatches.length,
        ...results
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync squad/players from API
 * POST /api/admin/sync-players
 */
const syncPlayersFromApi = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    const { seriesId, teamNames } = req.body;

    if (!seriesId) {
      return next(new ApiError(400, 'Series ID is required'));
    }

    const squads = await cricketApiService.getSeriesSquad(seriesId);

    const results = {
      synced: 0,
      updated: 0,
      errors: []
    };

    for (const team of squads) {
      // Filter by team names if provided
      if (teamNames && teamNames.length > 0) {
        const teamName = team.teamName?.toLowerCase() || '';
        if (!teamNames.some(t => teamName.includes(t.toLowerCase()))) {
          continue;
        }
      }

      const teamShortName = team.teamSName || team.teamName?.substring(0, 3).toUpperCase() || 'UNK';

      for (const apiPlayer of (team.players || [])) {
        try {
          const playerData = cricketApiService.transformPlayerData(apiPlayer, teamShortName);

          // Check if player already exists
          const existing = await Player.findOne({ externalPlayerId: playerData.externalPlayerId });

          if (existing) {
            // Update existing player
            await Player.findByIdAndUpdate(existing._id, playerData);
            results.updated++;
          } else {
            // Create new player
            await Player.create(playerData);
            results.synced++;
          }
        } catch (err) {
          results.errors.push({
            playerId: apiPlayer.id,
            playerName: apiPlayer.name,
            error: err.message
          });
        }
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update live scores from API
 * POST /api/admin/update-live-scores
 */
const updateLiveScores = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    // Get all live matches from our database
    const liveMatches = await Match.find({ status: 'live' });

    const results = {
      updated: 0,
      errors: []
    };

    for (const match of liveMatches) {
      if (!match.externalMatchId) continue;

      try {
        // Fetch latest score from API
        const scorecard = await cricketApiService.getMatchScorecard(match.externalMatchId);

        if (scorecard) {
          // Extract live data
          const lastInnings = scorecard.scoreCard?.[scorecard.scoreCard.length - 1];

          const liveData = {
            currentInnings: scorecard.scoreCard?.length || 1,
            currentScore: lastInnings?.scoreDetails ?
              `${lastInnings.scoreDetails.runs}/${lastInnings.scoreDetails.wickets}` : '0/0',
            currentOver: lastInnings?.scoreDetails?.overs?.toString() || '0',
            battingTeam: lastInnings?.batTeamName || '',
            lastUpdated: new Date()
          };

          // Check if match is completed
          const matchInfo = await cricketApiService.getMatchInfo(match.externalMatchId);
          const isCompleted = matchInfo?.matchEnded;

          const updateData = { liveData };

          if (isCompleted) {
            updateData.status = 'completed';
            updateData.isTeamSelectionOpen = false;

            // Extract final stats
            const stats = cricketApiService.extractMatchStats(scorecard);
            if (stats) {
              updateData.statsSnapshot = stats;
            }

            // Set result
            updateData.result = {
              winner: matchInfo.matchWinner || '',
              summary: matchInfo.status || '',
              team1Score: scorecard.scoreCard?.[0]?.scoreDetails ?
                `${scorecard.scoreCard[0].scoreDetails.runs}/${scorecard.scoreCard[0].scoreDetails.wickets} (${scorecard.scoreCard[0].scoreDetails.overs})` : '',
              team2Score: scorecard.scoreCard?.[1]?.scoreDetails ?
                `${scorecard.scoreCard[1].scoreDetails.runs}/${scorecard.scoreCard[1].scoreDetails.wickets} (${scorecard.scoreCard[1].scoreDetails.overs})` : ''
            };
          }

          await Match.findByIdAndUpdate(match._id, updateData);
          results.updated++;
        }
      } catch (err) {
        results.errors.push({
          matchId: match._id,
          externalId: match.externalMatchId,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search for players in API
 * GET /api/admin/search-players?q=virat
 */
const searchPlayersInApi = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    const { q } = req.query;
    if (!q || q.length < 2) {
      return next(new ApiError(400, 'Search query must be at least 2 characters'));
    }

    const players = await cricketApiService.searchPlayers(q);

    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a player from API search to database
 * POST /api/admin/add-player
 */
const addPlayerFromApi = async (req, res, next) => {
  try {
    const { playerId, team, creditValue } = req.body;

    if (!playerId) {
      return next(new ApiError(400, 'Player ID is required'));
    }

    // Get player info from API
    const playerInfo = await cricketApiService.getPlayerInfo(playerId);

    if (!playerInfo) {
      return next(new ApiError(404, 'Player not found in API'));
    }

    // Check if player already exists
    const existing = await Player.findOne({ externalPlayerId: playerId });
    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: 'Player already exists in database'
      });
    }

    // Determine role
    let role = 'Batsman';
    if (playerInfo.role) {
      const roleStr = playerInfo.role.toLowerCase();
      if (roleStr.includes('keeper') || roleStr.includes('wk')) {
        role = 'Wicket-Keeper';
      } else if (roleStr.includes('allrounder') || roleStr.includes('all-rounder')) {
        role = 'All-Rounder';
      } else if (roleStr.includes('bowler')) {
        role = 'Bowler';
      }
    }

    // Create player
    const player = await Player.create({
      externalPlayerId: playerId,
      name: playerInfo.name,
      shortName: playerInfo.name?.split(' ').pop() || playerInfo.name,
      team: team || playerInfo.country || 'UNK',
      role: role,
      battingStyle: playerInfo.battingStyle || '',
      bowlingStyle: playerInfo.bowlingStyle || '',
      creditValue: creditValue || 8.5,
      image: playerInfo.playerImg || '',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk add players by searching team name
 * POST /api/admin/add-team-players
 */
const addTeamPlayers = async (req, res, next) => {
  try {
    if (!cricketApiService.isApiConfigured()) {
      return next(new ApiError(400, 'Cricket API key not configured'));
    }

    const { teamName, teamShortName } = req.body;

    if (!teamName) {
      return next(new ApiError(400, 'Team name is required'));
    }

    // Search for players from this team
    const searchResults = await cricketApiService.searchPlayers(teamName);

    const results = {
      found: searchResults.length,
      added: 0,
      skipped: 0,
      errors: []
    };

    for (const apiPlayer of searchResults) {
      try {
        // Check if already exists
        const existing = await Player.findOne({ externalPlayerId: apiPlayer.id });
        if (existing) {
          results.skipped++;
          continue;
        }

        // Get detailed player info
        let playerInfo = apiPlayer;
        try {
          const detailedInfo = await cricketApiService.getPlayerInfo(apiPlayer.id);
          if (detailedInfo) {
            playerInfo = { ...apiPlayer, ...detailedInfo };
          }
        } catch (e) {
          // Use basic info if detailed fetch fails
        }

        // Determine role
        let role = 'Batsman';
        if (playerInfo.role) {
          const roleStr = playerInfo.role.toLowerCase();
          if (roleStr.includes('keeper') || roleStr.includes('wk')) {
            role = 'Wicket-Keeper';
          } else if (roleStr.includes('allrounder') || roleStr.includes('all-rounder')) {
            role = 'All-Rounder';
          } else if (roleStr.includes('bowler')) {
            role = 'Bowler';
          }
        }

        // Assign credit value based on role
        let creditValue = 8.0;
        if (role === 'Wicket-Keeper') creditValue = 8.5;
        else if (role === 'All-Rounder') creditValue = 9.0;
        else if (role === 'Bowler') creditValue = 8.0;
        else creditValue = 8.5;

        // Add some randomness
        creditValue += (Math.random() * 1.5 - 0.5);
        creditValue = Math.round(creditValue * 10) / 10;
        creditValue = Math.max(7.0, Math.min(11.0, creditValue));

        await Player.create({
          externalPlayerId: apiPlayer.id,
          name: playerInfo.name,
          shortName: playerInfo.name?.split(' ').pop() || playerInfo.name,
          team: teamShortName || teamName.substring(0, 3).toUpperCase(),
          role: role,
          battingStyle: playerInfo.battingStyle || '',
          bowlingStyle: playerInfo.bowlingStyle || '',
          creditValue: creditValue,
          image: playerInfo.playerImg || '',
          isActive: true
        });

        results.added++;
      } catch (err) {
        results.errors.push({ player: apiPlayer.name, error: err.message });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all players from database
 * GET /api/admin/players
 */
const getPlayersFromDb = async (req, res, next) => {
  try {
    const { team } = req.query;
    const filter = {};
    if (team) filter.team = team;

    const players = await Player.find(filter).sort({ team: 1, name: 1 });

    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Import scorecard from CSV
 * POST /api/admin/import-scorecard
 */
const importScorecard = async (req, res, next) => {
  try {
    const { csvContent, matchId } = req.body;
    
    if (!csvContent) {
      return next(new ApiError(400, 'CSV content is required'));
    }
    
    const result = await scorecardImportService.importScorecard(
      csvContent,
      matchId || null,
      req.user._id
    );
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all imported scorecards
 * GET /api/admin/scorecards
 */
const getScorecards = async (req, res, next) => {
  try {
    const scorecards = await scorecardImportService.getAllScorecards();
    
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
 * Get scorecard by match ID
 * GET /api/admin/scorecards/:matchId
 */
const getScorecardByMatch = async (req, res, next) => {
  try {
    const scorecard = await scorecardImportService.getScorecardByMatchId(req.params.matchId);
    
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

/**
 * Delete scorecard
 * DELETE /api/admin/scorecards/:id
 */
const deleteScorecardById = async (req, res, next) => {
  try {
    const deleted = await scorecardImportService.deleteScorecard(req.params.id);
    
    if (!deleted) {
      return next(new ApiError(404, 'Scorecard not found'));
    }
    
    res.json({
      success: true,
      message: 'Scorecard deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get matches without scorecards
 * GET /api/admin/matches-without-scorecards
 */
const getMatchesWithoutScorecards = async (req, res, next) => {
  try {
    const matches = await Match.find({
      scorecardId: null
    }).sort({ matchDate: -1 }).lean();
    
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Delete a player
 * DELETE /api/admin/players/:id
 */
const deletePlayer = async (req, res, next) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);

    if (!player) {
      return next(new ApiError(404, 'Player not found'));
    }

    res.json({
      success: true,
      message: 'Player deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  // NEW exports
  importScorecard,
  getScorecards,
  getScorecardByMatch,
  deleteScorecardById,
  getMatchesWithoutScorecards
};
