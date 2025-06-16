import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/hand-pose-detection';

interface HandTrackerProps {
  onHandGesture: (gesture: string) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandGesture }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<handpose.HandDetector | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoWidth, setVideoWidth] = useState(640);
  const [videoHeight, setVideoHeight] = useState(480);
  
  // Animation frame reference for cleanup
  const requestAnimationFrameRef = useRef<number | null>(null);
  
  // Last gesture state for stability
  const lastGestureRef = useRef<string>('');
  const gestureStabilityCountRef = useRef<number>(0);
  const gestureStabilityThreshold = 3;
  
  // Throttle detection to improve performance
  const lastDetectionTimeRef = useRef<number>(0);
  const detectionIntervalMs = 100; // Detect hands every 100ms instead of every frame

  // Store finger positions for debugging
  const [debugInfo, setDebugInfo] = useState<string>('');
  const debugModeRef = useRef<boolean>(true); // Set to true for debugging

  // Load the handpose model
  useEffect(() => {
    let isMounted = true;
    
    const loadModel = async () => {
      try {
        await tf.ready();
        // Use lower precision for better performance
        await tf.setBackend('webgl');
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
        tf.env().set('WEBGL_PACK', true);
        
        const model = handpose.SupportedModels.MediaPipeHands;
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'full', // Use full model for better accuracy
          maxHands: 1,
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        } as handpose.MediaPipeHandsModelConfig;
        
        const detector = await handpose.createDetector(model, detectorConfig);
        
        if (isMounted) {
          setModel(detector);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading hand model:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadModel();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Update canvas dimensions when video is ready - optimized to run less frequently
  useEffect(() => {
    const updateDimensions = () => {
      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        if (video.readyState >= 2) {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          
          // Only update if dimensions have changed
          if (videoWidth !== 0 && videoHeight !== 0 && 
              (videoWidth !== canvasRef.current?.width || 
               videoHeight !== canvasRef.current?.height)) {
            
            setVideoWidth(videoWidth);
            setVideoHeight(videoHeight);
            
            if (canvasRef.current) {
              canvasRef.current.width = videoWidth;
              canvasRef.current.height = videoHeight;
            }
          }
        }
      }
    };

    // Check dimensions once
    updateDimensions();
    
    // Then check less frequently
    const interval = setInterval(updateDimensions, 2000);
    return () => clearInterval(interval);
  }, []);

  // Memoized draw hand function to reduce function recreations
  const drawHand = useCallback((landmarks: handpose.Keypoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the current context state
    ctx.save();
    
    // Mirror the context horizontally
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    
    // Draw landmarks - simplified for performance
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i].x;
      const y = landmarks[i].y;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 3 * Math.PI);
      ctx.fillStyle = '#00FF00';
      ctx.fill();
    }
    
    // Draw connections between landmarks - only essential connections
    const fingerJoints = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [5, 6], [6, 7], [7, 8],
      // Middle finger
      [9, 10], [10, 11], [11, 12],
      // Ring finger
      [13, 14], [14, 15], [15, 16],
      // Pinky
      [17, 18], [18, 19], [19, 20],
      // Palm connections - reduced for performance
      [0, 5], [5, 9], [9, 13], [13, 17]
    ];
    
    ctx.beginPath();
    for (let i = 0; i < fingerJoints.length; i++) {
      const [start, end] = fingerJoints[i];
      if (landmarks[start] && landmarks[end]) {
        if (i === 0 || fingerJoints[i-1][1] !== start) {
          ctx.moveTo(landmarks[start].x, landmarks[start].y);
        }
        ctx.lineTo(landmarks[end].x, landmarks[end].y);
      }
    }
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Restore the context state
    ctx.restore();
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1: handpose.Keypoint, point2: handpose.Keypoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate angle between three points (in radians)
  const calculateAngle = useCallback((p1: handpose.Keypoint, p2: handpose.Keypoint, p3: handpose.Keypoint): number => {
    const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let angle = angle1 - angle2;
    
    // Normalize angle to be between 0 and 2π
    if (angle < 0) angle += 2 * Math.PI;
    if (angle > 2 * Math.PI) angle -= 2 * Math.PI;
    
    return angle;
  }, []);

  // Calculate finger curl (0 = straight, 1 = fully curled)
  const calculateFingerCurl = useCallback((base: handpose.Keypoint, middle: handpose.Keypoint, tip: handpose.Keypoint): number => {
    // Calculate vectors
    const baseToMiddle = {
      x: middle.x - base.x,
      y: middle.y - base.y
    };
    
    const middleToTip = {
      x: tip.x - middle.x,
      y: tip.y - middle.y
    };
    
    // Calculate magnitudes
    const baseToMiddleMag = Math.sqrt(baseToMiddle.x * baseToMiddle.x + baseToMiddle.y * baseToMiddle.y);
    const middleToTipMag = Math.sqrt(middleToTip.x * middleToTip.x + middleToTip.y * middleToTip.y);
    
    // Avoid division by zero
    if (baseToMiddleMag === 0 || middleToTipMag === 0) return 0;
    
    // Calculate dot product
    const dotProduct = baseToMiddle.x * middleToTip.x + baseToMiddle.y * middleToTip.y;
    
    // Calculate cosine of angle
    const cosAngle = dotProduct / (baseToMiddleMag * middleToTipMag);
    
    // Return curl value (1 - cosine of angle, normalized to 0-1 range)
    return (1 - Math.max(-1, Math.min(1, cosAngle))) / 2;
  }, []);

  // Calculate finger direction vector
  const calculateFingerDirection = useCallback((base: handpose.Keypoint, tip: handpose.Keypoint): {x: number, y: number} => {
    const dx = tip.x - base.x;
    const dy = tip.y - base.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    if (magnitude === 0) return {x: 0, y: 0};
    
    return {
      x: dx / magnitude,
      y: dy / magnitude
    };
  }, []);

  // Calculate dot product of two vectors
  const dotProduct = useCallback((v1: {x: number, y: number}, v2: {x: number, y: number}): number => {
    return v1.x * v2.x + v1.y * v2.y;
  }, []);

  // Check if a finger is extended based on multiple criteria
  const isFingerExtended = useCallback((
    base: handpose.Keypoint,
    middle: handpose.Keypoint,
    tip: handpose.Keypoint,
    wrist: handpose.Keypoint
  ): boolean => {
    // Calculate extension ratio
    const extension = calculateDistance(base, tip) / calculateDistance(base, middle);
    
    // Calculate curl
    const curl = calculateFingerCurl(base, middle, tip);
    
    // Calculate direction from wrist to tip
    const wristToTip = {
      x: tip.x - wrist.x,
      y: tip.y - wrist.y
    };
    
    // Calculate magnitude of wrist to tip
    const wristToTipMag = Math.sqrt(wristToTip.x * wristToTip.x + wristToTip.y * wristToTip.y);
    
    // Check if finger is pointing away from wrist
    const isPointingAway = wristToTipMag > calculateDistance(wrist, base);
    
    // A finger is extended if it has sufficient extension, low curl, and is pointing away from wrist
    return extension > 1.2 && curl < 0.5 && isPointingAway;
  }, [calculateDistance, calculateFingerCurl]);

  // Improved gesture determination function
  const determineGesture = useCallback((
    landmarks: handpose.Keypoint[], 
    keypoints3D: handpose.Keypoint3D[] = []
  ): string => {
    if (landmarks.length < 21) return 'unknown';

    // Get key points
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const indexBase = landmarks[5];
    const middleBase = landmarks[9];
    const ringBase = landmarks[13];
    const pinkyBase = landmarks[17];
    
    const indexMiddle = landmarks[6];
    const middleMiddle = landmarks[10];
    const ringMiddle = landmarks[14];
    const pinkyMiddle = landmarks[18];
    
    const indexKnuckle = landmarks[7];
    const middleKnuckle = landmarks[11];
    const ringKnuckle = landmarks[15];
    const pinkyKnuckle = landmarks[19];

    // Calculate finger extensions (distance from base to tip)
    const indexExtension = calculateDistance(indexBase, indexTip) / calculateDistance(indexBase, indexMiddle);
    const middleExtension = calculateDistance(middleBase, middleTip) / calculateDistance(middleBase, middleMiddle);
    const ringExtension = calculateDistance(ringBase, ringTip) / calculateDistance(ringBase, ringMiddle);
    const pinkyExtension = calculateDistance(pinkyBase, pinkyTip) / calculateDistance(pinkyBase, pinkyMiddle);
    
    // Calculate finger curl (improved for better accuracy)
    const indexCurl = calculateFingerCurl(indexBase, indexMiddle, indexTip);
    const middleCurl = calculateFingerCurl(middleBase, middleMiddle, middleTip);
    const ringCurl = calculateFingerCurl(ringBase, ringMiddle, ringTip);
    const pinkyCurl = calculateFingerCurl(pinkyBase, pinkyMiddle, pinkyTip);
    
    // Calculate finger directions
    const indexDirection = calculateFingerDirection(indexBase, indexTip);
    const middleDirection = calculateFingerDirection(middleBase, middleTip);
    const ringDirection = calculateFingerDirection(ringBase, ringTip);
    const pinkyDirection = calculateFingerDirection(pinkyBase, pinkyTip);
    
    // Calculate angles between fingers
    const indexMiddleAngle = Math.acos(Math.min(0.99, Math.max(-0.99, dotProduct(indexDirection, middleDirection))));
    const middleRingAngle = Math.acos(Math.min(0.99, Math.max(-0.99, dotProduct(middleDirection, ringDirection))));
    const ringPinkyAngle = Math.acos(Math.min(0.99, Math.max(-0.99, dotProduct(ringDirection, pinkyDirection))));
    
    // Calculate finger heights relative to wrist
    const indexHeight = indexTip.y - wrist.y;
    const middleHeight = middleTip.y - wrist.y;
    const ringHeight = ringTip.y - wrist.y;
    const pinkyHeight = pinkyTip.y - wrist.y;
    
    // Calculate finger separations
    const indexMiddleSeparation = calculateDistance(indexTip, middleTip);
    const middleRingSeparation = calculateDistance(middleTip, ringTip);
    const ringPinkySeparation = calculateDistance(ringTip, pinkyTip);
    
    // Calculate palm orientation (using cross product of vectors)
    const palmVector1 = {
      x: indexBase.x - wrist.x,
      y: indexBase.y - wrist.y
    };
    
    const palmVector2 = {
      x: pinkyBase.x - wrist.x,
      y: pinkyBase.y - wrist.y
    };
    
    // Cross product z-component (positive = palm facing camera, negative = palm facing away)
    const palmOrientation = palmVector1.x * palmVector2.y - palmVector1.y * palmVector2.x;
    
    // Use the improved finger extension check
    const isIndexExtended = isFingerExtended(indexBase, indexMiddle, indexTip, wrist);
    const isMiddleExtended = isFingerExtended(middleBase, middleMiddle, middleTip, wrist);
    const isRingExtended = isFingerExtended(ringBase, ringMiddle, ringTip, wrist);
    const isPinkyExtended = isFingerExtended(pinkyBase, pinkyMiddle, pinkyTip, wrist);
    
    // Calculate vertical alignment of fingertips (for paper gesture)
    const fingertipYValues = [indexTip.y, middleTip.y, ringTip.y, pinkyTip.y];
    const minY = Math.min(...fingertipYValues);
    const maxY = Math.max(...fingertipYValues);
    const fingertipYVariation = maxY - minY;
    
    // Calculate horizontal spacing of fingertips (for paper gesture)
    const fingertipXSpacing = [
      Math.abs(indexTip.x - middleTip.x),
      Math.abs(middleTip.x - ringTip.x),
      Math.abs(ringTip.x - pinkyTip.x)
    ];
    const avgXSpacing = (fingertipXSpacing[0] + fingertipXSpacing[1] + fingertipXSpacing[2]) / 3;
    const maxXSpacingVariation = Math.max(
      Math.abs(fingertipXSpacing[0] - avgXSpacing),
      Math.abs(fingertipXSpacing[1] - avgXSpacing),
      Math.abs(fingertipXSpacing[2] - avgXSpacing)
    );
    
    // Calculate palm area (for paper gesture)
    const palmWidth = calculateDistance(indexBase, pinkyBase);
    const palmHeight = Math.max(
      calculateDistance(wrist, indexBase),
      calculateDistance(wrist, middleBase),
      calculateDistance(wrist, ringBase),
      calculateDistance(wrist, pinkyBase)
    );
    const palmArea = palmWidth * palmHeight;
    
    // Calculate finger area (for paper gesture)
    const fingerArea = (
      calculateDistance(indexBase, indexTip) +
      calculateDistance(middleBase, middleTip) +
      calculateDistance(ringBase, ringTip) +
      calculateDistance(pinkyBase, pinkyTip)
    ) * palmWidth / 4;
    
    // Calculate finger-to-palm ratio (for paper gesture)
    const fingerPalmRatio = fingerArea / palmArea;
    
    // Debug information
    if (debugModeRef.current) {
      setDebugInfo(`
        Extensions: I=${indexExtension.toFixed(2)}, M=${middleExtension.toFixed(2)}, R=${ringExtension.toFixed(2)}, P=${pinkyExtension.toFixed(2)}
        Curls: I=${indexCurl.toFixed(2)}, M=${middleCurl.toFixed(2)}, R=${ringCurl.toFixed(2)}, P=${pinkyCurl.toFixed(2)}
        Angles: IM=${(indexMiddleAngle * 180 / Math.PI).toFixed(2)}°, MR=${(middleRingAngle * 180 / Math.PI).toFixed(2)}°, RP=${(ringPinkyAngle * 180 / Math.PI).toFixed(2)}°
        Extended: I=${isIndexExtended}, M=${isMiddleExtended}, R=${isRingExtended}, P=${isPinkyExtended}
        Y-Variation: ${fingertipYVariation.toFixed(2)}
        X-Spacing Var: ${maxXSpacingVariation.toFixed(2)}
        Finger/Palm: ${fingerPalmRatio.toFixed(2)}
        Palm: ${palmOrientation > 0 ? 'Facing camera' : 'Facing away'}
      `);
    }
    
    // Rock: All fingers are curled
    if (indexCurl > 0.4 && middleCurl > 0.4 && ringCurl > 0.4 && pinkyCurl > 0.4) {
      return 'rock';
    }
    
    // Paper: Multiple detection methods for better accuracy
    
    // Method 1: All fingers extended with similar heights and proper spacing
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      // Check if fingertips are at similar heights (reduced threshold)
      if (fingertipYVariation < 50) {
        // Check if fingers have reasonable spacing
        if (maxXSpacingVariation < 30 && avgXSpacing > 10) {
          return 'paper';
        }
      }
    }
    
    // Method 2: Based on finger-to-palm ratio and finger extension
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      if (fingerPalmRatio > 0.6 && palmOrientation > 0) {
        return 'paper';
      }
    }
    
    // Method 3: Based on finger angles and curl values
    if (indexCurl < 0.3 && middleCurl < 0.3 && ringCurl < 0.3 && pinkyCurl < 0.3) {
      // Check if fingers are roughly parallel
      if (indexMiddleAngle < Math.PI/4 && middleRingAngle < Math.PI/4 && ringPinkyAngle < Math.PI/4) {
        return 'paper';
      }
    }
    
    // Method 4: Simplified paper detection focusing on extension and curl only
    const totalCurl = indexCurl + middleCurl + ringCurl + pinkyCurl;
    const totalExtension = indexExtension + middleExtension + ringExtension + pinkyExtension;
    
    if (totalCurl < 1.0 && totalExtension > 5.0) {
      return 'paper';
    }
    
    // Scissors: Index and middle fingers extended, others curled
    // Improved to detect scissors even when fingers are slightly separated
    if (isIndexExtended && isMiddleExtended && 
        !isRingExtended && !isPinkyExtended && 
        indexMiddleAngle < Math.PI/4) {
      
      // Check if index and middle fingers are relatively close and parallel
      if (indexMiddleSeparation < 50) {
        return 'scissors';
      }
    }
    
    // Alternative scissors detection: V-shape with index and middle fingers
    if (isIndexExtended && isMiddleExtended && 
        !isRingExtended && !isPinkyExtended && 
        indexMiddleAngle < Math.PI/3 && indexMiddleAngle > Math.PI/12) {
      
      // Check if index and middle fingers form a V shape
      const indexMiddleBase = calculateDistance(indexBase, middleBase);
      const indexMiddleTip = calculateDistance(indexTip, middleTip);
      
      if (indexMiddleTip > indexMiddleBase * 1.2) {
        return 'scissors';
      }
    }
    
    return 'unknown';
  }, [calculateDistance, calculateFingerCurl, calculateFingerDirection, dotProduct, isFingerExtended]);

  // Detect hand gestures with performance optimizations
  useEffect(() => {
    if (!model) return;

    const detectHands = async () => {
      // Throttle detection to improve performance
      const now = performance.now();
      if (now - lastDetectionTimeRef.current < detectionIntervalMs) {
        requestAnimationFrameRef.current = requestAnimationFrame(detectHands);
        return;
      }
      lastDetectionTimeRef.current = now;
      
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        try {
          const video = webcamRef.current.video;
          const hands = await model.estimateHands(video);
          
          if (hands.length > 0) {
            const landmarks = hands[0].keypoints;
            const keypoints3D = hands[0].keypoints3D || [];
            
            drawHand(landmarks);
            
            // Determine gesture (rock, paper, scissors)
            const gesture = determineGesture(landmarks, keypoints3D);
            
            // Stabilize gesture detection
            if (gesture === lastGestureRef.current) {
              gestureStabilityCountRef.current++;
              if (gestureStabilityCountRef.current >= gestureStabilityThreshold && gesture !== 'unknown') {
                onHandGesture(gesture);
              }
            } else {
              lastGestureRef.current = gesture;
              gestureStabilityCountRef.current = 0;
            }
          } else {
            // Clear canvas when no hands detected
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          }
        } catch (error) {
          console.error("Error detecting hands:", error);
        }
      }
      
      requestAnimationFrameRef.current = requestAnimationFrame(detectHands);
    };
    
    detectHands();
    
    // Cleanup function
    return () => {
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
    };
  }, [model, onHandGesture, drawHand, determineGesture]);

  // Toggle debug mode with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        debugModeRef.current = !debugModeRef.current;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="hand-tracker">
      {loading && <div className="loading">Loading hand tracking model...</div>}
      <Webcam
        ref={webcamRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 640,
          height: 480,
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)'
        }}
        width={640}
        height={480}
        mirrored={true}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user"
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 640,
          height: 480
        }}
        width={640}
        height={480}
      />
      {debugModeRef.current && (
        <div className="debug-info" style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          zIndex: 10,
          whiteSpace: 'pre-line'
        }}>
          {debugInfo}
        </div>
      )}
    </div>
  );
};

export default React.memo(HandTracker);
