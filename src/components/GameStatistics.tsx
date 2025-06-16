import React, { useState, useEffect, useCallback, memo } from 'react';

interface GameStatisticsProps {
  userGesture: string;
  roundResult: string | null;
  gameOver: boolean;
  consecutiveWins: number;
  showToggle?: boolean;
  alwaysShow?: boolean;
}

interface GestureStats {
  rock: number;
  paper: number;
  scissors: number;
  wins: number;
  losses: number;
  ties: number;
  totalGames: number;
  bestStreak: number;
}

const GameStatistics: React.FC<GameStatisticsProps> = ({
  userGesture,
  roundResult,
  gameOver,
  consecutiveWins,
  showToggle = true,
  alwaysShow = false
}) => {
  const [showStats, setShowStats] = useState(alwaysShow);
  const [stats, setStats] = useState<GestureStats>({
    rock: 0,
    paper: 0,
    scissors: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    totalGames: 0,
    bestStreak: 0
  });
  
  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('rps-stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Error parsing saved stats:', e);
      }
    }
  }, []);
  
  // Update stats when round result changes
  useEffect(() => {
    if (!roundResult) return;
    
    setStats(prevStats => {
      const newStats = { ...prevStats };
      
      // Update gesture counts
      if (userGesture === 'rock' || userGesture === 'paper' || userGesture === 'scissors') {
        newStats[userGesture]++;
      }
      
      // Update result counts
      if (roundResult === 'win') {
        newStats.wins++;
        newStats.bestStreak = Math.max(newStats.bestStreak, consecutiveWins);
      } else if (roundResult === 'lose') {
        newStats.losses++;
      } else if (roundResult === 'tie') {
        newStats.ties++;
      }
      
      newStats.totalGames = newStats.wins + newStats.losses + newStats.ties;
      
      // Save to localStorage
      localStorage.setItem('rps-stats', JSON.stringify(newStats));
      
      return newStats;
    });
  }, [roundResult, userGesture, consecutiveWins]);
  
  // Toggle stats display
  const toggleStats = useCallback(() => {
    setShowStats(prev => !prev);
  }, []);
  
  // Calculate win rate
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
  
  // Calculate gesture usage percentages
  const totalGestures = stats.rock + stats.paper + stats.scissors;
  const rockPercent = totalGestures > 0 ? Math.round((stats.rock / totalGestures) * 100) : 0;
  const paperPercent = totalGestures > 0 ? Math.round((stats.paper / totalGestures) * 100) : 0;
  const scissorsPercent = totalGestures > 0 ? Math.round((stats.scissors / totalGestures) * 100) : 0;
  
  return (
    <div className="game-statistics">
      {showToggle && (
        <button className="stats-toggle-button" onClick={toggleStats}>
          {showStats ? 'Hide Statistics' : 'Show Statistics'}
        </button>
      )}
      
      {(showStats || alwaysShow) && (
        <div className="stats-panel">
          <h3>Game Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Games Played</div>
              <div className="stat-value">{stats.totalGames}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Win Rate</div>
              <div className="stat-value">{winRate}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Best Streak</div>
              <div className="stat-value">{stats.bestStreak}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Current Streak</div>
              <div className="stat-value">{consecutiveWins}</div>
            </div>
          </div>
          
          <div className="gesture-usage">
            <h4>Gesture Usage</h4>
            <div className="gesture-bars">
              <div className="gesture-bar">
                <div className="gesture-label">Rock</div>
                <div className="bar-container">
                  <div className="bar rock-bar" style={{ width: `${rockPercent}%` }}></div>
                </div>
                <div className="gesture-count">{stats.rock}</div>
              </div>
              <div className="gesture-bar">
                <div className="gesture-label">Paper</div>
                <div className="bar-container">
                  <div className="bar paper-bar" style={{ width: `${paperPercent}%` }}></div>
                </div>
                <div className="gesture-count">{stats.paper}</div>
              </div>
              <div className="gesture-bar">
                <div className="gesture-label">Scissors</div>
                <div className="bar-container">
                  <div className="bar scissors-bar" style={{ width: `${scissorsPercent}%` }}></div>
                </div>
                <div className="gesture-count">{stats.scissors}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(GameStatistics);
