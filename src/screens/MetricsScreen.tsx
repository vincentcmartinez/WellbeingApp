import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import StatisticsService from '../services/StatisticsService';

export const MetricsScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [quickMetrics, setQuickMetrics] = useState<any>(null);
  const [usageInsights, setUsageInsights] = useState<any>(null);
  const [fullStats, setFullStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [quick, insights, stats] = await Promise.all([
        StatisticsService.getQuickMetrics(),
        StatisticsService.getUsageInsights(),
        StatisticsService.getStatistics()
      ]);
      setQuickMetrics(quick);
      setUsageInsights(insights);
      setFullStats(stats);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
            Loading your metrics...
          </Text>
        </View>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && styles.darkContainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          📊 Your Digital Wellbeing Metrics
        </Text>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            📈 Overview
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Total Interruptions: {quickMetrics?.totalInterruptions || 0}
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Intention Success Rate: {quickMetrics?.intentionSuccessRate || '0%'}
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Average Sessions per Day: {quickMetrics?.avgSessionsPerDay || '0'}
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Current Streak: {quickMetrics?.streakDays || 0} days
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Total Days Active: {usageInsights?.totalDaysUsed || 0}
          </Text>
        </View>

        {/* Activity Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            🎯 Activity Choices
          </Text>
          {fullStats?.activityChoices ? (
            Object.entries(fullStats.activityChoices).map(([activity, count]: [string, any]) => (
              <Text key={activity} style={[styles.dataItem, isDarkMode && styles.darkText]}>
                {activity.charAt(0).toUpperCase() + activity.slice(1)}: {count} times
              </Text>
            ))
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No activity data yet
            </Text>
          )}
        </View>

        {/* Intention Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            💡 Intention Statistics
          </Text>
          {fullStats?.intentions ? (
            <>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Total Intentions Set: {fullStats.intentions.total}
              </Text>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Fulfilled: {fullStats.intentions.fulfilled}
              </Text>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Not Fulfilled: {fullStats.intentions.notFulfilled}
              </Text>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Currently Pending: {fullStats.intentions.pending}
              </Text>
            </>
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No intention data yet
            </Text>
          )}
        </View>

        {/* Post-Timer Behavior */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            📱 Post-Timer Behavior
          </Text>
          {fullStats?.postTimerBehavior ? (
            <>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Returned to App: {fullStats.postTimerBehavior.returnedToApp} times
              </Text>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Stayed in Wellbeing App: {fullStats.postTimerBehavior.stayedInWellbeingApp} times
              </Text>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Completed Reflections: {fullStats.postTimerBehavior.completedReflection} times
              </Text>
              <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
                Return Rate: {usageInsights?.returnToAppRate?.toFixed(1) || 0}%
              </Text>
            </>
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No post-timer behavior data yet
            </Text>
          )}
        </View>

        {/* Most Interrupted Apps */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            📱 Most Interrupted Apps
          </Text>
          {fullStats?.appsInterrupted && Object.keys(fullStats.appsInterrupted).length > 0 ? (
            Object.entries(fullStats.appsInterrupted)
              .sort(([,a]: [string, any], [,b]: [string, any]) => b - a)
              .slice(0, 5)
              .map(([packageName, count]: [string, any]) => (
                <Text key={packageName} style={[styles.dataItem, isDarkMode && styles.darkText]}>
                  {packageName.split('.').pop() || packageName}: {count} times
                </Text>
              ))
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No app interruption data yet
            </Text>
          )}
        </View>

        {/* Peak Usage Times */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            ⏰ Peak Usage Hours
          </Text>
          {usageInsights?.peakUsageHours?.length > 0 ? (
            usageInsights.peakUsageHours.map((hour: any, index: number) => (
              <Text key={index} style={[styles.dataItem, isDarkMode && styles.darkText]}>
                {hour.hour}:00 - {hour.hour + 1}:00: {hour.count} sessions
              </Text>
            ))
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No peak hours data yet
            </Text>
          )}
        </View>

        {/* Peak Usage Days */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            📅 Peak Usage Days
          </Text>
          {usageInsights?.peakUsageDays?.length > 0 ? (
            usageInsights.peakUsageDays.map((day: any, index: number) => (
              <Text key={index} style={[styles.dataItem, isDarkMode && styles.darkText]}>
                {day.day}: {day.count} sessions
              </Text>
            ))
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No peak days data yet
            </Text>
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            📝 Recent Sessions (Last 10)
          </Text>
          {fullStats?.sessions?.length > 0 ? (
            fullStats.sessions
              .slice(-10)
              .reverse()
              .map((session: any, index: number) => (
                <View key={session.id || index} style={styles.sessionItem}>
                  <Text style={[styles.sessionApp, isDarkMode && styles.darkText]}>
                    {session.appName}
                  </Text>
                  <Text style={[styles.sessionDetails, isDarkMode && styles.darkText]}>
                    {formatDate(session.timestamp)} at {formatTime(session.timestamp)}
                  </Text>
                  {session.activityChosen && (
                    <Text style={[styles.sessionDetails, isDarkMode && styles.darkText]}>
                      Activity: {session.activityChosen}
                    </Text>
                  )}
                  {session.intentionFulfilled !== undefined && (
                    <Text style={[styles.sessionDetails, isDarkMode && styles.darkText]}>
                      Intention: {session.intentionFulfilled ? 'Fulfilled' : 'Not fulfilled'}
                    </Text>
                  )}
                </View>
              ))
          ) : (
            <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
              No session data yet
            </Text>
          )}
        </View>

        {/* Data Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            ℹ️ Data Information
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            First Use: {fullStats?.firstUse ? formatDate(fullStats.firstUse) : 'Unknown'}
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Last Updated: {fullStats?.lastUpdated ? formatDate(fullStats.lastUpdated) : 'Unknown'}
          </Text>
          <Text style={[styles.dataItem, isDarkMode && styles.darkText]}>
            Total Sessions Recorded: {fullStats?.sessions?.length || 0}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDarkMode && styles.darkText]}>
            Pull down to refresh • Data stored locally on your device
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  darkContainer: {
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  darkText: {
    color: '#333333',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  dataItem: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    paddingLeft: 8,
  },
  sessionItem: {
    marginBottom: 12,
    paddingLeft: 8,
    paddingBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#999999',
  },
  sessionApp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});