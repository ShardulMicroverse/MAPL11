const MatchScorecard = require('../models/MatchScorecard');
const Match = require('../models/Match');
const { findMatchingPlayer, findMatchingMatch, getTeamShortName } = require('../utils/playerMatcher');

/**
 * Parse CSV content into lines and cells
 */
const parseCSV = (csvContent) => {
  const lines = csvContent.split('\n').map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
  
  return lines;
};

/**
 * Parse date string like "28th January, 2026"
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  const cleaned = dateStr.replace(/(st|nd|rd|th)/gi, '');
  const parsed = new Date(cleaned);
  
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Extract match info from parsed CSV
 */
const extractMatchInfo = (lines) => {
  const matchInfo = {};
  let inMatchInfo = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineText = line.join(' ');
    
    if (lineText.includes('MATCH INFORMATION')) {
      inMatchInfo = true;
      continue;
    }
    
    if (inMatchInfo && lineText.includes('===')) {
      break;
    }
    
    if (inMatchInfo && line[0] && line[1] !== undefined) {
      const key = line[0].trim();
      const value = line[1].trim();
      
      switch (key) {
        case 'Match Number':
          matchInfo.matchNumber = value;
          break;
        case 'Series':
          matchInfo.series = value;
          break;
        case 'Venue':
          matchInfo.venue = value;
          break;
        case 'Date':
          matchInfo.date = parseDate(value);
          break;
        case 'Result':
          matchInfo.result = value;
          break;
        case 'Toss':
          matchInfo.toss = value;
          break;
        case 'Match Type':
          matchInfo.matchType = value;
          break;
        case 'Overs':
          matchInfo.overs = parseInt(value) || 20;
          break;
        case 'Player of the Match':
          matchInfo.playerOfTheMatch = value;
          break;
      }
    }
  }
  
  return matchInfo;
};

/**
 * Extract innings data from parsed CSV
 */
const extractInnings = (lines, inningsMarker) => {
  const innings = {
    battingTeam: '',
    bowlingTeam: '',
    batting: [],
    bowling: [],
    extras: { total: 0, details: '' },
    total: { runs: 0, wickets: '', overs: '', runRate: 0 },
    fallOfWickets: [],
    didNotBat: []
  };
  
  let section = null;
  let foundInnings = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineText = line.join(' ');
    
    // Find innings batting section
    if (lineText.includes(inningsMarker) && lineText.includes('BATTING')) {
      const match = lineText.match(/(?:^|\s)([A-Z][A-Z\s]+?)\s+BATTING/);
      if (match) {
        innings.battingTeam = match[1].trim();
      }
      section = 'batting';
      foundInnings = true;
      continue;
    }
    
    // Find innings bowling section
    if (lineText.includes(inningsMarker) && lineText.includes('BOWLING')) {
      const match = lineText.match(/(?:^|\s)([A-Z][A-Z\s]+?)\s+BOWLING/);
      if (match) {
        innings.bowlingTeam = match[1].trim();
      }
      section = 'bowling';
      continue;
    }
    
    if (!foundInnings) continue;
    
    // Check for next innings marker (stop parsing)
    const otherInnings = inningsMarker === '1ST INNINGS' ? '2ND INNINGS' : '1ST INNINGS';
    if (lineText.includes(otherInnings)) {
      break;
    }
    
    // Skip header rows
    if (line[0] === 'Name' || lineText.includes('===')) {
      continue;
    }
    
    // Parse batting section
    if (section === 'batting') {
      // Extras row
      if (line[0] === 'Extras') {
        innings.extras = {
          details: line[1] || '',
          total: parseInt(line[2]) || 0
        };
        continue;
      }
      
      // Total row
      if (line[0] === 'TOTAL') {
        innings.total = {
          wickets: line[1] || '',
          runs: parseInt(line[2]) || 0,
          overs: (line[3] || '').replace(' overs', '').trim(),
          runRate: parseFloat((line[4] || '').replace('Run Rate:', '').trim()) || 0
        };
        continue;
      }
      
      // Did Not Bat
      if (line[0] === 'Did Not Bat') {
        innings.didNotBat = (line[1] || '').split(',').map(p => p.trim()).filter(Boolean);
        continue;
      }
      
      // Fall of Wickets
      if (line[0] === 'Fall of Wickets') {
        section = 'fow';
        continue;
      }
      
      // Regular batting row
      if (line[0] && line[2] !== undefined && line[0] !== 'Name') {
        const name = line[0];
        
        // Skip invalid entries
        if (name.includes('===') || name === 'TOTAL' || name === 'Extras') continue;
        
        const runs = parseInt(line[2]);
        if (isNaN(runs)) continue;
        
        innings.batting.push({
          playerName: name,
          dismissal: line[1] || '',
          runs: runs,
          balls: parseInt(line[3]) || 0,
          fours: parseInt(line[4]) || 0,
          sixes: parseInt(line[5]) || 0,
          strikeRate: parseFloat(line[6]) || 0
        });
      }
    }
    
    // Parse bowling section
    if (section === 'bowling') {
      if (line[0] && line[1] !== undefined && line[0] !== 'Name') {
        const name = line[0];
        
        // Skip invalid entries
        if (name.includes('===') || name.includes('NOTE:')) break;
        
        const overs = parseFloat(line[1]);
        if (isNaN(overs)) continue;
        
        innings.bowling.push({
          playerName: name,
          overs: overs,
          maidens: parseInt(line[2]) || 0,
          runs: parseInt(line[3]) || 0,
          wickets: parseInt(line[4]) || 0,
          economy: parseFloat(line[5]) || 0
        });
      }
    }
    
    // Parse fall of wickets
    if (section === 'fow') {
      if (line[1]) {
        innings.fallOfWickets.push(line[1]);
      }
      // Check for section end
      if (lineText.includes('===') || !line[1]) {
        section = null;
      }
    }
  }
  
  return innings;
};

