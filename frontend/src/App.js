import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    // Check backend health
    axios.get('http://localhost:5000/health')
      .then(response => {
        setBackendStatus('✅ Connected');
      })
      .catch(error => {
        setBackendStatus('❌ Not Connected');
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚨 AlertNest</h1>
        <p>Real-time Disaster Alert System</p>
        <div className="status">
          <p>Backend Status: {backendStatus}</p>
        </div>
        <div className="info">
          <p>Week-3 Setup Complete ✅</p>
          <ul>
            <li>Repository initialized</li>
            <li>Backend scaffold ready</li>
            <li>Frontend scaffold ready</li>
            <li>Health endpoints working</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;
