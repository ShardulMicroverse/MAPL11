const Player = require('../models/Player');

/**
 * Normalize name for matching
 */
const normalizeName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
};

/**
 * Calculate similarity between two strings (0 to 1)
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  // Substring match boost
  if (longer.includes(shorter)) {
    return Math.min(1, shorter.length / longer.length + 0.4);
  }
  
  // Check if words match
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  
  let matchedWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || (w1.length > 2 && w2.length > 2 && (w1.includes(w2) || w2.includes(w1)))) {
        matchedWords++;
        break;
      }
    }
  }
  
  if (matchedWords > 0) {
    const wordMatchScore = matchedWords / Math.max(words1.length, words2.length);
    if (wordMatchScore >= 0.5) {
      return Math.min(1, wordMatchScore + 0.3);
    }
  }
  
  // Levenshtein-based similarity
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / longer.length;
};

/**
 * Extract last name from full name
 */
const getLastName = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1];
};

/**
 * Get team short name from full team name
 */
const getTeamShortName = (teamName) => {
  if (!teamName) return null;
  
  const teamMappings = {
    'india': 'IND',
    'new zealand': 'NZ',
    'australia': 'AUS',
    'england': 'ENG',
    'pakistan': 'PAK',
    'south africa': 'SA',
    'sri lanka': 'SL',
    'bangladesh': 'BAN',
    'west indies': 'WI',
    'afghanistan': 'AFG',
    'ireland': 'IRE',
    'zimbabwe': 'ZIM',
    'scotland': 'SCO',
    'netherlands': 'NED',
    'nepal': 'NEP',
    'uae': 'UAE',
    'oman': 'OMN',
    'namibia': 'NAM',
    'usa': 'USA',
    'canada': 'CAN'
  };
  
  const normalized = teamName.toLowerCase().trim();
  return teamMappings[normalized] || teamName.substring(0, 3).toUpperCase();
};

/**
 * Find matching player from database
 */
const findMatchingPlayer = async (playerName, teamName = null) => {
  if (!playerName) return null;
  
  const normalizedInput = normalizeName(playerName);
  const inputLastName = normalizeName(getLastName(playerName));
  
  // Build query
  const query = { isActive: true };
  if (teamName) {
    const shortName = getTeamShortName(teamName);
    if (shortName) {
      query.team = shortName;
    }
  }
  
  const players = await Player.find(query).lean();
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const player of players) {
    // Full name similarity
    const fullNameScore = calculateSimilarity(playerName, player.name);
    
    // Short name similarity
    const shortNameScore = player.shortName 
      ? calculateSimilarity(playerName, player.shortName)
      : 0;
    
    // Last name similarity
    const playerLastName = getLastName(player.name);
    const lastNameScore = calculateSimilarity(inputLastName, normalizeName(playerLastName));
    
    // First name + last name match
    const inputParts = playerName.toLowerCase().split(' ');
    const playerParts = player.name.toLowerCase().split(' ');
    
    let namePartsScore = 0;
    if (inputParts.length >= 2 && playerParts.length >= 2) {
      // Check if last names match
      if (inputParts[inputParts.length - 1] === playerParts[playerParts.length - 1]) {
        namePartsScore = 0.8;
        // Bonus if first initial matches
        if (inputParts[0][0] === playerParts[0][0]) {
          namePartsScore = 0.95;
        }
      }
    }
    
    // Take best score
    const score = Math.max(
      fullNameScore,
      shortNameScore,
      lastNameScore * 0.85,
      namePartsScore
    );
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = player;
    }
  }
  
  // Threshold for accepting match
  const THRESHOLD = 0.6;
  
  if (bestScore >= THRESHOLD) {
    return {
      player: bestMatch,
      confidence: bestScore,
      matchType: bestScore >= 0.95 ? 'exact' : 'fuzzy'
    };
  }
  
  return null;
};

/**
 * Find matching match from database
 */
const findMatchingMatch = async (matchInfo) => {
  const Match = require('../models/Match');
  
  const { date, firstInningsBattingTeam, secondInningsBattingTeam } = matchInfo;
  
  if (!date) return null;
  
  const matchDate = new Date(date);
  const dayStart = new Date(matchDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(matchDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  // Team names to search for
  const teamNames = [firstInningsBattingTeam, secondInningsBattingTeam].filter(Boolean);
  
  // Get team short names
  const teamShortNames = teamNames.map(t => getTeamShortName(t));
  
  // Find matches on that date
  const matches = await Match.find({
    matchDate: { $gte: dayStart, $lte: dayEnd }
  }).lean();
  
  for (const match of matches) {
    const matchTeams = [
      match.team1.name.toLowerCase(),
      match.team1.shortName.toLowerCase(),
      match.team2.name.toLowerCase(),
      match.team2.shortName.toLowerCase()
    ];
    
    let teamsMatched = 0;
    
    for (const teamName of teamNames) {
      const normalizedTeam = teamName.toLowerCase();
      const shortName = getTeamShortName(teamName)?.toLowerCase();
      
      const isMatch = matchTeams.some(mt => 
        mt === normalizedTeam || 
        mt === shortName ||
        mt.includes(normalizedTeam) || 
        normalizedTeam.includes(mt)
      );
      
      if (isMatch) teamsMatched++;
    }
    
    // Both teams matched
    if (teamsMatched >= 2) {
      return match;
    }
  }
  
  // Try without date if no match found
  if (teamShortNames.length >= 2) {
    const matchByTeams = await Match.findOne({
      $or: [
        { 'team1.shortName': teamShortNames[0], 'team2.shortName': teamShortNames[1] },
        { 'team1.shortName': teamShortNames[1], 'team2.shortName': teamShortNames[0] }
      ],
      scorecardId: null // Only matches without scorecard
    }).sort({ matchDate: -1 }).lean();
    
    if (matchByTeams) return matchByTeams;
  }
  
  return null;
};

module.exports = {
  normalizeName,
  calculateSimilarity,
  findMatchingPlayer,
  findMatchingMatch,
  getTeamShortName
};