import React, { memo } from 'react';

interface ComputerHandProps {
  gesture: string;
  history: string[];
}

const ComputerHand: React.FC<ComputerHandProps> = ({ gesture, history }) => {
  // Render computer's gesture
  const renderComputerGesture = (gestureType: string, size = 100) => {
    switch (gestureType) {
      case "rock":
        return (
          <svg width={size} height={size} viewBox="0 0 200 200">
            <defs>
              <radialGradient
                id="rockGradient"
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
              fill="url(#rockGradient)"
            />
          </svg>
        );
      case "paper":
        return (
          <svg width={size} height={size} viewBox="0 0 200 200">
            <defs>
              <linearGradient
                id="paperGradient"
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
              fill="url(#paperGradient)"
            />
          </svg>
        );
      case "scissors":
        return (
          <svg width={size} height={size} viewBox="0 0 200 200">
            <defs>
              <linearGradient
                id="bladeGradient"
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
                id="handleGradient"
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
              fill="url(#bladeGradient)"
            />
            <path
              d="M100,100 C105,105 110,110 120,115 C130,120 140,125 150,135 C160,145 170,135 165,125 C160,115 150,105 140,100 C130,95 110,95 100,100 Z"
              fill="url(#bladeGradient)"
            />
            <path
              d="M100,100 C90,95 80,90 70,80 C60,70 40,65 35,75 C30,85 40,95 50,90 C60,85 70,90 80,95 C90,100 95,105 100,100 Z"
              fill="url(#handleGradient)"
            />
            <path
              d="M100,100 C90,105 80,110 70,120 C60,130 40,135 35,125 C30,115 40,105 50,110 C60,115 70,110 80,105 C90,100 95,95 100,100 Z"
              fill="url(#handleGradient)"
            />
          </svg>
        );
      default:
        return (
          <div className="waiting-gesture">
            <p>Waiting...</p>
          </div>
        );
    }
  };

  // Render computer's gesture history
  const renderComputerHistory = () => {
    if (history.length === 0) return null;
    
    return (
      <div className="history-container">
        <h3>Computer's History</h3>
        <div className="history-items-horizontal">
          {history.map((item, index) => (
            <div key={index} className="history-item-card">
              <div className="history-item-round">Round {index + 1}</div>
              <div className="history-item-gesture">
                {renderComputerGesture(item, 40)}
              </div>
              <div className={`history-item-name history-${item}`}>
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="computer-hand">
      <h2>Computer's Choice</h2>
      <div className="computer-gesture">
        {renderComputerGesture(gesture)}
      </div>
      {renderComputerHistory()}
    </div>
  );
};

export default memo(ComputerHand);
