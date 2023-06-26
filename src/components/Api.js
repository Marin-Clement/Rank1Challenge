const riotKey = "RGAPI-07aacd58-8668-43ec-9cf7-22f9d90a00d0";
const server = "euw1";
const matchServer = "europe";

async function getSummoner(summonerName) {
  const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotKey}`;
  const response = await fetch(url);
  return await response.json();
}

async function getSummonerStats(summonerObject) {
  const summonerId = summonerObject['summoner_id'];
  const url = `https://${server}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${riotKey}`;
  const response = await fetch(url);
  const summoner = await response.json();
  return summoner.filter((queue) => queue.queueType === "RANKED_SOLO_5x5");
}

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

module.exports = {
    getSummoner,
    getSummonerStats,
    getMatch,
    getSoloDuosMatchesFromThisWeek
}

