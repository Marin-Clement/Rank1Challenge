import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './App.css';

function App() {
  const [summonerStats, setSummonerStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummonerStats = async () => {
    try {
      const response = await axios.get('http://localhost:3001/allSummonerNames');
      const summonerNames = response.data;

      const stats = [];
      for (let i = 0; i < summonerNames.length; i++) {
        const summoner = summonerNames[i];
        const response = await axios.get(`http://localhost:3001/summonerStats/${summoner}`);
        const summonerStats = response.data;
        stats.push(summonerStats);
      }
      setSummonerStats(stats);
    } catch (error) {
      setError(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSummonerStats().then(r => console.log(r));
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.post('http://localhost:3001/refreshAll');
      await fetchSummonerStats();
    } catch (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button className="refresh-button" onClick={handleRefresh}>
          Refresh
        </button>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {!isLoading && !error && <Leaderboard summonerStats={summonerStats} />}
      </header>
    </div>
  );
}

function Leaderboard({ summonerStats }) {
  const leaderboardData = summonerStats.map((stats) => ({
    username: stats.summoner,
    tier : stats.tier,
    rank: stats.rank,
    leaguePoints: stats.leaguePoints,
    win: stats.wins,
    loss: stats.losses,
    winrate: stats.winRate,
  }));

  leaderboardData.sort((a, b) => b.winrate - a.winrate);

  return (
    <div className="leaderboard">
      {leaderboardData.map((data, index) => (
        <div className="leaderboard-item" key={index}>
          <span className="username">{data.username}</span>
          <img
            className="rank"
            src={`ranked-icon/emblem-${data.tier}.png`}
            alt={data.rank}
          />
          <div className="details">
            <div className="winrate">
              <span className="label">Win Rate </span>
              <span
                className="value"
                style={{
                  color:
                    data.winrate > 70
                      ? '#e79061'
                      : data.winrate > 60
                      ? '#9CF6F6FF'
                      : data.winrate > 50
                      ? 'lightgreen'
                      : 'lightcoral',
                }}
              >
                {data.winrate}%
              </span>
            </div>
            <div className="record">
              <span className="value">
                {data.win}
                <span className="win">W </span>
                / {data.loss}
                <span className="loss">L</span>
              </span>
            </div>
            <br />
            <div className="week">
              <span className="label">Weekly:</span>
              <br />
              <span className="value">SoloQ: {data.matchweek}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