/**
 * Compute stats for predictions
 */
const computeStats = (firstInnings, secondInnings) => {
  const stats = {
    totalMatchScore: 0,
    mostSixes: { playerName: '', count: 0, playerId: null },
    mostFours: { playerName: '', count: 0, playerId: null },
    mostWickets: { playerName: '', count: 0, playerId: null },
    powerplayScore: 0,
    fiftiesCount: 0
  };
  
  // Total match score
  stats.totalMatchScore = (firstInnings.total.runs || 0) + (secondInnings.total.runs || 0);
  
  // Combine all batting performances
  const allBatting = [...(firstInnings.batting || []), ...(secondInnings.batting || [])];
  const allBowling = [...(firstInnings.bowling || []), ...(secondInnings.bowling || [])];
  
  // Find most sixes, fours, and count fifties
  for (const batsman of allBatting) {
    if (batsman.sixes > stats.mostSixes.count) {
      stats.mostSixes = {
        playerName: batsman.playerName,
        count: batsman.sixes,
        playerId: batsman.playerId || null
      };
    }
    
    if (batsman.fours > stats.mostFours.count) {
      stats.mostFours = {
        playerName: batsman.playerName,
        count: batsman.fours,
        playerId: batsman.playerId || null
      };
    }
    
    if (batsman.runs >= 50) {
      stats.fiftiesCount++;
    }
  }
  
  // Find most wickets
  for (const bowler of allBowling) {
    if (bowler.wickets > stats.mostWickets.count) {
      stats.mostWickets = {
        playerName: bowler.playerName,
        count: bowler.wickets,
        playerId: bowler.playerId || null
      };
    }
  }
  
  return stats;
};

/**
 * Extract winner from result string
 */
const extractWinner = (resultString) => {
  if (!resultString) return '';
  
  const match = resultString.match(/^([\w\s]+?)\s+won/i);
  return match ? match[1].trim() : '';
};

/**
 * Main import function
 */
