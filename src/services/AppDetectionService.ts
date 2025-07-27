import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppInfo {
  packageName: string;
  appName: string;
  timestamp: number;
}

export interface SocialMediaApp {
  packageName: string;
  appName: string;
  displayName: string;
}

export class AppDetectionService {
  private static readonly SOCIAL_MEDIA_APPS: SocialMediaApp[] = [
    {
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      displayName: 'Instagram',
    },
    {
      packageName: 'com.twitter.android',
      appName: 'X (Twitter)',
      displayName: 'X (Twitter)',
    },
    {
      packageName: 'com.facebook.katana',
      appName: 'Facebook',
      displayName: 'Facebook',
    },
    {
      packageName: 'com.zhiliaoapp.musically',
      appName: 'TikTok',
      displayName: 'TikTok',
    },
    {
      packageName: 'com.snapchat.android',
      appName: 'Snapchat',
      displayName: 'Snapchat',
    },
  ];


  static isSocialMediaApp(packageName: string): boolean {
    return this.SOCIAL_MEDIA_APPS.some(app => app.packageName === packageName);
  }


  static getAppInfo(packageName: string): SocialMediaApp | null {
    return this.SOCIAL_MEDIA_APPS.find(app => app.packageName === packageName) || null;
  }

  static async storeRedirectedApp(appInfo: AppInfo): Promise<void> {
    try {
      await AsyncStorage.setItem('redirectedFrom', JSON.stringify(appInfo));
    } catch (error) {
      console.error('Error storing redirected app:', error);
    }
  }

  static async getRedirectedApp(): Promise<AppInfo | null> {
    try {
      const stored = await AsyncStorage.getItem('redirectedFrom');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting redirected app:', error);
      return null;
    }
  }


  static async clearRedirectedApp(): Promise<void> {
    try {
      await AsyncStorage.removeItem('redirectedFrom');
    } catch (error) {
      console.error('Error clearing redirected app:', error);
    }
  }


  static simulateAppDetection(): AppInfo {
    const randomApp = this.SOCIAL_MEDIA_APPS[Math.floor(Math.random() * this.SOCIAL_MEDIA_APPS.length)];
    
    return {
      packageName: randomApp.packageName,
      appName: randomApp.appName,
      timestamp: Date.now(),
    };
  }


  static getAllSocialMediaApps(): SocialMediaApp[] {
    return [...this.SOCIAL_MEDIA_APPS];
  }
} 