const riotKey = "RGAPI-b70614ad-2a1c-4523-a814-007ed850deb3";
const server = "euw1";
const matchserver = "europe";


async function getSummonerId(summonerName) {
    const summoner = await getSummoner(summonerName);
    return summoner.id;
}

async function getPuuid(summonerName) {
    const summoner = await getSummoner(summonerName);
    return summoner.puuid;
}

async function getSummoner(summonerName) {
    const url = `https://${server}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotKey}`;
    const response = await fetch(url);
    return await response.json();
}

export async function getSummonerStats(summonerName) {
    const summonerId = await getSummonerId(summonerName);
    const url = `https://${server}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${riotKey}`;
    const response = await fetch(url);
    const summoner = await response.json();
    const rankedSoloDuo = summoner.filter((queue) => queue.queueType === "RANKED_SOLO_5x5");
    // return winrate rank win and loss
    return [rankedSoloDuo ? Math.round(rankedSoloDuo[0].wins / (rankedSoloDuo[0].wins + rankedSoloDuo[0].losses) * 100) : 0, rankedSoloDuo[0] ? rankedSoloDuo[0].tier : "UNRANKED",
    rankedSoloDuo[0] ? rankedSoloDuo[0].wins : 0, rankedSoloDuo[0] ? rankedSoloDuo[0].losses : 0];
}

// TODO: get match history
// async function getMatch(matchId) {
//     const url = `https://${matchserver}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotKey}`;
//     const response = await fetch(url);
//     const match = await response.json();
//     return match;
// }
export async function getSoloDuosMatchesFromThisWeek(summonerName){
    const puuid = await getPuuid(summonerName);
    const currentTime = Math.floor(Date.now() / 1000);
    const startOfWeek = currentTime - 604800;
    const url = `https://${matchserver}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${startOfWeek}&queue=420&endTime=${currentTime}&count=100&api_key=${riotKey}`;
    const soloDuosId = await fetch(url).then((response) => response.json());
    // TODO: For now very expensive, need to find a way to do it in one request or wait personal api key
    // Check win loose
    // let wins = 0;
    // let losses = 0;
    // soloDuos.forEach((match) => {
    //     const participantId = match.info.participants.findIndex((participant) => participant.puuid === puuid);
    //     const participant = match.info.participants[participantId];
    //     if (participant.win) {
    //         wins++;
    //     } else {
    //         losses++;
    //     }
    // });
    return [soloDuosId.length];
}