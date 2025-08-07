# 🧘‍♀️ Wellbeing App

A comprehensive React Native app designed to promote digital wellbeing by helping users take mindful breaks from social media. The app detects when users are about to open social media apps and redirects them to wellness activities, encouraging intentional and mindful technology use.

## ✨ Features

### 🏠 **Modern Home Screen**
- **Activity Cards**: 2x2 grid of wellness activities (Deep Breathing, Set Intention, Track Mood, Simplify)
- **Monitoring Controls**: Toggle to start/stop app detection with visual status indicators
- **Clean Design**: Modern UI with dark header, pastel pink monitoring banner, and centered activity layout

### 🎯 **Set Intention Feature**
- **Time Selection**: Choose from 15 seconds to 60 minutes for mindful sessions
- **Intention Setting**: Write specific intentions for app usage
- **Background Timer**: Native Android service runs timers in background
- **Completion Dialog**: Beautiful modal with reflection prompts and fulfillment tracking
- **Statistics Tracking**: Monitor intention success rates and user behavior

### 📊 **Metrics & Analytics**
- **Usage Statistics**: Track app interruptions, intention fulfillment, and session data
- **Visual Dashboard**: Modern card-based layout with key metrics
- **Session History**: View past intention sessions and outcomes
- **Progress Tracking**: Monitor digital wellbeing improvements over time

### 🎨 **Activity Screens**
- **Deep Breathing**: Guided breathing exercises for stress relief
- **Mood Tracking**: Daily mood logging and emotional awareness
- **Simplify**: Digital decluttering and organization tools
- **Settings**: App configuration and user preferences

### 🔧 **Technical Features**
- **Native Android Integration**: Real app detection using UsageStatsManager
- **Overlay Permissions**: Display interruption screens over other apps
- **Background Services**: Persistent monitoring and timer services
- **Data Persistence**: AsyncStorage for user data and session history
- **Dark Mode Support**: Automatic theme adaptation
- **Tab Navigation**: Intuitive bottom navigation with image icons

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- React Native development environment
- Android Studio (for Android development)
- Android device or emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WellbeingApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run on Android**
   ```bash
   npx react-native run-android
   ```

### Required Permissions

The app requires several Android permissions for full functionality:

1. **Usage Access Permission**
   - Go to Settings > Apps > Wellbeing App > Permissions
   - Enable "Usage Access" to allow app detection

2. **Display Over Other Apps**
   - Go to Settings > Apps > Wellbeing App > Permissions
   - Enable "Display over other apps" for interruption screens

3. **Battery Optimization**
   - Go to Settings > Apps > Wellbeing App > Battery
   - Disable battery optimization for background monitoring

## 📱 App Structure

### Screens & Components

```
src/
├── screens/
│   ├── HomeScreen.tsx          # Main dashboard with activity cards
│   ├── MetricsScreen.tsx       # Statistics and analytics
│   └── SettingsScreen.tsx      # App configuration
├── components/
│   ├── TabNavigation.tsx       # Bottom navigation bar
│   ├── RedirectScreen.tsx      # Interruption screen with activities
│   ├── IntentionScreen.tsx     # Intention setting and timer
│   ├── BreathingExerciseScreen.tsx
│   ├── MoodTrackingScreen.tsx
│   └── SimplifyScreen.tsx
└── services/
    ├── AppDetectionService.ts  # App monitoring logic
    └── StatisticsService.ts    # Analytics and data tracking
```

### Native Android Modules

```
android/app/src/main/java/com/wellbeingapp/
├── AppDetectionModule.kt       # App usage monitoring
├── IntentionTimerModule.kt     # Background timer service
├── PersistentOverlayService.kt # Interruption overlay display
└── OverlayActivity.kt          # Full-screen interruption UI
```

## 🎯 How It Works

### 1. **App Detection**
- Monitors foreground app changes using Android's UsageStatsManager
- Detects when social media apps are launched
- Triggers interruption overlay automatically

