import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActivityChoice {
  breathing: number;
  moodTracking: number;
  simplify: number;
  setIntention: number;
  returnToApp: number; // chose to return without doing activity
}

export interface IntentionStats {
  total: number;
  fulfilled: number;
  notFulfilled: number;
  pending: number; // currently active
}

export interface PostTimerBehavior {
  returnedToApp: number;
  stayedInWellbeingApp: number;
  completedReflection: number;
}

export interface SessionData {
  id: string;
  timestamp: number;
  appName: string;
  packageName: string;
  activityChosen?: 'breathing' | 'moodTracking' | 'simplify' | 'setIntention' | 'returnToApp';
  intentionSet?: boolean;
  intentionFulfilled?: boolean | null; // null = pending, true/false = completed
  returnedToApp?: boolean;
  sessionDuration?: number;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday = 0)
  reflectionAdded?: boolean;
}

export interface UserStatistics {
  // Activity selection tracking
  activityChoices: ActivityChoice;
  
  // Intention fulfillment tracking
  intentions: IntentionStats;
  
  // App usage after timer
  postTimerBehavior: PostTimerBehavior;
  
  // General usage stats
  totalInterruptions: number;
  appsInterrupted: Record<string, number>; // packageName -> count
  
  // Time-based patterns (hour 0-23, day 0-6)
  hourlyPatterns: Record<string, number>;
  dailyPatterns: Record<string, number>;
  
  // Session history for detailed analysis
  sessions: SessionData[];
  
  // Metadata
  firstUse: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'wellbeing_user_statistics';
const MAX_SESSIONS = 1000; // Keep last 1000 sessions to prevent storage bloat

class StatisticsService {
  private stats: UserStatistics | null = null;

  // Initialize default stats
  private getDefaultStats(): UserStatistics {
    return {
      activityChoices: {
        breathing: 0,
        moodTracking: 0,
        simplify: 0,
        setIntention: 0,
        returnToApp: 0
      },
      intentions: {
        total: 0,
        fulfilled: 0,
        notFulfilled: 0,
        pending: 0
      },
      postTimerBehavior: {
        returnedToApp: 0,
        stayedInWellbeingApp: 0,
        completedReflection: 0
      },
      totalInterruptions: 0,
      appsInterrupted: {},
      hourlyPatterns: {},
      dailyPatterns: {},
      sessions: [],
      firstUse: Date.now(),
      lastUpdated: Date.now()
    };
  }

  // Load stats from storage
  async loadStats(): Promise<UserStatistics> {
    try {
      if (this.stats) return this.stats;

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.stats = JSON.parse(stored);
        console.log('📊 Loaded user statistics:', {
          totalInterruptions: this.stats!.totalInterruptions,
          totalSessions: this.stats!.sessions.length
        });
      } else {
        this.stats = this.getDefaultStats();
        console.log('📊 Initialized new user statistics');
      }
      return this.stats;
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.stats = this.getDefaultStats();
      return this.stats;
    }
  }

