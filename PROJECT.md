# Project Overview
- **Project**: Rock Paper Scissors - A webcam-based hand gesture game with kids/educational theme
- **Current Phase**: Optimization
- **Tech Stack**: TypeScript, React, TensorFlow.js, hand-pose-detection, localStorage
- **Environment**: Browser-based application

# File Structure
- src/main.tsx : Entry point for the application, Sets up React rendering
- src/App.tsx : Main game component, Handles game state, round logic, countdown (5 seconds), computer history, user history, kids/educational theme, mascot characters, and encouraging messages with fixed player choice timing
- src/components/HandTracker.tsx : Implements webcam hand tracking using TensorFlow.js with multiple paper gesture detection methods, improved finger extension detection, and debug visualization for better accuracy
- src/components/ComputerHand.tsx : Displays computer's choice with enhanced illustrative SVG representations and reduced-size horizontal history layout
- src/components/GameResult.tsx : Shows game score, round results, current round number, and win/lose/tie effects with kid-friendly messages
- src/components/AchievementSystem.tsx : Implements badges and achievements for game milestones with notification system
- src/components/GameStatistics.tsx : Tracks and displays player statistics including win rates, gesture usage, and streaks in a fixed card below the user gesture card
- src/components/GesturePrediction.tsx : Analyzes computer's pattern to predict its next move based on history
- src/App.css : Styles for the game interface including animations, kids/educational theme with bright colors, large buttons, and mascot characters

# Conversation Context
- **Last Topic**: Improving paper gesture recognition accuracy
- **Key Decisions**: Implemented multiple detection methods for paper gesture to significantly improve recognition accuracy
- **User Context**:
  - Technical Level: Intermediate
  - Preferences: React-based implementation with kids/educational visual style
  - Communication: Korean/English

# Implementation Status
## Current State
- **Active Feature**: Paper gesture recognition optimization
- **Progress**: Implemented four different methods to detect paper gesture with improved accuracy
- **Blockers**: None

## Code Evolution
- **Recent Changes**: 
  - Added four different methods to detect paper gesture for better accuracy
  - Implemented a new isFingerExtended function that considers multiple factors
  - Added finger-to-palm ratio calculation for better paper detection
  - Added fingertip vertical and horizontal alignment checks
  - Enabled debug visualization to help troubleshoot gesture recognition
  - Added keyboard shortcut (Ctrl+D) to toggle debug mode
  - Previous changes: Enhanced gesture recognition with improved angle calculations and finger position detection
  - Switched to full model for better accuracy
  - Added additional detection methods for scissors gesture
  - Improved paper gesture detection with parallel finger checks
  - Added finger direction vectors and angle calculations
- **Working Patterns**: Component-based architecture with React hooks for state management, localStorage for persistent data, memoization for performance, refs for avoiding stale closures
- **Failed Approaches**: Previous approach with simpler paper gesture detection had difficulty recognizing open palm consistently

# Requirements
- **Implemented**: 
  - Multiple paper gesture detection methods for significantly improved accuracy
  - Debug visualization for gesture recognition troubleshooting
  - Improved finger extension detection with multiple criteria
  - Finger-to-palm ratio calculation for better paper detection
  - Fingertip alignment checks for more accurate paper gesture recognition
  - Previous implementations: Improved hand gesture recognition for paper and scissors
  - Fixed game progression after countdown
  - Performance optimization with throttled detection and memoization
  - Enhanced win/lose effects
  - Computer move prediction system
  - Fixed player choice timing with finalUserGesture state
  - Webcam hand tracking with improved gesture recognition accuracy
  - Extended game countdown from 3 to 5 seconds
  - Computer opponent with enhanced SVG representations
  - 10-round game system
  - Consecutive win condition (4 wins)
  - Score tracking and game history (both computer and user)
  - Achievement system with notifications
  - Game statistics panel with gesture usage tracking in fixed position
  - Kids/Educational theme with bright primary colors
  - Animated transitions between game states
  - Mirrored webcam display
  - Win/lose/tie visual effects
  - Game start button below score card
  - Mascot characters with animations
  - Encouraging messages system
  - Extra large buttons and simplified UI
  - Child-friendly typography and visual design
  - Fixed user history display with proper SVG rendering
- **In Progress**: None
- **Pending**: None
- **Technical Constraints**: Requires webcam access and browser support for TensorFlow.js

# Critical Memory
- **Must Preserve**: Multiple paper gesture detection methods, debug visualization for gesture recognition, improved finger extension detection, finger-to-palm ratio calculation, fingertip alignment checks, enhanced gesture recognition algorithms, fixed game progression with refs to avoid stale closures, performance optimizations, enhanced win/lose effects, computer move prediction system, fixed player choice timing with finalUserGesture state, kids/educational theme, mascot characters, encouraging messages, achievement system, game statistics storage, 10-round game system, animated transitions, user history display with SVG rendering, 5-second countdown, improved gesture recognition
- **User Requirements**: Game must track consecutive wins, end after 10 rounds or 4 consecutive wins, and provide visual feedback for achievements with kid-friendly interface
- **Known Issues**: Hand gesture recognition still requires good lighting conditions

# Next Actions
- **Immediate**: Test the improved paper gesture recognition system
- **Open Questions**: None
