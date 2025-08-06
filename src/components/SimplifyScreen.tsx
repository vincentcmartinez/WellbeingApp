import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { AppDetectionService, SOCIAL_MEDIA_APPS } from '../services/AppDetectionService';

interface SimplifyScreenProps {
  onBack: () => void;
}

interface SocialMediaApp {
  packageName: string;
  appName: string;
  category: string;
  description: string;
  priority: number; // Lower number = higher priority to keep
}

export const SimplifyScreen: React.FC<SimplifyScreenProps> = ({
  onBack,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [installedApps, setInstalledApps] = useState<SocialMediaApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInstalledApps();
  }, []);

  const checkInstalledApps = async () => {
    setIsLoading(true);
    try {
      // Use the AppDetectionService to check for installed social media apps
      const installedAppsList = await AppDetectionService.checkInstalledSocialMediaApps();
      
      console.log('Detected installed apps:', installedAppsList.map(app => app.appName));
      
      setInstalledApps(installedAppsList);
    } catch (error) {
      console.error('Error checking installed apps:', error);
      // Fallback to empty list instead of mock data
      setInstalledApps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAppCategory = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'Photo Sharing': '#E91E63',
      'Social Network': '#2196F3',
      'Microblogging': '#1DA1F2',
      'Ephemeral Content': '#FFC107',
      'Professional Network': '#0077B5',
      'Visual Discovery': '#E60023',
      'Community Discussion': '#FF4500',
      'Messaging': '#25D366',
      'Short Video': '#000000',
      'Video Content': '#FF0000',
    };
    return categoryColors[category] || '#666666';
  };

  const getRecommendations = () => {
    if (installedApps.length <= 1) {
      return {
        keep: installedApps,
        delete: [],
        message: 'You have a good balance of social media apps.',
      };
    }

    // Sort by priority (lower number = higher priority to keep)
    const sortedApps = [...installedApps].sort((a, b) => a.priority - b.priority);
    
    // Keep the top 2-3 apps, suggest deleting the rest
    const keepCount = Math.min(2, Math.ceil(installedApps.length / 2));
    const keep = sortedApps.slice(0, keepCount);
    const toDelete = sortedApps.slice(keepCount);

    return {
      keep,
      delete: toDelete,
      message: `Consider keeping ${keepCount} apps and removing ${toDelete.length} to reduce digital clutter.`,
    };
  };

  const openAppSettings = (packageName: string) => {
    Alert.alert(
      'Open App Settings',
      'This will take you to your device settings where you can uninstall the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ]
    );
  };

  const recommendations = getRecommendations();

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, isDarkMode && styles.darkText]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Simplify Your Digital Life
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, isDarkMode && styles.darkText]}>
            Digital Decluttering
          </Text>
          <Text style={[styles.introText, isDarkMode && styles.darkText]}>
            Having too many social media apps can lead to digital overwhelm. 
            Here's what we found on your device:
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
              Checking your apps...
            </Text>
          </View>
        ) : (
          <>
                         {installedApps.length > 0 ? (
               <View style={styles.statsContainer}>
                 <Text style={[styles.statsText, isDarkMode && styles.darkText]}>
                   You have {installedApps.length} social media app{installedApps.length !== 1 ? 's' : ''} installed
                 </Text>
               </View>
             ) : (
               <View style={[styles.statsContainer, { backgroundColor: '#fff3cd' }]}>
                 <Text style={[styles.statsText, isDarkMode && styles.darkText]}>
                   No social media apps detected
                 </Text>
                 <Text style={[styles.statsSubtext, isDarkMode && styles.darkText]}>
                   Great job keeping your device clutter-free!
                 </Text>
               </View>
             )}

                         {installedApps.length > 0 ? (
               <View style={styles.recommendationSection}>
                 <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                   Our Recommendation
                 </Text>
                 <Text style={[styles.recommendationText, isDarkMode && styles.darkText]}>
                   {recommendations.message}
                 </Text>
               </View>
             ) : (
               <View style={[styles.recommendationSection, { backgroundColor: '#d4edda' }]}>
                 <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                   Great News!
                 </Text>
                 <Text style={[styles.recommendationText, isDarkMode && styles.darkText]}>
                   Your device is already well-organized with no social media apps detected. 
                   Keep up the great work maintaining a clutter-free digital environment!
                 </Text>
               </View>
             )}

            {recommendations.keep.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                  Keep These Apps
                </Text>
                <Text style={[styles.sectionSubtitle, isDarkMode && styles.darkText]}>
                  These serve different purposes and provide value
                </Text>
                {recommendations.keep.map((app) => (
                  <View key={app.packageName} style={[styles.appCard, styles.keepCard, isDarkMode && styles.darkAppCard]}>
                    <View style={styles.appInfo}>
                      <Text style={[styles.appName, isDarkMode && styles.darkText]}>
                        {app.appName}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getAppCategory(app.category) }]}>
                        <Text style={styles.categoryText}>{app.category}</Text>
                      </View>
                    </View>
                    <Text style={[styles.appDescription, isDarkMode && styles.darkText]}>
                      {app.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {recommendations.delete.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                  Consider Removing
                </Text>
                <Text style={[styles.sectionSubtitle, isDarkMode && styles.darkText]}>
                  These may be redundant or less essential
                </Text>
                {recommendations.delete.map((app) => (
                  <TouchableOpacity
                    key={app.packageName}
                    style={[styles.appCard, styles.deleteCard, isDarkMode && styles.darkAppCard]}
                    onPress={() => openAppSettings(app.packageName)}
                  >
                    <View style={styles.appInfo}>
                      <Text style={[styles.appName, isDarkMode && styles.darkText]}>
                        {app.appName}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getAppCategory(app.category) }]}>
                        <Text style={styles.categoryText}>{app.category}</Text>
                      </View>
                    </View>
                    <Text style={[styles.appDescription, isDarkMode && styles.darkText]}>
                      {app.description}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => openAppSettings(app.packageName)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.tipsSection}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                Tips for Digital Wellness
              </Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, isDarkMode && styles.darkText]}>
                  Keep apps that serve different purposes
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, isDarkMode && styles.darkText]}>
                  Remove apps you haven't used in the last month
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, isDarkMode && styles.darkText]}>
                  Consider using web versions instead of apps
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, isDarkMode && styles.darkText]}>
                  Set time limits for remaining apps
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#7dc0c0',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  darkText: {
    color: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  statsContainer: {
    backgroundColor: '#e4f6f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  statsSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
    textAlign: 'center',
  },
  recommendationSection: {
    backgroundColor: '#e4f6f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333333',
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  section: {
    marginBottom: 30,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
  appCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  keepCard: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4CAF50',
  },
  deleteCard: {
    backgroundColor: '#fff3e0',
    borderColor: '#FF9800',
  },
  darkAppCard: {
    backgroundColor: '#ffffff',
  },
  appInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  appDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  removeButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipBullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    flex: 1,
  },
}); 