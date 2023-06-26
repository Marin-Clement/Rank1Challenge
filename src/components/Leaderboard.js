const Mysql2 = require('mysql2/promise');
const api = require('./Api');

// create a connection pool
const pool = Mysql2.createPool({
  host: "localhost",
  user: 'root',
  password: 'Minecraft01@',
  database: 'ranked_leader_board',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// add summoner to the database
async function AddSummonerDB(summonerName) {
  const connection = await pool.getConnection();
  try {
    const id = await getSummonerId(summonerName);
    const puuid = await getPuuid(summonerName);
    const query = 'INSERT INTO summoner (summoner_name, summoner_id, puuid) VALUES (?, ?, ?)';
    const values = [summonerName, id, puuid];
    await connection.query(query, values);
  } catch (error) {
    console.log(error);
  } finally {
    connection.release();
  }
}


// delete summoner from the database
async function DeleteSummonerDB(summonerName) {
    const connection = await pool.getConnection();
    try {
        const query = 'DELETE FROM summoner WHERE summoner_name = ?';
        const values = [summonerName];
        await connection.query(query, values);
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

// add match to the database
async function AddMatchDB(matchId, matchData) {
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
    const query = 'SELECT * FROM matchdata WHERE summoners LIKE ?';
    const values = [`%${puuid}%`];
    const [rows] = await connection.query(query, values);
    console.log(rows.length);
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
    }
    catch (error) {
        console.log(error);
    }
}


// Delete matches older than 7 days
async function DeleteOldMatchesDB() {
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

async function getSummonerId(summonerName) {
  const summoner = await api.getSummoner(summonerName);
  return summoner.id;
}

async function getPuuid(summonerName) {
  const summoner = await api.getSummoner(summonerName);
  return summoner['puuid'];
}

// get solo/duo matches from the last 7 days and add them to the database
async function getSoloDuosMatchesFromThisWeek(summonerName) {
  const summoner = await getSummonerDB(summonerName);
  const puuid = summoner[0].puuid;
  const matchList = await api.getSoloDuosMatchesFromThisWeek(puuid);
  const soloDuosIdDB = await getAllMatchesDB();
  for (let i = 0; i < matchList.length; i++) {
      if (soloDuosIdDB.some((match) => match.match_id === matchList[i])) {
          console.log("Match already in the database");
          continue;
      }
      const match = await api.getMatch(matchList[i]);
      await AddMatchDB(matchList[i], match);
      await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

getSoloDuosMatchesFromThisWeek("NaturallyGifted")