import React, { useState, useEffect, useMemo } from 'react';

interface GesturePredictionProps {
  userHistory: string[];
  computerHistory: string[];
}

const GesturePrediction: React.FC<GesturePredictionProps> = ({ userHistory, computerHistory }) => {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  // Use useMemo to avoid recalculating on every render
  const predictedMove = useMemo(() => {
    if (computerHistory.length < 3) {
      return { prediction: null, confidence: 0 };
    }

    // Count frequency of each gesture
    const gestureCounts = {
      rock: 0,
      paper: 0,
      scissors: 0
    };

    // Count transitions (what gesture follows another)
    const transitions: Record<string, Record<string, number>> = {
      rock: { rock: 0, paper: 0, scissors: 0 },
      paper: { rock: 0, paper: 0, scissors: 0 },
      scissors: { rock: 0, paper: 0, scissors: 0 }
    };

    // Count gestures and transitions - only process valid gestures
    const validGestures = computerHistory.filter(
      gesture => gesture === 'rock' || gesture === 'paper' || gesture === 'scissors'
    );
    
    validGestures.forEach((gesture, index) => {
      gestureCounts[gesture]++;
      
      // Count transitions (what comes after each gesture)
      if (index < validGestures.length - 1) {
        const nextGesture = validGestures[index + 1];
        transitions[gesture][nextGesture]++;
      }
    });

    // Get the last gesture
    const lastGesture = validGestures[validGestures.length - 1];
    if (!lastGesture) {
      return { prediction: null, confidence: 0 };
    }

    // Check if there's a pattern based on transitions
    const transitionCounts = transitions[lastGesture];
    const totalTransitions = transitionCounts.rock + transitionCounts.paper + transitionCounts.scissors;
    
    if (totalTransitions > 0) {
      // Find the most likely next gesture based on transitions
      let maxCount = 0;
      let likelyGesture = null;
      
      for (const [gesture, count] of Object.entries(transitionCounts)) {
        if (count > maxCount) {
          maxCount = count;
          likelyGesture = gesture;
        }
      }
      
      if (likelyGesture) {
        const confidenceValue = Math.round((maxCount / totalTransitions) * 100);
        return { 
          prediction: likelyGesture, 
          confidence: confidenceValue
        };
      }
    }

    // Fallback to frequency analysis
    const totalGestures = gestureCounts.rock + gestureCounts.paper + gestureCounts.scissors;
    if (totalGestures > 0) {
      // Find the most frequent gesture
      let maxCount = 0;
      let mostFrequent = null;
      
      for (const [gesture, count] of Object.entries(gestureCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequent = gesture;
        }
      }
      
      if (mostFrequent) {
        const confidenceValue = Math.round((maxCount / totalGestures) * 80);
        return { 
          prediction: mostFrequent, 
          confidence: confidenceValue
        };
      }
    }

    return { prediction: null, confidence: 0 };
  }, [computerHistory]);

  // Update state only when prediction changes
  useEffect(() => {
    setPrediction(predictedMove.prediction);
    setConfidence(predictedMove.confidence);
  }, [predictedMove]);

  if (!prediction) return null;

  return (
    <div className="gesture-prediction">
      <h3>Computer's Next Move</h3>
      <div className="prediction-content">
        <p>Computer might play <span className={`prediction-${prediction}`}>{prediction}</span> next</p>
        <div className="confidence-meter">
          <div className="confidence-label">Confidence: {confidence}%</div>
          <div className="confidence-bar-container">
            <div 
              className="confidence-bar" 
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GesturePrediction);
