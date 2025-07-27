# 🧘‍♀️ Wellbeing App

A React Native demo app that helps users take mindful breaks from social media by detecting when they're about to open social media apps and redirecting them to wellness activities instead.

## Features

- **App Detection**: Monitors for social media app launches (Instagram, X/Twitter, Facebook, TikTok, Snapchat)
- **Mindful Redirect**: When a social media app is detected, redirects to a wellbeing break screen
- **Wellness Activities**: Offers various activities like deep breathing, journaling, walking, and reading
- **Return Option**: Users can choose to return to the original app or stay in the wellbeing app
- **Dark Mode Support**: Automatically adapts to system dark/light mode

## Demo Functionality

Since this is a demo app for educational purposes, the app detection is simulated:

1. **Launch the app** - You'll see the main screen with information about monitored apps
2. **Wait 3 seconds** - The app will simulate detecting a social media app launch
3. **Redirect screen appears** - Shows wellness activities and options to return or stay
4. **Try activities** - Tap on any activity to see a confirmation message
5. **Return or stay** - Choose to return to the "detected" app or stay in the wellbeing app

## Monitored Apps

The app monitors these social media applications:
- Instagram (`com.instagram.android`)
- X/Twitter (`com.twitter.android`)
- Facebook (`com.facebook.katana`)
- TikTok (`com.zhiliaoapp.musically`)
- Snapchat (`com.snapchat.android`)

## Technical Implementation

### Architecture
- **AppDetectionService**: Handles app detection logic and data persistence
- **RedirectScreen**: Component for the wellbeing break interface
- **Main App**: Orchestrates the app flow and state management

### Key Technologies
- React Native 0.80.2
- TypeScript for type safety
- AsyncStorage for data persistence
- React Navigation (ready for future expansion)

### Real-World Implementation Notes

In a production app, you would need:

1. **Android Permissions**: 
   - `PACKAGE_USAGE_STATS` permission
   - User must enable "Usage Access" in Settings

2. **Usage Stats API**: 
   - Use Android's `UsageStatsManager` to detect app launches
   - Monitor foreground app changes

3. **Background Service**: 
   - Implement a foreground service to continuously monitor app usage
   - Handle app lifecycle events

4. **Accessibility Service**: 
   - Alternative approach using accessibility services
   - Can detect app switches and overlay content

## Getting Started

### Prerequisites
- Node.js >= 18
- React Native development environment
- Android Studio (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. For Android:
   ```bash
   npx react-native run-android
   ```

### Development

The app is structured for easy expansion:

- Add new social media apps in `AppDetectionService.ts`
- Create new wellness activities in `RedirectScreen.tsx`
- Implement real app detection using Android APIs
- Add user preferences and settings

## Educational Use

This app demonstrates:
- React Native app development
- State management with React hooks
- Component architecture
- Service layer patterns
- User interface design
- App lifecycle management

Perfect for teaching mobile development concepts and digital wellbeing principles.

## License

This project is created for educational purposes.
