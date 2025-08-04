import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppInfo {
  packageName: string;
  appName: string;
  timestamp: number;
}

export interface SocialMediaApp {
  packageName: string;
  appName: string;
  category: string;
  description: string;
  priority: number;
}

// Define social media apps with categories and priorities
export const SOCIAL_MEDIA_APPS: { [key: string]: SocialMediaApp } = {
  'com.instagram.android': {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    category: 'Photo Sharing',
    description: 'Photo and video sharing platform',
    priority: 1,
  },
  'com.facebook.katana': {
    packageName: 'com.facebook.katana',
    appName: 'Facebook',
    category: 'Social Network',
    description: 'General social networking platform',
    priority: 2,
  },
  'com.twitter.android': {
    packageName: 'com.twitter.android',
    appName: 'Twitter/X',
    category: 'Microblogging',
    description: 'Short-form text and media sharing',
    priority: 3,
  },
  'com.snapchat.android': {
    packageName: 'com.snapchat.android',
    appName: 'Snapchat',
    category: 'Ephemeral Content',
    description: 'Temporary photo and video sharing',
    priority: 4,
  },
  'com.linkedin.android': {
    packageName: 'com.linkedin.android',
    appName: 'LinkedIn',
    category: 'Professional Network',
    description: 'Professional networking and job platform',
    priority: 5,
  },
  'com.pinterest': {
    packageName: 'com.pinterest',
    appName: 'Pinterest',
    category: 'Visual Discovery',
    description: 'Image and idea discovery platform',
    priority: 6,
  },
  'com.reddit.frontpage': {
    packageName: 'com.reddit.frontpage',
    appName: 'Reddit',
    category: 'Community Discussion',
    description: 'Community-based discussion platform',
    priority: 7,
  },
  'com.whatsapp': {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    category: 'Messaging',
    description: 'Instant messaging and calling',
    priority: 8,
  },
  'com.zhiliaoapp.musically': {
    packageName: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    category: 'Short Video',
    description: 'Short-form video content platform',
    priority: 9,
  },
  'com.google.android.youtube': {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    category: 'Video Content',
    description: 'Video sharing and streaming platform',
    priority: 10,
  },
};

export class AppDetectionService {
  private static readonly REDIRECTED_APP_KEY = 'redirectedApp';

  static getAllSocialMediaApps(): { packageName: string; displayName: string }[] {
    return Object.values(SOCIAL_MEDIA_APPS).map(app => ({
      packageName: app.packageName,
      displayName: app.appName,
    }));
  }

  static async checkInstalledSocialMediaApps(): Promise<SocialMediaApp[]> {
    try {
      // For now, we'll use a simple approach to check for installed apps
      // In a production app, you would use PackageManager to check each app
      const installedApps: SocialMediaApp[] = [];
      
      // Check for common social media apps that might be installed
      // This is a simplified approach - in reality you'd query the PackageManager
      const commonApps = [
        'com.instagram.android',
        'com.facebook.katana', 
        'com.twitter.android',
        'com.snapchat.android',
        'com.google.android.youtube'
      ];
      
      for (const packageName of commonApps) {
        if (SOCIAL_MEDIA_APPS[packageName]) {
          // For demo purposes, we'll assume Instagram and YouTube are installed
          // In a real implementation, you'd check PackageManager.isPackageInstalled()
          if (packageName === 'com.instagram.android' || packageName === 'com.google.android.youtube') {
            installedApps.push(SOCIAL_MEDIA_APPS[packageName]);
          }
        }
      }
      
      return installedApps;
    } catch (error) {
      console.error('Error checking installed social media apps:', error);
      return [];
    }
  }

  static async storeRedirectedApp(appInfo: AppInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(this.REDIRECTED_APP_KEY, JSON.stringify(appInfo));
    } catch (error) {
      console.error('Error storing redirected app:', error);
    }
  }

  static async getRedirectedApp(): Promise<AppInfo | null> {
    try {
      const storedApp = await AsyncStorage.getItem(this.REDIRECTED_APP_KEY);
      return storedApp ? JSON.parse(storedApp) : null;
    } catch (error) {
      console.error('Error getting redirected app:', error);
      return null;
    }
  }

  static async clearRedirectedApp(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.REDIRECTED_APP_KEY);
    } catch (error) {
      console.error('Error clearing redirected app:', error);
    }
  }
} 