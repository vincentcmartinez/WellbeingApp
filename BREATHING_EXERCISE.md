# Breathing Exercise Feature

## Overview
The breathing exercise feature provides users with a guided deep breathing experience to help them take a mindful break from social media apps.

## How It Works

### User Flow
1. When a user attempts to open a social media app, they are redirected to the wellbeing break screen
2. They can select "Deep Breathing" from the available activities
3. This takes them to a dedicated breathing exercise screen

### Breathing Exercise Screen Features

#### Visual Progress Bar
- A progress bar that fills up during inhalation (3 seconds)
- The bar empties during exhalation (3 seconds)
- Color changes: Green during inhalation, Orange during exhalation

#### Interactive Button
- Users press and hold the button to start the breathing cycle
- Button text changes to indicate current phase ("Breathe In" / "Breathe Out")
- Button is disabled during the breathing cycle to prevent interruption

#### Breath Counter
- Tracks the number of completed breath cycles
- Users can repeat the exercise as many times as they want

#### Reset Functionality
- Reset button appears after completing at least one breath
- Allows users to start fresh and reset the counter

## Technical Implementation

### Components
- `BreathingExerciseScreen.tsx` - Main breathing exercise component
- Integrated into `RedirectScreen.tsx` for navigation

### Key Features
- **Animated Progress Bar**: Uses React Native's Animated API for smooth transitions
- **State Management**: Tracks breathing phase, breath count, and exercise status
- **Responsive Design**: Adapts to different screen sizes and color schemes
- **Accessibility**: Clear instructions and visual feedback

### Animation Details
- Progress bar animation duration: 3 seconds for both inhale and exhale
- Button scale animation on press for tactile feedback
- Smooth color transitions between breathing phases

## Usage Instructions

1. **Start**: Press the "Start Breathing" button
2. **Inhale**: Hold the button while the progress bar fills up (3 seconds)
3. **Exhale**: Release and breathe out as the progress bar empties (3 seconds)
4. **Repeat**: Continue the cycle as many times as desired
5. **Reset**: Use the reset button to start over

## Benefits
- Promotes mindfulness and stress reduction
- Provides a structured break from social media
- Helps users develop healthy breathing habits
- Encourages intentional app usage 