  // Save stats to storage
  private async saveStats(): Promise<void> {
    try {
      if (!this.stats) return;
      
      this.stats.lastUpdated = Date.now();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
      console.log('💾 Statistics saved');
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track app interruption
  async trackInterruption(appName: string, packageName: string): Promise<string> {
    const stats = await this.loadStats();
    const now = new Date();
    const sessionId = this.generateSessionId();

    // Update counters
    stats.totalInterruptions++;
    stats.appsInterrupted[packageName] = (stats.appsInterrupted[packageName] || 0) + 1;
    
    // Update time patterns
    const hour = now.getHours().toString();
    const day = now.getDay().toString();
    stats.hourlyPatterns[hour] = (stats.hourlyPatterns[hour] || 0) + 1;
    stats.dailyPatterns[day] = (stats.dailyPatterns[day] || 0) + 1;

    // Create session record
    const session: SessionData = {
      id: sessionId,
      timestamp: now.getTime(),
      appName,
      packageName,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay()
    };

    stats.sessions.push(session);

    // Trim sessions if too many
    if (stats.sessions.length > MAX_SESSIONS) {
      stats.sessions = stats.sessions.slice(-MAX_SESSIONS);
    }

    await this.saveStats();
    console.log(`📊 Tracked interruption: ${appName} (${packageName})`);
    return sessionId;
  }

  // Track activity choice
  async trackActivityChoice(sessionId: string, activity: keyof ActivityChoice): Promise<void> {
    const stats = await this.loadStats();
    
    // Update activity choice counter
    stats.activityChoices[activity]++;

    // Update session record
    const session = stats.sessions.find(s => s.id === sessionId);
    if (session) {
      session.activityChosen = activity === 'returnToApp' ? 'returnToApp' : activity as any;
    }

    await this.saveStats();
    console.log(`📊 Tracked activity choice: ${activity}`);
  }

  // Track intention creation
  async trackIntentionSet(sessionId: string): Promise<void> {
    const stats = await this.loadStats();
    
    stats.intentions.total++;
    stats.intentions.pending++;

    // Update session record
    const session = stats.sessions.find(s => s.id === sessionId);
    if (session) {
      session.intentionSet = true;
    }

    await this.saveStats();
    console.log('📊 Tracked intention set');
  }

  // Track intention fulfillment
  async trackIntentionFulfillment(sessionId: string, fulfilled: boolean, reflectionAdded: boolean = false): Promise<void> {
    const stats = await this.loadStats();
    
    // Update intention stats
    if (fulfilled) {
      stats.intentions.fulfilled++;
    } else {
      stats.intentions.notFulfilled++;
    }
    stats.intentions.pending = Math.max(0, stats.intentions.pending - 1);

    // Track reflection completion
    if (reflectionAdded) {
      stats.postTimerBehavior.completedReflection++;
    }

    // Update session record
    const session = stats.sessions.find(s => s.id === sessionId);
    if (session) {
      session.intentionFulfilled = fulfilled;
      session.reflectionAdded = reflectionAdded;
    }

    await this.saveStats();
    console.log(`📊 Tracked intention fulfillment: ${fulfilled ? 'fulfilled' : 'not fulfilled'}`);
  }

  // Track post-timer behavior
  async trackPostTimerBehavior(sessionId: string, returnedToApp: boolean): Promise<void> {
    const stats = await this.loadStats();
    
    if (returnedToApp) {
      stats.postTimerBehavior.returnedToApp++;
    } else {
      stats.postTimerBehavior.stayedInWellbeingApp++;
    }

    // Update session record
    const session = stats.sessions.find(s => s.id === sessionId);
    if (session) {
      session.returnedToApp = returnedToApp;
    }

    await this.saveStats();
    console.log(`📊 Tracked post-timer behavior: ${returnedToApp ? 'returned to app' : 'stayed in wellbeing app'}`);
  }

  // Get current statistics
  async getStatistics(): Promise<UserStatistics> {
    return await this.loadStats();
  }

  // Get usage insights for metrics tab
  async getUsageInsights(): Promise<{
    topInterruptedApps: Array<{name: string, count: number, percentage: number}>;
    activityPreferences: Array<{activity: string, count: number, percentage: number}>;
    intentionSuccessRate: number;
    returnToAppRate: number;
    peakUsageHours: Array<{hour: number, count: number}>;
    peakUsageDays: Array<{day: string, count: number}>;
    averageSessionsPerDay: number;
    totalDaysUsed: number;
  }> {
    const stats = await this.loadStats();
    const totalActivities = Object.values(stats.activityChoices).reduce((sum, count) => sum + count, 0);
    const totalIntentions = stats.intentions.fulfilled + stats.intentions.notFulfilled;

    // Top interrupted apps
    const topApps = Object.entries(stats.appsInterrupted)
      .map(([pkg, count]) => ({
        name: pkg.split('.').pop() || pkg,
        count,
        percentage: (count / stats.totalInterruptions) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Activity preferences
    const activityPrefs = Object.entries(stats.activityChoices)
      .map(([activity, count]) => ({
        activity,
        count,
        percentage: totalActivities > 0 ? (count / totalActivities) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Peak usage patterns
    const peakHours = Object.entries(stats.hourlyPatterns)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDays = Object.entries(stats.dailyPatterns)
      .map(([day, count]) => ({ day: dayNames[parseInt(day)], count }))
      .sort((a, b) => b.count - a.count);

    // Calculate usage duration
    const firstUse = new Date(stats.firstUse);
    const lastUpdate = new Date(stats.lastUpdated);
    const totalDaysUsed = Math.max(1, Math.ceil((lastUpdate.getTime() - firstUse.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      topInterruptedApps: topApps,
      activityPreferences: activityPrefs,
      intentionSuccessRate: totalIntentions > 0 ? (stats.intentions.fulfilled / totalIntentions) * 100 : 0,
      returnToAppRate: stats.postTimerBehavior.returnedToApp + stats.postTimerBehavior.stayedInWellbeingApp > 0 
        ? (stats.postTimerBehavior.returnedToApp / (stats.postTimerBehavior.returnedToApp + stats.postTimerBehavior.stayedInWellbeingApp)) * 100 
        : 0,
      peakUsageHours: peakHours,
      peakUsageDays: peakDays,
      averageSessionsPerDay: stats.totalInterruptions / totalDaysUsed,
      totalDaysUsed
    };
  }

  // Clear all statistics (for testing/reset)
  async clearStatistics(): Promise<void> {
    this.stats = this.getDefaultStats();
    await this.saveStats();
    console.log('🗑️ Statistics cleared');
  }

  // Export statistics for backup/analysis
  async exportStatistics(): Promise<string> {
    const stats = await this.loadStats();
    return JSON.stringify(stats, null, 2);
  }

  // Get simplified metrics for quick dashboard display
  async getQuickMetrics(): Promise<{
    totalInterruptions: number;
    mostUsedActivity: string;
    intentionSuccessRate: string;
    avgSessionsPerDay: string;
    topApp: string;
    streakDays: number;
  }> {
    const stats = await this.loadStats();
    const insights = await this.getUsageInsights();
    
    // Find most used activity
    const mostUsedActivity = insights.activityPreferences.length > 0 
      ? insights.activityPreferences[0].activity 
      : 'None';
    
    // Calculate current streak (consecutive days with interruptions)
    const sessions = stats.sessions.sort((a, b) => b.timestamp - a.timestamp);
    let streakDays = 0;
    let currentDay = new Date().toDateString();
    
    for (const session of sessions) {
      const sessionDay = new Date(session.timestamp).toDateString();
      if (sessionDay === currentDay) {
        streakDays++;
        currentDay = new Date(new Date(session.timestamp).getTime() - 24 * 60 * 60 * 1000).toDateString();
      } else {
        break;
      }
    }
    
    return {
      totalInterruptions: stats.totalInterruptions,
      mostUsedActivity: mostUsedActivity.charAt(0).toUpperCase() + mostUsedActivity.slice(1),
      intentionSuccessRate: `${Math.round(insights.intentionSuccessRate)}%`,
      avgSessionsPerDay: insights.averageSessionsPerDay.toFixed(1),
      topApp: insights.topInterruptedApps.length > 0 ? insights.topInterruptedApps[0].name : 'None',
      streakDays
    };
  }

  // Get time-based usage patterns for charts
  async getUsagePatterns(): Promise<{
    hourlyData: Array<{hour: number, count: number}>;
    dailyData: Array<{day: string, count: number}>;
    weeklyTrend: Array<{week: string, count: number}>;
  }> {
    const stats = await this.loadStats();
    
    // Hourly data (0-23)
    const hourlyData = Array.from({length: 24}, (_, hour) => ({
      hour,
      count: stats.hourlyPatterns[hour.toString()] || 0
    }));
    
    // Daily data
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData = dayNames.map((day, index) => ({
      day,
      count: stats.dailyPatterns[index.toString()] || 0
    }));
    
    // Weekly trend (last 8 weeks)
    const weeklyData: Array<{week: string, count: number}> = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      const weekSessions = stats.sessions.filter(session => 
        session.timestamp >= weekStart.getTime() && session.timestamp < weekEnd.getTime()
      );
      weeklyData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        count: weekSessions.length
      });
    }
    
    return {
      hourlyData,
      dailyData,
      weeklyTrend: weeklyData
    };
  }
}

export default new StatisticsService();