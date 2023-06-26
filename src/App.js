import React, { useState, useEffect } from 'react';
import { } from './components/Leaderboard';

import './App.css';

const usernames = ["NaturallyGifted", "Maustach", "TH1S 1S THE WAY", "KLMea", "Goulou Goulou", "khumeia","FSO"]

function App() {
  const [winrates, setWinrates] = useState([]);
  const [rank, setRank] = useState([]);
  const [win, setWin] = useState([]);
  const [loss, setLoss] = useState([]);

  const [matchweek, setMatchweek] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shouldUpdate, setShouldUpdate] = useState(true); // New state variable

  useEffect(() => {
    async function fetchWinrates() {
      try {
        const winratePromises = usernames.map((username, index) =>
          new Promise((resolve) =>
            setTimeout(async () => {
              const result = await getSummonerStats(username);
              resolve(result);
            }, index * 500)
          )
        );
        const results = await Promise.all(winratePromises);
        setWinrates(results.map((result) => result[0]));
        setRank(results.map((result) => result[1]));
        setWin(results.map((result) => result[2]));
        setLoss(results.map((result) => result[3]));
        setIsLoading(false);
      } catch (error) {
        setError(error);
        setIsLoading(false);
      }
    }

    async function fetchMatches() {
      try {
        const matchPromises = usernames.map((username, index) =>
          new Promise((resolve) =>
            setTimeout(async () => {
              const result = await getSoloDuosMatchesFromThisWeek(username);
              resolve(result);
            }, index * 500)
          )
        );
        const results = await Promise.all(matchPromises);
        setMatchweek(results.map((result) => result[0]));
        setIsLoading(false);
      } catch (error) {
        setError(error);
        setIsLoading(false);
      }
    }

    if (shouldUpdate) {
      fetchMatches().then((r) => console.log(r));
      fetchWinrates().then((r) => console.log(r));
      setShouldUpdate(false); // Reset the flag after updating the data
    }
  }, [shouldUpdate]); // Listen for changes in the shouldUpdate state

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setShouldUpdate(true); // Trigger data update
  };

  return (
    <div className="App">
      <header className="App-header">
        <button className="refresh-button" onClick={handleRefresh}>
          Refresh
        </button>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {!isLoading && !error && (
          <Leaderboard
            winrates={winrates}
            usernames={usernames}
            rank={rank}
            win={win}
            loss={loss}
            matchweek={matchweek}
          />
        )}
      </header>
    </div>
  );
}

function Leaderboard({ winrates, usernames, rank, win, loss, matchweek }) {
  const leaderboardData = usernames.map((username, index) => ({
    username: username.replace(/%20/g, ' '),
    winrate: winrates[index],
    rank: rank[index],
    win: win[index],
    loss: loss[index],
    matchweek: matchweek[index],
  }));

  // Sort by game this week
  leaderboardData.sort((a, b) => b.matchweek - a.matchweek);

  return (
    <div className="leaderboard">
      {leaderboardData.map((data, index) => (
        <div className="leaderboard-item" key={index}>
          <span className="username">{data.username}</span>
          <img className="rank" src={`ranked-icon/emblem-${data.rank}.png`} alt={data.rank} />
          <div className="details">
            <div className="winrate">
              <span className="label">Win Rate </span>
              <span className="value" style={{ color: data.winrate > 70 ? '#e79061': data.winrate > 60 ? '#9CF6F6FF' : data.winrate > 50 ? 'lightgreen' : 'lightcoral' }}>{data.winrate}%</span>
            </div>
            <div className="record">
              <span className="value">
                {data.win}<span className="win">W </span>
                / {data.loss}<span className="loss">L</span>
              </span>
            </div>
            <br />
            <div className="week">
              <span className="label">Weekly:</span>
              <br />
              <span className="value">
                SoloQ: {data.matchweek}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
