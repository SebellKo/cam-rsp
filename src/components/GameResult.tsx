import React, { useEffect, useState, useCallback, memo } from 'react';

interface GameResultProps {
  userScore: number;
  computerScore: number;
  roundResult: string | null;
  roundNumber: number;
  maxRounds: number;
  consecutiveWins: number;
  maxConsecutiveWins: number;
  gameOver: boolean;
  winner: string | null;
  onReset: () => void;
}

const GameResult: React.FC<GameResultProps> = ({
  userScore,
  computerScore,
  roundResult,
  roundNumber,
  maxRounds,
  consecutiveWins,
  maxConsecutiveWins,
  gameOver,
  winner,
  onReset
}) => {
  const [showEffect, setShowEffect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    let effectTimer: number | null = null;
    let confettiTimer: number | null = null;
    
    if (roundResult) {
      setShowEffect(true);
      
      if (roundResult === 'win') {
        setShowConfetti(true);
        confettiTimer = window.setTimeout(() => {
          setShowConfetti(false);
        }, 2000);
      }
      
      effectTimer = window.setTimeout(() => {
        setShowEffect(false);
      }, 2000);
    }
    
    return () => {
      if (effectTimer) clearTimeout(effectTimer);
      if (confettiTimer) clearTimeout(confettiTimer);
    };
  }, [roundResult]);

  const getResultClass = useCallback(() => {
    if (roundResult === 'win') return 'result you win';
    if (roundResult === 'lose') return 'result computer wins';
    if (roundResult === 'tie') return 'result its-a-tie';
    return 'result';
  }, [roundResult]);

  const getResultText = useCallback(() => {
    if (roundResult === 'win') return 'You win!';
    if (roundResult === 'lose') return 'Computer wins!';
    if (roundResult === 'tie') return 'It\'s a tie!';
    return 'Make a gesture to play';
  }, [roundResult]);

  const getWinnerMessage = useCallback(() => {
    if (winner === 'user') {
      if (consecutiveWins >= 4) {
        return "Amazing! You won with 4 consecutive wins!";
      }
      return "Congratulations! You won the game!";
    }
    if (winner === 'computer') {
      return "Good try! The computer won this time!";
    }
    return "It's a tie! You both did great!";
  }, [winner, consecutiveWins]);

  // Memoized star elements to prevent recreation on each render
  const renderWinStars = useCallback(() => {
    return [...Array(5)].map((_, i) => (
      <div key={i} className="star" style={{ 
        left: `${Math.random() * 100}%`, 
        animationDelay: `${Math.random() * 0.5}s` 
      }}></div>
    ));
  }, []);

  // Memoized cloud elements to prevent recreation on each render
  const renderLoseClouds = useCallback(() => {
    return [...Array(3)].map((_, i) => (
      <div key={i} className="cloud" style={{ 
        left: `${Math.random() * 100}%`, 
        animationDelay: `${Math.random() * 0.5}s` 
      }}></div>
    ));
  }, []);

  // Memoized confetti elements to prevent recreation on each render
  const renderVictoryConfetti = useCallback(() => {
    return [...Array(20)].map((_, i) => (
      <div key={i} className="confetti" style={{ 
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
      }}></div>
    ));
  }, []);

  // Memoized mini confetti elements to prevent recreation on each render
  const renderMiniConfetti = useCallback(() => {
    return [...Array(15)].map((_, i) => (
      <div key={i} className="mini-confetti" style={{ 
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
      }}></div>
    ));
  }, []);

  return (
    <div className="game-result">
      <div className="score-board">
        <h2>Score</h2>
        <div className="scores">
          <div className="user-score">
            <span>You</span>
            <p>{userScore}</p>
          </div>
          <div className="computer-score">
            <span>Computer</span>
            <p>{computerScore}</p>
          </div>
        </div>
      </div>
      
      <div className="round-info">
        <p className="current-round">Round {roundNumber} of {maxRounds}</p>
        {consecutiveWins > 0 && (
          <p>Consecutive wins: {consecutiveWins}/{maxConsecutiveWins}</p>
        )}
        <div className={getResultClass()}>
          {getResultText()}
          {showEffect && roundResult === 'win' && (
            <>
              <div className="win-effect"></div>
              <div className="win-stars">
                {renderWinStars()}
              </div>
            </>
          )}
          {showEffect && roundResult === 'lose' && (
            <>
              <div className="lose-effect"></div>
              <div className="lose-clouds">
                {renderLoseClouds()}
              </div>
            </>
          )}
          {showEffect && roundResult === 'tie' && <div className="tie-effect"></div>}
        </div>
      </div>
      
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>{getWinnerMessage()}</p>
          {winner === 'user' && (
            <div className="victory-animation">
              {renderVictoryConfetti()}
            </div>
          )}
          <button className="reset-button" onClick={onReset}>
            Play Again
          </button>
        </div>
      )}
      
      {showConfetti && (
        <div className="confetti-container">
          {renderMiniConfetti()}
        </div>
      )}
    </div>
  );
};

export default memo(GameResult);
