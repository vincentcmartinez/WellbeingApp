import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import StatisticsService from '../services/StatisticsService';

interface MetricsPreviewProps {
  onBack: () => void;
}

export const MetricsPreview: React.FC<MetricsPreviewProps> = ({ onBack }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [quickMetrics, setQuickMetrics] = useState<any>(null);
  const [usageInsights, setUsageInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [quick, insights] = await Promise.all([
        StatisticsService.getQuickMetrics(),
        StatisticsService.getUsageInsights()
      ]);
      setQuickMetrics(quick);
      setUsageInsights(insights);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Loading Metrics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          📊 Usage Metrics Preview
        </Text>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>
            {quickMetrics?.totalInterruptions || 0}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
            Total Interruptions
          </Text>
        </View>
        
        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>
            {quickMetrics?.intentionSuccessRate || '0%'}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
            Intention Success
          </Text>
        </View>

        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>
            {quickMetrics?.avgSessionsPerDay || '0'}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
            Avg. Sessions/Day
          </Text>
        </View>

        <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
          <Text style={[styles.statNumber, isDarkMode && styles.darkText]}>
            {quickMetrics?.streakDays || 0}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkText]}>
            Day Streak
          </Text>
        </View>
      </View>

      {/* Activity Preferences */}
      <View style={[styles.section, isDarkMode && styles.darkCard]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          🎯 Activity Preferences
        </Text>
        {usageInsights?.activityPreferences?.map((activity: any, index: number) => (
          <View key={index} style={styles.activityRow}>
            <Text style={[styles.activityName, isDarkMode && styles.darkText]}>
              {activity.activity.charAt(0).toUpperCase() + activity.activity.slice(1)}
            </Text>
            <View style={styles.activityStats}>
              <Text style={[styles.activityCount, isDarkMode && styles.darkText]}>
                {activity.count} times
              </Text>
              <Text style={[styles.activityPercent, isDarkMode && styles.darkText]}>
                ({activity.percentage.toFixed(1)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Most Interrupted Apps */}
      <View style={[styles.section, isDarkMode && styles.darkCard]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          📱 Most Interrupted Apps
        </Text>
        {usageInsights?.topInterruptedApps?.map((app: any, index: number) => (
          <View key={index} style={styles.appRow}>
            <Text style={[styles.appName, isDarkMode && styles.darkText]}>
              {app.name}
            </Text>
            <View style={styles.appStats}>
              <Text style={[styles.appCount, isDarkMode && styles.darkText]}>
                {app.count} times
              </Text>
              <Text style={[styles.appPercent, isDarkMode && styles.darkText]}>
                ({app.percentage.toFixed(1)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Usage Patterns */}
      <View style={[styles.section, isDarkMode && styles.darkCard]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          ⏰ Peak Usage Times
        </Text>
        {usageInsights?.peakUsageHours?.map((hour: any, index: number) => (
          <View key={index} style={styles.timeRow}>
            <Text style={[styles.timeName, isDarkMode && styles.darkText]}>
              {hour.hour}:00 - {hour.hour + 1}:00
            </Text>
            <Text style={[styles.timeCount, isDarkMode && styles.darkText]}>
              {hour.count} sessions
            </Text>
          </View>
        ))}
      </View>

      {/* Behavior Summary */}
      <View style={[styles.section, isDarkMode && styles.darkCard]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
          📈 Behavior Summary
        </Text>
        <Text style={[styles.summaryText, isDarkMode && styles.darkText]}>
          • Return to app rate: {usageInsights?.returnToAppRate?.toFixed(1) || 0}%
        </Text>
        <Text style={[styles.summaryText, isDarkMode && styles.darkText]}>
          • Most used activity: {quickMetrics?.mostUsedActivity || 'None'}
        </Text>
        <Text style={[styles.summaryText, isDarkMode && styles.darkText]}>
          • Total days active: {usageInsights?.totalDaysUsed || 0}
        </Text>
      </View>

      <View style={styles.note}>
        <Text style={[styles.noteText, isDarkMode && styles.darkText]}>
          💡 This is a preview of your usage statistics. A full metrics dashboard with charts and trends will be available in a future update.
        </Text>
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
  header: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  darkText: {
    color: '#333333',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  darkCard: {
    backgroundColor: '#e8e8e8',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityName: {
    fontSize: 16,
    color: '#333333',
  },
  activityStats: {
    flexDirection: 'row',
    gap: 8,
  },
  activityCount: {
    fontSize: 14,
    color: '#666666',
  },
  activityPercent: {
    fontSize: 14,
    color: '#999999',
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  appName: {
    fontSize: 16,
    color: '#333333',
    textTransform: 'capitalize',
  },
  appStats: {
    flexDirection: 'row',
    gap: 8,
  },
  appCount: {
    fontSize: 14,
    color: '#666666',
  },
  appPercent: {
    fontSize: 14,
    color: '#999999',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timeName: {
    fontSize: 16,
    color: '#333333',
  },
  timeCount: {
    fontSize: 14,
    color: '#666666',
  },
  summaryText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  note: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noteText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});