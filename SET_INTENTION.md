# Set Intention Feature

## Overview
The Set Intention feature helps users practice mindful technology use by setting specific time limits and intentions before using social media apps. This promotes intentional, purposeful app usage rather than mindless scrolling.

## How It Works

### User Flow
1. When a user attempts to open a social media app, they are redirected to the wellbeing break screen
2. They can select "Set Intention" from the available activities
3. This takes them to a dedicated intention screen where they can:
   - Set a maximum time limit (5, 10, 15, 20, 30, 45, or 60 minutes)
   - Write down their specific intention for using the app
4. Once started, a timer counts down and displays their intention
5. When time runs out, a popup asks about intention fulfillment and provides reflection options

### Intention Screen Features

#### Time Limit Selection
- Predefined time options: 15 seconds (for testing), 5, 10, 15, 20, 30, 45, 60 minutes
- Visual selection with highlighted active option
- Default selection of 15 minutes
- 15-second option available for quick testing

#### Intention Setting
- Large text input area for detailed intentions
- Placeholder text with examples
- Required field before session can start
- Examples: "Check messages from family", "Watch one educational video", "Browse for 10 minutes"

#### Active Session Display
- Large countdown timer showing remaining time
- Display of the user's intention for reference
- Option to end session early
- Clean, focused interface during active use
- **Background Timer**: Timer continues running while user uses the app
- **Easy Navigation**: "Go Back" button to return to main screen
- **Session Start Notification**: Clear confirmation that session has begun

#### Time-Up Dialog
- Shows the user's original intention
- Asks if they fulfilled their intention (Yes/No)
- Optional reflection input
- Choice to close app or keep using it

## Technical Implementation

### Components
- `IntentionScreen.tsx` - Main intention component
- Integrated into `RedirectScreen.tsx` for navigation

### Data Structure
```typescript
interface IntentionData {
  timestamp: number;
  packageName: string;
  appName: string;
  maxTimeMinutes: number;
  intention: string;
  startTime: number;
  totalUseTime?: number;
  intentionFulfilled?: boolean;
  keptUsingAfterPopup?: boolean;
  reflection?: string;
}
```

### Storage
- **Current Intention**: Stored in AsyncStorage as 'currentIntention'
- **Completed Intentions**: Stored in AsyncStorage as 'completedIntentions' array
- **Data Persistence**: All intention sessions are saved locally

### Timer Implementation
- **Native Android Service**: `IntentionTimerService` runs in background
- **Foreground Service**: Timer continues even when app is backgrounded
- **App Launch**: Automatically opens target app using Android PackageManager
- **Event Communication**: Uses React Native events to notify when timer completes

### App Launch Strategy
- **Automatic App Launch**: Target app opens automatically when session starts
- **Background Timer**: Native Android service runs timer in background
- **No Interruption Loop**: App is added to exclusion list during active session
- **Seamless Experience**: User is taken directly to the app they intended to use

## Usage Instructions

### Setting Up an Intention
1. **Access**: Select "Set Intention" from the wellbeing break screen
2. **Choose Time**: Select your desired time limit from the options (15 seconds available for testing)
3. **Write Intention**: Be specific about what you want to accomplish
4. **Start Session**: Tap "Start Mindful Session" to begin - the app opens automatically and timer runs in background

### During Active Session
- **Background Timer**: Timer runs in Android service, visible in notification
- **No Interruptions**: App is excluded from wellbeing breaks during session
- **Early End**: Option to end session early from main screen

### When Time Runs Out
1. **Review Intention**: See your original intention
2. **Assess Fulfillment**: Answer whether you fulfilled your intention
3. **Reflect**: Optionally add personal insights
4. **Choose Action**: Decide to close the app or continue using it

## Data Collection

### Saved Information
- **Timestamp**: When the intention was set
- **App Details**: Package name and display name
- **Time Settings**: Maximum time limit and actual use time
- **Intention**: User's stated purpose
- **Outcome**: Whether intention was fulfilled
- **Behavior**: Whether they kept using after popup
- **Reflection**: Optional personal insights

### Privacy & Security
- All data stored locally on device
- No data transmitted to external servers
- User maintains full control over their data
- Optional reflection field for personal insights

## Benefits

### Mindful Technology Use
- **Intentional Usage**: Promotes purposeful app use
- **Time Awareness**: Helps users track their time spent
- **Self-Reflection**: Encourages thinking about app usage patterns

### Digital Wellness
- **Reduced Mindless Scrolling**: Sets clear boundaries
- **Better Time Management**: Helps users stick to their plans
- **Increased Awareness**: Makes users conscious of their digital habits
- **Seamless Experience**: Automatic app launch and background timer
- **No Interruption Loops**: Apps are excluded during active sessions

### Personal Growth
- **Self-Accountability**: Users track their own behavior
- **Pattern Recognition**: Helps identify usage patterns over time
- **Goal Setting**: Practice setting and achieving digital goals

## Future Enhancements

### Analytics & Insights
- Weekly/monthly intention fulfillment reports
- Usage pattern analysis
- Success rate tracking by app type

### Advanced Features
- Custom time limits beyond predefined options
- Recurring intention templates
- Integration with calendar for scheduled intentions

### Social Features
- Share successful intention strategies
- Community intention challenges
- Accountability partnerships

## Integration with Other Features

### Mood Tracking
- Link intention fulfillment with mood changes
- Track how app usage affects emotional state

### Simplify Feature
- Use intention data to inform app removal decisions
- Identify apps where intentions are rarely fulfilled

### Breathing Exercise
- Combine with intention setting for enhanced mindfulness
- Use breathing as a transition before starting app use 