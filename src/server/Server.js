const Mysql2 = require('mysql2/promise');
const api = require('./Api');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

// Start the server
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

// create a connection pool
const pool = Mysql2.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Minecraft01@',
  database: 'ranked_leader_board',
  waitForConnections: true,
  connectionLimit: 0,
  queueLimit: 0
});

// add summoner stats to the database
async function addSummonerStatsDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const summoner = await getSummonerDB(summonerName);
    const summoner_id = summoner[0].summoner_id;
    const summonerStats = await api.getSummonerStats(summoner_id);
    const { tier, rank, leaguePoints, wins, losses } = summonerStats;
    const query = 'INSERT INTO summonerstats (summoner, tier, `rank`, leaguepoint, win, loose) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [summonerName, tier, rank, leaguePoints, wins, losses];
    await connection.query(query, values);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

// delete summoner stats from the database
async function deleteSummonerStatsDB(summonerName) {
    const connection = await pool.getConnection();
    try {
        const query = 'DELETE FROM summonerstats WHERE summoner = ?';
        const values = [summonerName];
        await connection.query(query, values);
    } catch (error) {
        console.log(error);
    } finally {
        connection.release();
    }
}

// add summoner to the database
async function addSummonerDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const summoner = await api.getSummoner(summonerName);
    const { id, puuid , profileIconId } = summoner;
    const query = 'INSERT INTO summoner (summoner_name, summoner_id, puuid, icon_id) VALUES (?, ?, ?, ?)';
    const values = [summonerName, id, puuid, profileIconId];
    await connection.query(query, values);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
    await addSummonerStatsDB(summonerName);
  }
}

// delete summoner from the database
async function deleteSummonerDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const query = 'DELETE FROM summoner WHERE summoner_name = ?';
    const values = [summonerName];
    await connection.query(query, values);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
    await deleteSummonerStatsDB(summonerName);
  }
}

// get all summoners from the database
async function getAllSummonersDB() {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM summoner';
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

// get summoner details from the database (id, puuid)
async function getSummonerDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM summoner WHERE summoner_name = ?';
    const values = [summonerName];
    const [rows] = await connection.query(query, values);
    return rows;
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

async function getSummonerStatsDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const query = 'SELECT * FROM summonerstats WHERE summoner = ?';
    const values = [summonerName];
    const [rows] = await connection.query(query, values);
    return rows;
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

// add match to the database
async function addMatchDB(matchId, matchData) {
  const connection = await pool.getConnection();
  try {
    const query = 'INSERT INTO matchdata (match_id, match_data, date, summoners) VALUES (?, ?, ?, ?)';
    const values = [matchId, JSON.stringify(matchData), new Date(parseInt(matchData.info.gameCreation)), JSON.stringify(matchData.metadata.participants)];
    await connection.query(query, values);
    console.log('Match added to the database');
  } catch (error) {
    console.error('Error adding match to the database:', error);
  } finally {
    connection.release();
  }
}

// get match for a specific summoner
async function getSummonerMatchDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const summoner = await getSummonerDB(summonerName);
    const puuid = summoner[0]['puuid'];
    // select all matches id in the database return the most recent one first (DESC)
    const query = 'SELECT match_id FROM matchdata WHERE summoners LIKE ? ORDER BY date DESC';
    const values = [`%${puuid}%`];
    const [rows] = await connection.query(query, values);
    return rows;
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

async function getAllMatchesDB() {
  const connection = await pool.getConnection();
  try {
    // select all matches id in the database
    const query = 'SELECT match_id FROM matchdata';
    const [rows] = await connection.query(query);
    return rows;
  } catch (error) {
    console.log(error);
  }
}

async function getMatchDetailsDB(matchId, summonerName) {
    const connection = await pool.getConnection();
    try {
        const query = 'SELECT match_data FROM matchdata WHERE match_id = ?';
        const values = [matchId];
        const [rows] = await connection.query(query, values);
        const matchData = rows[0].match_data;
        const summoner = await getSummonerDB(summonerName);
        const summonerPuuid = summoner[0]['puuid'];
        const summonerTeam = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).teamId;
        const isWin = matchData.info.teams.find(team => team.teamId === summonerTeam).win;
        const champion = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).championName;
        const kills = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).kills;
        const deaths = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).deaths;
        const assists = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).assists;
        const kda = Math.round((kills + assists) / deaths * 100) / 100;
        const cs = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).totalMinionsKilled + matchData.info.participants.find(participant => participant.puuid === summonerPuuid).neutralMinionsKilled;
        const visionScore = matchData.info.participants.find(participant => participant.puuid === summonerPuuid).visionScore;
        const daysSincePlayed = Math.round((new Date() - new Date(matchData.info.gameCreation)) / (1000 * 60 * 60 * 24));
        return {
            isWin,
            champion,
            kills,
            deaths,
            assists,
            kda,
            cs,
            visionScore,
            daysSincePlayed
        }
    } catch (error) {
        console.log(error);
    } finally {
        connection.release();
    }
}

