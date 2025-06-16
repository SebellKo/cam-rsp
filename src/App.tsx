import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import HandTracker from "./components/HandTracker";
import ComputerHand from "./components/ComputerHand";
import GameResult from "./components/GameResult";
import AchievementSystem from "./components/AchievementSystem";
import GameStatistics from "./components/GameStatistics";
import GesturePrediction from "./components/GesturePrediction";

function App() {
  const [userGesture, setUserGesture] = useState<string>("waiting");
  const [finalUserGesture, setFinalUserGesture] = useState<string | null>(null);
  const [computerGesture, setComputerGesture] = useState<string>("");
  const [result, setResult] = useState<string>("Waiting for your move...");
  const [userScore, setUserScore] = useState<number>(0);
  const [computerScore, setComputerScore] = useState<number>(0);
  const [roundsPlayed, setRoundsPlayed] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(0);
  const [gestureConfirmed, setGestureConfirmed] = useState<boolean>(false);
  const [gestureTimer, setGestureTimer] = useState<number | null>(null);
  const [computerHistory, setComputerHistory] = useState<string[]>([]);
  const [userHistory, setUserHistory] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [lastWinningGesture, setLastWinningGesture] = useState<string | null>(null);
  const [encouragementMessage, setEncouragementMessage] = useState<string | null>(null);
  
  // Refs to avoid recreating functions
  const countdownIntervalRef = useRef<number | null>(null);
  const gestureTimerRef = useRef<number | null>(null);
  const encouragementTimerRef = useRef<number | null>(null);
  const nextRoundTimerRef = useRef<number | null>(null);
  const playRoundRef = useRef<(() => void) | null>(null);

  // Set kids theme on component mount
  useEffect(() => {
    document.body.className = 'theme-kids';
    // Save theme preference to localStorage
    localStorage.setItem('rps-theme', 'kids');
    
    // Cleanup function
    return () => {
      // Clear all timers on unmount
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
      if (encouragementTimerRef.current) clearTimeout(encouragementTimerRef.current);
      if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
    };
  }, []);

  // Handle user's hand gesture - memoized to prevent unnecessary recreations
  const handleHandGesture = useCallback((gesture: string) => {
    if (!gameStarted || gameOver || gestureConfirmed) return;
    
    if (gesture !== userGesture) {
      setUserGesture(gesture);
      
      // Clear any existing timer
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
      
      // Set a new timer to confirm the gesture after 2 seconds of stability
      const timer = window.setTimeout(() => {
        setGestureConfirmed(true);
        // Store the final gesture when confirmed
        setFinalUserGesture(gesture);
      }, 2000);
      
      gestureTimerRef.current = timer;
      setGestureTimer(timer);
    }
  }, [gameStarted, gameOver, gestureConfirmed, userGesture]);

  // Play a round when gesture is confirmed
  useEffect(() => {
    if (gestureConfirmed && !gameOver) {
      startCountdown();
    }
  }, [gestureConfirmed, gameOver]);

  // Play a round of rock-paper-scissors
  const playRound = useCallback(() => {
    // Ensure we have a valid final user gesture
    if (!finalUserGesture || !['rock', 'paper', 'scissors'].includes(finalUserGesture)) {
      console.error("Invalid final user gesture:", finalUserGesture);
      return;
    }

    // Generate computer's choice
    const choices = ["rock", "paper", "scissors"];
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];
    setComputerGesture(computerChoice);
    
    // Add to computer history
    setComputerHistory(prev => [...prev, computerChoice]);
    
    // Add to user history - using the finalUserGesture
    setUserHistory(prev => [...prev, finalUserGesture]);
    
    // Determine the winner
    let roundResult = "";
    let resultType = null;
    
    if (finalUserGesture === computerChoice) {
      roundResult = "It's a tie!";
      resultType = "tie";
      setConsecutiveWins(0);
      showEncouragementMessage("Nice try! Let's go again!");
    } else if (
      (finalUserGesture === "rock" && computerChoice === "scissors") ||
      (finalUserGesture === "paper" && computerChoice === "rock") ||
      (finalUserGesture === "scissors" && computerChoice === "paper")
    ) {
      roundResult = "You win!";
      resultType = "win";
      setUserScore(prevScore => prevScore + 1);
      setConsecutiveWins(prevWins => prevWins + 1);
      setLastWinningGesture(finalUserGesture);
      showEncouragementMessage("Great job! You're awesome!");
    } else {
      roundResult = "Computer wins!";
      resultType = "lose";
      setComputerScore(prevScore => prevScore + 1);
      setConsecutiveWins(0);
      showEncouragementMessage("Don't worry! You'll get it next time!");
    }
    
    setResult(roundResult);
    setRoundResult(resultType);
    
    // Increment rounds played
    setRoundsPlayed(prevRounds => {
      const newRoundsPlayed = prevRounds + 1;
      
      // Check if game is over
      const newConsecutiveWins = resultType === "win" ? consecutiveWins + 1 : 0;
      if (newRoundsPlayed >= 10 || newConsecutiveWins >= 4) {
        setGameOver(true);
      } else {
        // Prepare for next round after a delay
        if (nextRoundTimerRef.current) {
          clearTimeout(nextRoundTimerRef.current);
        }
        
        nextRoundTimerRef.current = window.setTimeout(() => {
          setUserGesture("waiting");
          setFinalUserGesture(null);
          setGestureConfirmed(false);
          setRoundResult(null);
        }, 3000);
      }
      
      return newRoundsPlayed;
    });
  }, [finalUserGesture, consecutiveWins]);

  // Store playRound in ref to avoid stale closures
  useEffect(() => {
    playRoundRef.current = playRound;
  }, [playRound]);

  // Start countdown before showing computer's choice
  const startCountdown = useCallback(() => {
    // Changed from 3 to 5 seconds
    setCountdown(5);
    
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    const countInterval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countInterval);
          // Use the ref to call the latest version of playRound
          if (playRoundRef.current) {
            playRoundRef.current();
          }
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
    
    countdownIntervalRef.current = countInterval;
  }, []);

  // Show encouraging messages
  const showEncouragementMessage = useCallback((message: string) => {
    setEncouragementMessage(message);
    
    if (encouragementTimerRef.current) {
      clearTimeout(encouragementTimerRef.current);
    }
    
    encouragementTimerRef.current = window.setTimeout(() => {
      setEncouragementMessage(null);
    }, 3000);
  }, []);

  // Reset the game
  const resetGame = useCallback(() => {
    // Clear all timers
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    if (encouragementTimerRef.current) clearTimeout(encouragementTimerRef.current);
    if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
    
    setUserGesture("waiting");
    setFinalUserGesture(null);
    setComputerGesture("");
    setResult("Waiting for your move...");
    setUserScore(0);
    setComputerScore(0);
    setRoundsPlayed(0);
    setGameOver(false);
    setConsecutiveWins(0);
    setGestureConfirmed(false);
    setComputerHistory([]);
    setUserHistory([]);
    setCountdown(null);
    setRoundResult(null);
    setGameStarted(false);
    setLastWinningGesture(null);
    
    showEncouragementMessage("Let's play a new game! Have fun!");
  }, [showEncouragementMessage]);

  // Start the game
  const startGame = useCallback(() => {
    setGameStarted(true);
    showEncouragementMessage("Show your hand to the camera! You can do it!");
  }, [showEncouragementMessage]);

  // Get winner for game over screen
  const getWinner = useCallback(() => {
    if (consecutiveWins >= 4) return "user";
    if (userScore > computerScore) return "user";
    if (computerScore > userScore) return "computer";
    return "tie";
  }, [consecutiveWins, userScore, computerScore]);

  // Render user gesture history - memoized to prevent unnecessary recalculations
  const renderUserGestureHistory = useCallback(() => {
    if (userHistory.length === 0) return null;
    
    return (
      <div className="history-container">
        <h3>Your History</h3>
        <div className="history-items-horizontal">
          {userHistory.map((item, index) => (
            <div key={index} className="history-item-card">
              <div className="history-item-round">Round {index + 1}</div>
              <div className="history-item-gesture">
                {renderUserGesture(item, 40)}
              </div>
              <div className={`history-item-name history-${item}`}>
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [userHistory]);

  // Render user gesture for history - memoized to prevent unnecessary recreations
  const renderUserGesture = useCallback((gestureType: string, size = 40) => {
    switch (gestureType) {
      case "rock":
        return (
          <svg width={size} height={size} viewBox="0 0 200 200">
            <defs>
              <radialGradient
                id="userRockGradient"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <stop offset="0%" stopColor="#8a7f7f" />
                <stop offset="50%" stopColor="#6a6262" />
                <stop offset="100%" stopColor="#4a4242" />
              </radialGradient>
            </defs>
            <path
              d="M100,50 C130,40 160,60 170,90 C180,120 170,150 150,170 C130,190 90,190 70,170 C50,150 40,120 50,90 C60,60 70,60 100,50 Z"
              fill="url(#userRockGradient)"
            />
          </svg>
        );
      case "paper":
        return (
          <svg width={size} height={size} viewBox="0 0 200 200">
            <defs>
              <linearGradient
                id="userPaperGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0e0e0" />
              </linearGradient>
            </defs>
            <path
              d="M40,30 C45,28 50,32 55,30 L160,30 C165,32 170,28 175,30 L175,170 C170,172 165,168 160,170 L55,170 C50,168 45,172 40,170 Z"
              fill="url(#userPaperGradient)"
            />
          </svg>
        );
      case "scissors":
        return (
          <svg width={size} height={size} viewBox="0 0 200 200">
            <defs>
              <linearGradient
                id="userBladeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#e0e0e0" />
                <stop offset="50%" stopColor="#b0b0b0" />
                <stop offset="100%" stopColor="#909090" />
              </linearGradient>
              <linearGradient
                id="userHandleGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff9e9e" />
                <stop offset="100%" stopColor="#e05555" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="10" fill="#777" />
            <path
              d="M100,100 C105,95 110,90 120,85 C130,80 140,75 150,65 C160,55 170,65 165,75 C160,85 150,95 140,100 C130,105 110,105 100,100 Z"
              fill="url(#userBladeGradient)"
            />
            <path
              d="M100,100 C105,105 110,110 120,115 C130,120 140,125 150,135 C160,145 170,135 165,125 C160,115 150,105 140,100 C130,95 110,95 100,100 Z"
              fill="url(#userBladeGradient)"
            />
            <path
              d="M100,100 C90,95 80,90 70,80 C60,70 40,65 35,75 C30,85 40,95 50,90 C60,85 70,90 80,95 C90,100 95,105 100,100 Z"
              fill="url(#userHandleGradient)"
            />
            <path
              d="M100,100 C90,105 80,110 70,120 C60,130 40,135 35,125 C30,115 40,105 50,110 C60,115 70,110 80,105 C90,100 95,95 100,100 Z"
              fill="url(#userHandleGradient)"
            />
          </svg>
        );
      default:
        return null;
    }
  }, []);

  // Render mascot characters - memoized to prevent unnecessary recreations
  const renderMascots = useCallback(() => {
    return (
      <>
        <div className="mascot mascot-rock">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#673AB7" />
            <circle cx="35" cy="40" r="5" fill="white" />
            <circle cx="65" cy="40" r="5" fill="white" />
            <path d="M40,65 Q50,75 60,65" stroke="white" strokeWidth="3" fill="none" />
          </svg>
        </div>
        <div className="mascot mascot-paper">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <rect x="15" y="15" width="70" height="70" rx="10" fill="#2196F3" />
            <circle cx="35" cy="40" r="5" fill="white" />
            <circle cx="65" cy="40" r="5" fill="white" />
            <path d="M35,65 Q50,75 65,65" stroke="white" strokeWidth="3" fill="none" />
          </svg>
        </div>
        <div className="mascot mascot-scissors">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <polygon points="50,15 20,85 80,85" fill="#F44336" />
            <circle cx="35" cy="45" r="5" fill="white" />
            <circle cx="65" cy="45" r="5" fill="white" />
            <path d="M40,65 Q50,60 60,65" stroke="white" strokeWidth="3" fill="none" />
          </svg>
        </div>
      </>
    );
  }, []);

  return (
    <div className="app theme-kids">
      <header>
        <h1>Rock Paper Scissors</h1>
        <p>Show your hand gesture to the webcam</p>
      </header>
      
      <div className="game-container">
        <div className="webcam-container">
          <HandTracker onHandGesture={handleHandGesture} />
          <div className="user-gesture">
            <h2>Your Gesture: {userGesture}</h2>
            {gestureTimer && !gestureConfirmed && (
              <div className="gesture-timer">Confirming gesture...</div>
            )}
            {gestureConfirmed && finalUserGesture && (
              <div className="confirmed-gesture">Gesture confirmed: {finalUserGesture}</div>
            )}
            {countdown && (
              <div className="countdown">{countdown}</div>
            )}
            {/* User gesture history with fixed display */}
            {renderUserGestureHistory()}
          </div>
          
          {/* Fixed statistics card below the user gesture card */}
          <div className="fixed-statistics">
            <GameStatistics 
              userGesture={finalUserGesture || userGesture}
              roundResult={roundResult}
              gameOver={gameOver}
              consecutiveWins={consecutiveWins}
              showToggle={false}
              alwaysShow={true}
            />
          </div>
        </div>
        
        <div className="game-info">
          <ComputerHand 
            gesture={computerGesture} 
            history={computerHistory}
          />
          
          {gameStarted && userHistory.length > 2 && (
            <GesturePrediction 
              userHistory={userHistory}
              computerHistory={computerHistory}
            />
          )}
          
          <GameResult
            userScore={userScore}
            computerScore={computerScore}
            roundResult={roundResult}
            roundNumber={roundsPlayed + 1}
            maxRounds={10}
            consecutiveWins={consecutiveWins}
            maxConsecutiveWins={4}
            gameOver={gameOver}
            winner={gameOver ? getWinner() : null}
            onReset={resetGame}
          />
          
          {/* Moved start game button below the score card */}
          {!gameStarted && !gameOver && (
            <div className="start-button-container">
              <button className="start-button" onClick={startGame}>
                Start Game
              </button>
            </div>
          )}
          
          <AchievementSystem
            userScore={userScore}
            computerScore={computerScore}
            roundsPlayed={roundsPlayed}
            consecutiveWins={consecutiveWins}
            roundResult={roundResult}
            gameOver={gameOver}
            winner={gameOver ? getWinner() : null}
          />
        </div>
      </div>
      
      {/* Render mascot characters */}
      {renderMascots()}
      
      {/* Encouraging messages */}
      {encouragementMessage && (
        <div className="encouragement" style={{
          top: Math.random() * 300 + 100,
          left: Math.random() * 500 + 100,
        }}>
          {encouragementMessage}
        </div>
      )}
    </div>
  );
}

export default App;
