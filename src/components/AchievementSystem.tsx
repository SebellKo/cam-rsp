import React, { useState, useEffect, useRef, memo } from 'react';

interface AchievementSystemProps {
  userScore: number;
  computerScore: number;
  roundsPlayed: number;
  consecutiveWins: number;
  roundResult: string | null;
  gameOver: boolean;
  winner: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userScore,
  computerScore,
  roundsPlayed,
  consecutiveWins,
  roundResult,
  gameOver,
  winner
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<Achievement[]>([]);
  
  // Use ref to avoid recreating the achievements array on every render
  const achievementsRef = useRef<Achievement[]>([
    {
      id: 'first_win',
      title: 'First Victory!',
      description: 'Win your first round against the computer.',
      icon: '🏆',
      unlocked: false
    },
    {
      id: 'hat_trick',
      title: 'Hat Trick!',
      description: 'Win 3 rounds in a row.',
      icon: '🎩',
      unlocked: false
    },
    {
      id: 'comeback_kid',
      title: 'Comeback Kid!',
      description: 'Win after being 2 or more points behind.',
      icon: '🔄',
      unlocked: false
    },
    {
      id: 'perfect_game',
      title: 'Perfect Game!',
      description: 'Win a game without losing any rounds.',
      icon: '⭐',
      unlocked: false
    },
    {
      id: 'rock_master',
      title: 'Rock Master!',
      description: 'Win 3 rounds using rock.',
      icon: '🪨',
      unlocked: false
    },
    {
      id: 'paper_master',
      title: 'Paper Master!',
      description: 'Win 3 rounds using paper.',
      icon: '📄',
      unlocked: false
    },
    {
      id: 'scissors_master',
      title: 'Scissors Master!',
      description: 'Win 3 rounds using scissors.',
      icon: '✂️',
      unlocked: false
    },
    {
      id: 'game_master',
      title: 'Game Master!',
      description: 'Win 5 games in total.',
      icon: '👑',
      unlocked: false
    }
  ]);

  // Load achievements from localStorage on mount
  useEffect(() => {
    const savedAchievements = localStorage.getItem('rps-achievements');
    if (savedAchievements) {
      try {
        const parsed = JSON.parse(savedAchievements);
        setAchievements(parsed);
        achievementsRef.current = parsed;
      } catch (e) {
        console.error('Error parsing saved achievements:', e);
        setAchievements(achievementsRef.current);
      }
    } else {
      setAchievements(achievementsRef.current);
    }
  }, []);

  // Save achievements to localStorage when they change
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem('rps-achievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  // Check for achievements
  useEffect(() => {
    // Skip if no achievements loaded yet
    if (achievements.length === 0) return;
    
    const newAchievements = [...achievements];
    const newNotifications: Achievement[] = [];
    let achievementsChanged = false;

    // First win
    if (userScore > 0 && !newAchievements.find(a => a.id === 'first_win')?.unlocked) {
      const achievement = newAchievements.find(a => a.id === 'first_win');
      if (achievement) {
        achievement.unlocked = true;
        newNotifications.push(achievement);
        achievementsChanged = true;
      }
    }

    // Hat trick (3 consecutive wins)
    if (consecutiveWins >= 3 && !newAchievements.find(a => a.id === 'hat_trick')?.unlocked) {
      const achievement = newAchievements.find(a => a.id === 'hat_trick');
      if (achievement) {
        achievement.unlocked = true;
        newNotifications.push(achievement);
        achievementsChanged = true;
      }
    }

    // Comeback kid (win after being 2+ points behind)
    if (roundResult === 'win' && computerScore >= userScore + 1 && 
        !newAchievements.find(a => a.id === 'comeback_kid')?.unlocked) {
      const achievement = newAchievements.find(a => a.id === 'comeback_kid');
      if (achievement) {
        achievement.unlocked = true;
        newNotifications.push(achievement);
        achievementsChanged = true;
      }
    }

    // Perfect game (win without losing any rounds)
    if (gameOver && winner === 'user' && computerScore === 0 && 
        !newAchievements.find(a => a.id === 'perfect_game')?.unlocked) {
      const achievement = newAchievements.find(a => a.id === 'perfect_game');
      if (achievement) {
        achievement.unlocked = true;
        newNotifications.push(achievement);
        achievementsChanged = true;
      }
    }

    // Game master (win 5 games total)
    const gamesWon = parseInt(localStorage.getItem('rps-games-won') || '0');
    if (gameOver && winner === 'user') {
      const newGamesWon = gamesWon + 1;
      localStorage.setItem('rps-games-won', newGamesWon.toString());
      
      if (newGamesWon >= 5 && !newAchievements.find(a => a.id === 'game_master')?.unlocked) {
        const achievement = newAchievements.find(a => a.id === 'game_master');
        if (achievement) {
          achievement.unlocked = true;
          newNotifications.push(achievement);
          achievementsChanged = true;
        }
      }
    }

    // Update achievements if changed
    if (achievementsChanged) {
      setAchievements(newAchievements);
      setNotifications(prev => [...prev, ...newNotifications]);
    }
  }, [userScore, computerScore, consecutiveWins, roundResult, gameOver, winner, achievements]);

  // Remove notifications after they've been displayed
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <>
      <div className="achievements-container">
        {notifications.map((achievement, index) => (
          <div key={`${achievement.id}-${index}`} className="achievement-notification">
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-info">
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default memo(AchievementSystem);
