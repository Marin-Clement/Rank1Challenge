const config = require('./config.json');

const riotKey = config.riotKey;
const server = config.server;
const matchServer = config.matchServer;

// return accountId, puuid, name, profileIconId, revisionDate, summonerLevel
async function getSummoner(summonerName) {
  const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotKey}`;
  const response = await fetch(url);
  return await response.json();
}

// leagueId, queueType, tier, rank, summonerId, summonerName, leaguePoints, wins, losses, veteran, inactive, freshBlood, hotStreak
async function getSummonerStats(summonerId) {
    const url = `https://${server}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${riotKey}`;
    const response = await fetch(url);
    const summoner = await response.json();
    const rankedSoloDuo = summoner.filter((queue) => queue.queueType === "RANKED_SOLO_5x5");
    return rankedSoloDuo[0];
}

// return matchId, role, season, timestamp, champion, queue, lane

async function getMatch(matchId) {
  const url = `https://${matchServer}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotKey}`;
  const response = await fetch(url);
  return await response.json();
}

async function getSoloDuosMatchesFromThisWeek(puuid) {
    const currentTime = Math.floor(Date.now() / 1000);
    const startOfWeek = currentTime - 604800;
    const url = `https://${matchServer}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startOfWeek}&queue=420&endTime=${currentTime}&count=100&api_key=${riotKey}`;
    const response = await fetch(url);
    return await response.json();
}


// export methods

module.exports = {
    getSummoner,
    getSummonerStats,
    getMatch,
    getSoloDuosMatchesFromThisWeek
}