### 2. **Interruption Flow**
- Displays full-screen overlay with wellness activities
- Offers options to continue to app or take a wellbeing break
- Provides 4 curated activities with custom icons

### 3. **Intention Setting**
- Users can set specific time limits and intentions
- Background timer runs independently of the app
- Completion dialog collects feedback and reflections

### 4. **Data Collection**
- Tracks app interruptions and user responses
- Monitors intention fulfillment rates
- Stores session data for analytics

## 🎨 Design System

### Color Palette
- **Primary Green**: `#9ac790` (headers, primary buttons)
- **Light Green**: `#f0f9e6` (cards, inputs)
- **Pastel Pink**: `#FFE6F0` (monitoring banner)
- **Dark Gray**: `#2C2C2C` (headers)
- **White**: `#ffffff` (backgrounds)

### Typography
- **Headers**: 24px, bold
- **Section Titles**: 18px, semibold
- **Body Text**: 16px, regular
- **Captions**: 14px, regular

### Components
- **Cards**: Rounded corners (10-20px), subtle shadows
- **Buttons**: Consistent padding, rounded corners
- **Inputs**: Light green backgrounds, rounded borders
- **Modals**: Full-screen overlays with green headers

## 🔧 Development

### Adding New Features

1. **New Activity Screen**
   ```typescript
   // Create component in src/components/
   export const NewActivityScreen: React.FC<ActivityScreenProps> = ({ onBack }) => {
     // Implementation
   };
   ```

2. **Update Navigation**
   ```typescript
   // Add to App.tsx navigation logic
   {activeTab === 'home' && currentActivity === 'New Activity' && (
     <NewActivityScreen onBack={() => setCurrentActivity(null)} />
   )}
   ```

3. **Add to Home Screen**
   ```typescript
   // Add activity card in HomeScreen.tsx
   <TouchableOpacity 
     style={[styles.card, { backgroundColor: '#color' }]}
     onPress={() => handleActivityPress('New Activity')}
   >
     <Image source={require('../../images/Icon.png')} style={styles.cardIcon} />
     <Text style={styles.cardText}>New Activity</Text>
   </TouchableOpacity>
   ```

### Monitoring New Apps

1. **Update AppDetectionService**
   ```typescript
   // Add package name to monitored apps
   const MONITORED_APPS = [
     'com.instagram.android',
     'com.twitter.android',
     'com.newapp.android' // Add new app
   ];
   ```

2. **Update Native Module**
   ```kotlin
   // Add to AppDetectionModule.kt
   private val MONITORED_PACKAGES = setOf(
       "com.instagram.android",
       "com.twitter.android",
       "com.newapp.android" // Add new app
   )
   ```

## 📊 Analytics & Insights

The app collects anonymous usage data to help users understand their digital habits:

- **Interruption Frequency**: How often social media apps are opened
- **Break Uptake**: Percentage of times users choose wellbeing activities
- **Intention Success**: Rate of fulfilled intentions vs. set intentions
- **Session Duration**: Average time spent in mindful sessions
- **Activity Preferences**: Most popular wellbeing activities

## 🎓 Educational Value

This project demonstrates:

- **React Native Development**: Modern mobile app architecture
- **Native Module Integration**: Android-specific functionality
- **State Management**: Complex app state with React hooks
- **UI/UX Design**: Modern, accessible interface design
- **Background Services**: Persistent app monitoring
- **Data Persistence**: Local storage and analytics
- **Permission Handling**: Android permission management
- **Component Architecture**: Reusable, maintainable code structure

Perfect for learning mobile development, digital wellbeing principles, and modern app design patterns.

## 🤝 Contributing

This is an educational project. Feel free to:
- Fork and experiment with new features
- Improve the UI/UX design
- Add new wellbeing activities
- Enhance the analytics system
- Optimize performance

## 📄 License

This project is created for educational purposes and digital wellbeing research.

---

**Built with ❤️ for mindful technology use**
