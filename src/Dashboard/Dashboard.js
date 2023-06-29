import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState('');

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogin = () => {
    const expectedPassword = process.env.REACT_APP_DASHBOARD_PASSWORD;

    if (password === expectedPassword) {
      setLoggedIn(true);
    } else {
      alert('Invalid password!');
    }
  };

  const handleDisconnect = () => {
    setLoggedIn(false);
    setPassword('');
    navigate('/');
  };

  const handleUserChange = (event) => {
    setNewUser(event.target.value);
  };

  const handleAddUser = async () => {
    try {
      await axios.post(`http://localhost:3001/addSummoner/${newUser}`);
      setUsers([...users, newUser]);
      setNewUser('');
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await axios.post(`http://localhost:3001/deleteSummoner/${user}`);
      setUsers(users.filter((u) => u !== user));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const response = await axios.get('http://localhost:3001/allSummonerNames');
        const userList = response.data.summonerNames;
        setUsers(userList);
      } catch (error) {
        console.error('Failed to fetch user list:', error);
      }
    };

    if (loggedIn) {
      fetchUserList();
    }
  }, [loggedIn]);

  if (loggedIn) {
    return (
      <div className="dashboard-container">
        <header className="header">
          <img src="ql3z6hbd2p8a1.png" alt="logo" />
          <button onClick={handleDisconnect}>Disconnect</button>
        </header>
        <div className="dashboard-content">
          <h1>Dashboard</h1>
          <div className="user-list">
            <h2>User List</h2>
            <ul>
              {users.map((user) => (
                <div className="delete-user-container" key={user}>
                  <span className="user-name">{user}</span>
                  <button className="delete-user-button" onClick={() => handleDeleteUser(user)}>
                    Delete
                  </button>
                </div>
              ))}
            </ul>
          </div>
          <h2>Add user</h2>
          <div className="add-user-container">
            <input type="text" value={newUser} onChange={handleUserChange} />
            <button className="add-user-button" onClick={handleAddUser}>
              Add User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h1>Login</h1>
      <div className="password-input-container">
        <input placeholder={'Password'} autoComplete="off" autoFocus={true}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyDown}
        />
        <button className="show-password-button" onClick={handleShowPassword}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="login-button-container">
        <button onClick={() => navigate('/')}>Back</button>
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}

export default Dashboard;
