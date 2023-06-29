import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import './App.css';

function App() {
  const navigate = useNavigate();
  const [summonerData, setSummonerData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const fetchSummonerStats = async () => {
    try {
      const response = await axios.get('http://localhost:3001/allSummonerNames');
      const summonerNames = response.data.summonerNames;
      const summonerIconIds = response.data.summonerIconsIds;

      const summonerData = {};
      for (let i = 0; i < summonerNames.length; i++) {
        const summoner = summonerNames[i];
        const response = await axios.get(`http://localhost:3001/summonerStats/${summoner}`);
        const response2 = await axios.get(`http://localhost:3001/summonerMatches/${summoner}`);
        const summonerStats = response.data;
        const summonerMatches = response2.data;
        summonerData[summoner] = {
          iconId: summonerIconIds[i],
          stats: summonerStats,
          matches: summonerMatches,
        };
      }
      setSummonerData(summonerData);
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

  const handleMatchClick = match => {
    if (selectedMatch === match) {
      setSelectedMatch(null);
    } else {
      setSelectedMatch(match);
    }
  };

  const redirectDashboard = () => {
    navigate('/dashboard');
  }



  return (
    <div className="App">
      <header className="header-dashboard">
        <button className="refresh-button" onClick={handleRefresh}>
            Refresh
        </button>
        <h1>Leaderboard</h1>
        <img src="ql3z6hbd2p8a1.png" alt="logo" onClick={redirectDashboard} />
      </header>
        {isLoading ? (
            <div className="lds-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          ) : null}
        {error && <p>Error: {error.message}</p>}
        {!isLoading && !error && (
          <Leaderboard
            summonerData={summonerData}
            onMatchClick={handleMatchClick}
            selectedMatch={selectedMatch}
          />
        )}
    </div>
  );
}

function Leaderboard({ summonerData, onMatchClick, selectedMatch }) {
  const leaderboardData = Object.entries(summonerData).map(([summoner, data]) => {
    const { stats, matches } = data;
    return {
      username: summoner,
      iconId: data.iconId,
      tier: stats.tier,
      rank: stats.rank,
      leaguePoints: stats.leaguePoints,
      win: stats.wins,
      loss: stats.losses,
      winRate: stats.winRate,
      matchesNumber: matches.length,
      matches: matches,
    };
  });

  leaderboardData.sort((a, b) => b.matchesNumber - a.matchesNumber);

  return (
    <div className="leaderboard">
      {leaderboardData.map((data, index) => (
        <div className="leaderboard-container" key={index}>
          <div className="leaderboard-item" onClick={() => onMatchClick(data.matches)}>
            <span style={{ color: index === 0 ? 'lightgreen' : index === 1 ? '#9CF6F6FF' : index === 2 ? '#e79061' : 'lightcoral' }}>
                \ {index + 1} /
            </span>
            <img className="summoner-icon" src={`https://ddragon.leagueoflegends.com/cdn/13.13.1/img/profileicon/${data.iconId}.png`} alt="Summoner Icon"/>
            <span className="username">{data.username}</span>
            <div className="rank-container">
                <img className="rank" src={`ranked-icon/emblem-${data.tier}.png`} alt={data.rank}/>
                <span className="tier">{data.rank}</span>
            </div>
            <div className="details">
              <div className="winrate">
                <span className="label">Win Rate </span>
                <span
                  className="value"
                  style={{
                    color:
                      data.winRate > 70
                        ? '#e79061'
                        : data.winRate > 60
                        ? '#9CF6F6FF'
                        : data.winRate > 50
                        ? 'lightgreen'
                        : 'lightcoral',
                  }}
                >
                  {data.winRate}%
                </span>
              </div>
              <div className="record">
                <span className="value">
                  {data.win}
                  <span className="win">W </span>
                  / {data.loss}
                  <span className="loss">L</span>
                </span>
                <br />
                <span className="league-points" style={{ color: data.leaguePoints > 75 ? '#e79061' : data.leaguePoints > 50 ? '#9CF6F6FF' : data.leaguePoints > 25 ? 'lightgreen' : 'lightcoral' }}>
                    {data.leaguePoints} LP
                </span>
                <br/>
                <br/>
                <span className="matches-number">{data.matchesNumber} Matches</span>
              </div>
              <br />
            </div>
            <img src="https://s-lol-web.op.gg/images/icon/icon-arrow-down-blue.svg?v=1687932539766" width="24" alt="More" height="24"></img>
          </div>
          <div className="matches-container">
              {data.matches.map((match, index) => (
                <MatchDetails
                  match={match}
                  username={data.username}
                  key={index}
                  isSelected={selectedMatch === data.matches}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchDetails({ match, username, isSelected }) {
  const [matchDetails, setMatchDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/summonerMatchesDetails/${match.match_id}/${username}`
        );
        setMatchDetails(response.data);
      } catch (error) {
        setError(error);
      }
      setIsLoading(false);
    };

    if (isSelected) {
      fetchMatchDetails();
    } else {
      setMatchDetails(null);
    }
  }, [match.match_id, username, isSelected]);

  if (isSelected && isLoading) {
    return <p>Loading match details...</p>;
  }

  if (isSelected && error) {
    return <p>Error: {error.message}</p>;
  }

  if (isSelected && matchDetails) {
    const matchResultClass = matchDetails.isWin ? 'match-win' : 'match-loss';
  return (
      <div className={`match-details ${matchResultClass}`}>
        <img
          className="champion-icon"
          src={`https://ddragon.leagueoflegends.com/cdn/13.13.1/img/champion/${matchDetails.champion}.png`}
          alt={matchDetails.champion}
        />
        <div>
          {matchDetails.daysSincePlayed === 0 ? (
            <strong>Aujourd'hui</strong>
          ) : (
            <div>
              Il y a <strong>{matchDetails.daysSincePlayed}</strong> jours
            </div>
          )}
        </div>
        <div className="kda">
          <span className="k">{matchDetails.kills}</span>
          <span className="slash"> / </span>
          <span className="d" style={{ color: 'lightcoral' }}>{matchDetails.deaths}</span>
          <span className="slash"> / </span>
          <span className="a">{matchDetails.assists}</span>
        </div>
        <div>
          <strong>CS:</strong> {matchDetails.cs}
        </div>
        <div>
          <strong>Vision:</strong> {matchDetails.visionScore}
        </div>
      </div>
    );
  }

  return null;
}

export default App;
