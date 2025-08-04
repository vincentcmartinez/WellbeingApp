# Simplify Feature

## Overview
The Simplify feature helps users declutter their digital life by analyzing their installed social media apps and providing recommendations on which ones to keep or remove based on redundancy and purpose.

## How It Works

### User Flow
1. When a user attempts to open a social media app, they are redirected to the wellbeing break screen
2. They can select "Simplify" from the available activities
3. This takes them to a dedicated simplify screen that analyzes their social media apps

### Simplify Screen Features

#### App Analysis
- Scans for installed social media apps on the device
- Categorizes apps by type (Photo Sharing, Social Network, etc.)
- Provides descriptions and purposes for each app

#### Smart Recommendations
- Prioritizes apps based on their unique value and purpose
- Suggests keeping 2-3 apps that serve different functions
- Recommends removing redundant or less essential apps

#### Visual Organization
- Color-coded categories for easy identification
- "Keep These Apps" section with green styling
- "Consider Removing" section with orange styling
- Category badges with distinct colors

#### Action-Oriented Interface
- "Remove" buttons that open device settings
- Direct navigation to app uninstallation
- Educational tips for digital wellness

## Technical Implementation

### Components
- `SimplifyScreen.tsx` - Main simplify component
- Integrated into `RedirectScreen.tsx` for navigation

### App Database
```typescript
interface SocialMediaApp {
  packageName: string;
  appName: string;
  category: string;
  description: string;
  priority: number; // Lower number = higher priority to keep
}
```

### Supported Apps
- **Instagram** - Photo Sharing (Priority: 1)
- **Facebook** - Social Network (Priority: 2)
- **Twitter/X** - Microblogging (Priority: 3)
- **Snapchat** - Ephemeral Content (Priority: 4)
- **LinkedIn** - Professional Network (Priority: 5)
- **Pinterest** - Visual Discovery (Priority: 6)
- **Reddit** - Community Discussion (Priority: 7)
- **WhatsApp** - Messaging (Priority: 8)
- **TikTok** - Short Video (Priority: 9)
- **YouTube** - Video Content (Priority: 10)

### Recommendation Algorithm
- Sorts apps by priority (lower number = higher priority)
- Keeps top 2-3 apps based on total count
- Suggests removing the rest to reduce digital clutter
- Adapts recommendations based on number of installed apps

## Usage Instructions

1. **Access**: Select "Simplify" from the wellbeing break screen
2. **Review**: See all your installed social media apps
3. **Understand**: Read the recommendations and reasoning
4. **Act**: Tap "Remove" buttons to uninstall suggested apps
5. **Learn**: Read the digital wellness tips

## Benefits
- **Reduced Digital Clutter**: Fewer apps mean less distraction
- **Focused Usage**: Concentrate on apps that provide real value
- **Better Mental Health**: Less social media overwhelm
- **Intentional Choices**: Make conscious decisions about app usage
- **Digital Wellness**: Build healthier technology habits

## Digital Wellness Tips
- Keep apps that serve different purposes
- Remove apps you haven't used in the last month
- Consider using web versions instead of apps
- Set time limits for remaining apps

## Privacy & Security
- No data is transmitted to external servers
- App analysis happens locally on the device
- User maintains full control over app decisions
- No tracking of app usage or removal actions

## Future Enhancements
- Real-time app usage analytics
- Custom priority settings for users
- Integration with digital wellbeing tools
- App usage time tracking
- Weekly/monthly decluttering reminders 