# Mood Tracking Feature

## Overview
The mood tracking feature allows users to record their emotional state when they're interrupted from social media apps, helping them understand their mood patterns and emotional wellbeing over time.

## How It Works

### User Flow
1. When a user attempts to open a social media app, they are redirected to the wellbeing break screen
2. They can select "Track Mood" from the available activities
3. This takes them to a dedicated mood tracking screen with the interrupted app context

### Mood Tracking Screen Features

#### Mood Selection
- Six mood options: Happy 😊, Sad 😢, Content 😌, Bored 😐, Anxious 😰, Neutral 😐
- Visual grid layout with emojis and color-coded borders
- Interactive selection with visual feedback

#### Reasoning Input
- Multi-line text input for users to explain their mood
- Required field to encourage thoughtful reflection
- Placeholder text to guide user input

#### Context Awareness
- Shows which app was interrupted (e.g., "You were about to open: Instagram")
- Provides context for why the user might be feeling a certain way

#### Data Storage
- Saves entries to AsyncStorage with timestamps
- Stores mood, reasoning, interrupted app, and timestamp
- Entries persist between app sessions

#### Recent Entries Display
- Shows the 5 most recent mood entries
- Displays mood emoji, label, timestamp, reasoning, and interrupted app
- Helps users track their emotional patterns over time

## Technical Implementation

### Components
- `MoodTrackingScreen.tsx` - Main mood tracking component
- Integrated into `RedirectScreen.tsx` for navigation

### Data Structure
```typescript
interface MoodEntry {
  id: string;
  timestamp: number;
  mood: string;
  reasoning: string;
  interruptedApp?: string;
}
```

### Storage
- Uses AsyncStorage to persist mood entries
- Entries are stored as JSON array
- New entries are added to the beginning of the array

### Key Features
- **Form Validation**: Requires both mood selection and reasoning
- **Loading States**: Shows loading indicator during save operations
- **Error Handling**: Graceful error handling with user feedback
- **Responsive Design**: Adapts to different screen sizes and color schemes
- **Accessibility**: Clear labels and visual feedback

## Usage Instructions

1. **Select Mood**: Tap on one of the six mood options
2. **Add Reasoning**: Type in the text area explaining why you feel this way
3. **Save Entry**: Tap "Save Mood Entry" to store your mood
4. **Review History**: Scroll down to see your recent mood entries
5. **Track Patterns**: Use the history to understand your emotional patterns

## Benefits
- **Self-Awareness**: Helps users understand their emotional triggers
- **Pattern Recognition**: Tracks mood changes over time
- **Mindful Reflection**: Encourages thoughtful consideration of emotions
- **Context Awareness**: Links moods to specific apps and situations
- **Emotional Intelligence**: Builds better understanding of emotional responses

## Data Privacy
- All mood data is stored locally on the device
- No data is transmitted to external servers
- Users have full control over their emotional data
- Data persists until the app is uninstalled

## Future Enhancements
- Mood analytics and trends visualization
- Export functionality for mood data
- Mood reminders and notifications
- Integration with other wellbeing features 