// return dictionary of match per day for a specific summoner
async function getSummonerMatchesPerDayDB(summonerName) {
    const connection = await pool.getConnection();
    try {
        const summoner = await getSummonerDB(summonerName);
        const puuid = summoner[0]['puuid'];
        const query = 'SELECT * FROM matchdata WHERE summoners LIKE ?';
        const values = [`%${puuid}%`];
        const [rows] = await connection.query(query, values);
        const matchesPerDay = {};
        for (let i = 0; i < rows.length; i++) {
        const date = new Date(rows[i].date);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        if (matchesPerDay[dateStr]) {
            matchesPerDay[dateStr].push(rows[i]);
        } else {
            matchesPerDay[dateStr] = [rows[i]];
        }
        }
        return matchesPerDay;
    } catch (error) {
        console.log(error);
    } finally {
        connection.release();
    }
}


// Delete matches older than 7 days
async function deleteOldMatchesDB() {
  const connection = await pool.getConnection();
  try {
    const query = 'DELETE FROM matchdata WHERE date < (NOW() - INTERVAL 7 DAY)';
    await connection.query(query);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

//////////////////////////////////////////////////////////////////
///////////////////////// UPDATE METHODS /////////////////////////
//////////////////////////////////////////////////////////////////

// update match data in the database
// get solo/duo matches from the last 7 days and add them to the database
async function getSoloDuosMatchesFromThisWeek(summonerName, soloDuosIdDB) {
  const summoner = await getSummonerDB(summonerName);
  const puuid = summoner[0].puuid;
  const matchList = await api.getSoloDuosMatchesFromThisWeek(puuid);
  for (let i = 0; i < matchList.length; i++) {
    if (soloDuosIdDB.some((match) => match.match_id === matchList[i])) {
      console.log("Match already in the database");
      continue;
    }
    const match = await api.getMatch(matchList[i]);
    await addMatchDB(matchList[i], match);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// update summoner stats in the database
async function updateSummonerStatsDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const summoner = await getSummonerDB(summonerName);
    const summoner_id = summoner[0].summoner_id;
    const summonerStats = await api.getSummonerStats(summoner_id);
    const { tier, rank, leaguePoints, wins, losses } = summonerStats;
    const query = 'UPDATE summonerstats SET tier = ?, `rank` = ?, leaguepoint = ?, win = ?, loose = ? WHERE summoner = ?';
    const values = [tier, rank, leaguePoints, wins, losses, summonerName];
    await connection.query(query, values);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}

async function refreshAllSummonerStats() {
  const summoners = await getAllSummonersDB();
  for (let i = 0; i < summoners.length; i++) {
    await updateSummonerStatsDB(summoners[i].summoner_name);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function refreshAllSummonerMatches() {
  const summoners = await getAllSummonersDB();
  const soloDuosIdDB = await getAllMatchesDB();
  for (let i = 0; i < summoners.length; i++) {
    await getSoloDuosMatchesFromThisWeek(summoners[i].summoner_name, soloDuosIdDB);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function refreshAll() {
    await deleteOldMatchesDB();
    await refreshAllSummonerStats().then(() => console.log('Summoner stats updated'));
    await refreshAllSummonerMatches().then(() => console.log('Summoner matches updated'));
}

//////////////////////////////////////////////////////////////////
///////////////////////// RETRIEVE METHODS ///////////////////////
//////////////////////////////////////////////////////////////////

async function getAllSummonerNamesIcons() {
  const summoners = await getAllSummonersDB();
  const summonerNames = [];
  const summonerIconsIds = [];
  for (let i = 0; i < summoners.length; i++) {
    summonerNames.push(summoners[i].summoner_name);
    summonerIconsIds.push(summoners[i].icon_id);
  }
  return { summonerNames, summonerIconsIds };
}

async function getSummonerStats(summonerName) {
  const summoner = await getSummonerStatsDB(summonerName);
  return {
    summoner: summoner[0].summoner,
    tier: summoner[0].tier,
    rank: summoner[0].rank,
    leaguePoints: summoner[0].leaguePoint,
    wins: summoner[0].win,
    losses: summoner[0].loose,
    winRate: Math.round((summoner[0].win / (summoner[0].win + summoner[0].loose)) * 100),
  };
}


//////////////////////////////////////////////////////////////////
////////////////////////   API CALLS  ////////////////////////////
//////////////////////// FOR FRONTEND ////////////////////////////
//////////////////////////////////////////////////////////////////
app.get('/allSummonerNames', async (req, res) => {
  const summonerNames = await getAllSummonerNamesIcons();
  res.json(summonerNames);
});

app.get('/summonerStats/:summonerName', async (req, res) => {
  const summonerName = req.params.summonerName;
  const summonerStats = await getSummonerStats(summonerName);
  res.json(summonerStats);
});
app.get('/summonerMatches/:summonerName', async (req, res) => {
  const summonerName = req.params.summonerName;
  const summonerMatches = await getSummonerMatchDB(summonerName);
  res.json(summonerMatches);
});

app.get('/summonerMatchesDetails/:matchId/:summonerId', async (req, res) => {
    const matchId = req.params.matchId;
    const summonerId = req.params.summonerId;
    const matchDetails = await getMatchDetailsDB(matchId, summonerId);
    res.json(matchDetails);
});

app.post('/refreshAll', async (req, res) => {
  await refreshAll();
  res.json({ message: 'Data refreshed successfully' });
})

app.post('/deleteSummoner/:summonerName', async (req, res) => {
    const summonerName = req.params.summonerName;
    await deleteSummonerDB(summonerName);
    res.json({ message: 'Summoner deleted successfully' });
})

app.post('/addSummoner/:summonerName', async (req, res) => {
    const summonerName = req.params.summonerName;
    await addSummonerDB(summonerName);
    res.json({ message: 'Summoner added successfully' });
})