const importScorecard = async (csvContent, matchId, userId) => {
  const result = {
    success: false,
    matchFound: false,
    matchId: null,
    playersMatched: 0,
    playersUnmatched: 0,
    unmatchedPlayers: [],
    errors: []
  };
  
  try {
    // Parse CSV
    const lines = parseCSV(csvContent);
    
    // Extract match info
    const matchInfo = extractMatchInfo(lines);
    
    // Extract innings data
    const firstInnings = extractInnings(lines, '1ST INNINGS');
    const secondInnings = extractInnings(lines, '2ND INNINGS');
    
    // Validate we have data
    if (firstInnings.batting.length === 0 && secondInnings.batting.length === 0) {
      result.errors.push('No batting data found in CSV. Please check the file format.');
      return result;
    }
    
    // Find matching match
    let match = null;
    
    if (matchId) {
      match = await Match.findById(matchId);
      if (!match) {
        result.errors.push('Provided match ID not found in database.');
        return result;
      }
    }
    
    if (!match) {
      match = await findMatchingMatch({
        date: matchInfo.date,
        firstInningsBattingTeam: firstInnings.battingTeam,
        secondInningsBattingTeam: secondInnings.battingTeam
      });
    }
    
    if (!match) {
      result.errors.push(
        `Could not find matching match. Teams: ${firstInnings.battingTeam} vs ${secondInnings.battingTeam}, Date: ${matchInfo.date?.toDateString() || 'unknown'}. Please select a match manually.`
      );
      return result;
    }
    
    result.matchFound = true;
    result.matchId = match._id;
    
    // Check if scorecard already exists
    const existingScorecard = await MatchScorecard.findOne({ matchId: match._id });
    if (existingScorecard) {
      result.errors.push('Scorecard already exists for this match. Delete it first to reimport.');
      return result;
    }
    
    // Match players for first innings batting
    for (const batsman of firstInnings.batting) {
      const matchResult = await findMatchingPlayer(batsman.playerName, firstInnings.battingTeam);
      if (matchResult) {
        batsman.playerId = matchResult.player._id;
        batsman.isMatched = true;
        result.playersMatched++;
      } else {
        batsman.isMatched = false;
        result.playersUnmatched++;
        result.unmatchedPlayers.push(`${batsman.playerName} (${firstInnings.battingTeam} - batting)`);
      }
    }
    
    // Match players for first innings bowling
    for (const bowler of firstInnings.bowling) {
      const matchResult = await findMatchingPlayer(bowler.playerName, firstInnings.bowlingTeam);
      if (matchResult) {
        bowler.playerId = matchResult.player._id;
        bowler.isMatched = true;
        result.playersMatched++;
      } else {
        bowler.isMatched = false;
        result.playersUnmatched++;
        result.unmatchedPlayers.push(`${bowler.playerName} (${firstInnings.bowlingTeam} - bowling)`);
      }
    }
    
    // Match players for second innings batting
    for (const batsman of secondInnings.batting) {
      const matchResult = await findMatchingPlayer(batsman.playerName, secondInnings.battingTeam);
      if (matchResult) {
        batsman.playerId = matchResult.player._id;
        batsman.isMatched = true;
        result.playersMatched++;
      } else {
        batsman.isMatched = false;
        result.playersUnmatched++;
        result.unmatchedPlayers.push(`${batsman.playerName} (${secondInnings.battingTeam} - batting)`);
      }
    }
    
    // Match players for second innings bowling
    for (const bowler of secondInnings.bowling) {
      const matchResult = await findMatchingPlayer(bowler.playerName, secondInnings.bowlingTeam);
      if (matchResult) {
        bowler.playerId = matchResult.player._id;
        bowler.isMatched = true;
        result.playersMatched++;
      } else {
        bowler.isMatched = false;
        result.playersUnmatched++;
        result.unmatchedPlayers.push(`${bowler.playerName} (${secondInnings.bowlingTeam} - bowling)`);
      }
    }
    
    // Compute stats
    const computedStats = computeStats(firstInnings, secondInnings);
    
    // Update computed stats with matched player IDs
    const allBatting = [...firstInnings.batting, ...secondInnings.batting];
    const allBowling = [...firstInnings.bowling, ...secondInnings.bowling];
    
    const mostSixesBatsman = allBatting.find(b => b.playerName === computedStats.mostSixes.playerName);
    if (mostSixesBatsman?.playerId) {
      computedStats.mostSixes.playerId = mostSixesBatsman.playerId;
    }
    
    const mostFoursBatsman = allBatting.find(b => b.playerName === computedStats.mostFours.playerName);
    if (mostFoursBatsman?.playerId) {
      computedStats.mostFours.playerId = mostFoursBatsman.playerId;
    }
    
    const mostWicketsBowler = allBowling.find(b => b.playerName === computedStats.mostWickets.playerName);
    if (mostWicketsBowler?.playerId) {
      computedStats.mostWickets.playerId = mostWicketsBowler.playerId;
    }
    
    // Create scorecard
    const scorecard = await MatchScorecard.create({
      matchId: match._id,
      matchInfo,
      firstInnings,
      secondInnings,
      computedStats,
      importedBy: userId
    });
    
    // Determine team scores for result
    let team1Score = '';
    let team2Score = '';
    
    // First innings was batted by one team, second by another
    const firstBattingTeamShort = getTeamShortName(firstInnings.battingTeam);
    
    if (match.team1.shortName === firstBattingTeamShort || 
        match.team1.name.toLowerCase().includes(firstInnings.battingTeam.toLowerCase())) {
      team1Score = `${firstInnings.total.runs}/${firstInnings.total.wickets} (${firstInnings.total.overs})`;
      team2Score = `${secondInnings.total.runs}/${secondInnings.total.wickets} (${secondInnings.total.overs})`;
    } else {
      team2Score = `${firstInnings.total.runs}/${firstInnings.total.wickets} (${firstInnings.total.overs})`;
      team1Score = `${secondInnings.total.runs}/${secondInnings.total.wickets} (${secondInnings.total.overs})`;
    }
    
    // Update match with scorecard reference and result
    await Match.findByIdAndUpdate(match._id, {
      scorecardId: scorecard._id,
      status: 'completed',
      isTeamSelectionOpen: false,
      result: {
        winner: extractWinner(matchInfo.result),
        summary: matchInfo.result || '',
        team1Score,
        team2Score
      },
      statsSnapshot: {
        totalScore: computedStats.totalMatchScore,
        mostSixes: computedStats.mostSixes,
        mostFours: computedStats.mostFours,
        mostWickets: computedStats.mostWickets,
        powerplayScore: computedStats.powerplayScore,
        fiftiesCount: computedStats.fiftiesCount
      }
    });
    
    result.success = true;
    result.scorecardId = scorecard._id;
    
    return result;
    
  } catch (error) {
    console.error('Scorecard import error:', error);
    result.errors.push(error.message);
    return result;
  }
};

/**
 * Get all scorecards
 */
const getAllScorecards = async () => {
  return MatchScorecard.find()
    .populate('matchId', 'team1 team2 matchDate')
    .populate('importedBy', 'displayName')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get scorecard by match ID
 */
const getScorecardByMatchId = async (matchId) => {
  return MatchScorecard.findOne({ matchId })
    .populate('matchId')
    .populate('firstInnings.batting.playerId', 'name team')
    .populate('firstInnings.bowling.playerId', 'name team')
    .populate('secondInnings.batting.playerId', 'name team')
    .populate('secondInnings.bowling.playerId', 'name team')
    .lean();
};

/**
 * Delete scorecard
 */
const deleteScorecard = async (scorecardId) => {
  const scorecard = await MatchScorecard.findById(scorecardId);
  if (!scorecard) return false;
  
  // Remove reference from match
  await Match.findByIdAndUpdate(scorecard.matchId, {
    scorecardId: null
  });
  
  await scorecard.deleteOne();
  return true;
};

module.exports = {
  parseCSV,
  importScorecard,
  getAllScorecards,
  getScorecardByMatchId,
  deleteScorecard
};