import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { AppInfo } from '../services/AppDetectionService';
import { BreathingExerciseScreen } from './BreathingExerciseScreen';
import { MoodTrackingScreen } from './MoodTrackingScreen';
import { SimplifyScreen } from './SimplifyScreen';
import { IntentionScreen } from './IntentionScreen';
import StatisticsService from '../services/StatisticsService';

interface RedirectScreenProps {
  redirectedFrom: AppInfo;
  currentSessionId: string | null;
  onReturnToApp: () => void;
  onStayHere: () => void;
}

export const RedirectScreen: React.FC<RedirectScreenProps> = ({
  redirectedFrom,
  currentSessionId,
  onReturnToApp,
  onStayHere,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [showMoodTracking, setShowMoodTracking] = useState(false);
  const [showSimplify, setShowSimplify] = useState(false);
  const [showIntention, setShowIntention] = useState(false);

  const handleReturnToApp = () => {
    // Directly call the parent's return function
    onReturnToApp();
  };

  const handleActivityPress = async (activityName: string) => {
    // Track activity choice for statistics
    if (currentSessionId) {
      let activityKey: 'breathing' | 'moodTracking' | 'simplify' | 'setIntention' | undefined;
      
      if (activityName === 'Deep Breathing') {
        activityKey = 'breathing';
      } else if (activityName === 'Tracking your mood') {
        activityKey = 'moodTracking';
      } else if (activityName === 'Simplify') {
        activityKey = 'simplify';
      } else if (activityName === 'Set Intention') {
        activityKey = 'setIntention';
      }
      
      if (activityKey) {
        try {
          await StatisticsService.trackActivityChoice(currentSessionId, activityKey);
          console.log(`📊 Tracked activity choice: ${activityKey}`);
        } catch (error) {
          console.error('Error tracking activity choice:', error);
        }
      }
    }

    // Navigate to the chosen activity
    if (activityName === 'Deep Breathing') {
      setShowBreathingExercise(true);
    } else if (activityName === 'Tracking your mood') {
      setShowMoodTracking(true);
    } else if (activityName === 'Simplify') {
      setShowSimplify(true);
    } else if (activityName === 'Set Intention') {
      setShowIntention(true);
    } else {
      Alert.alert(
        'Activity Selected',
        `Great choice! ${activityName} is a wonderful way to take care of yourself.`,
        [
          {
            text: 'Continue',
          },
        ]
      );
    }
  };

  if (showBreathingExercise) {
    return (
      <BreathingExerciseScreen
        onBack={() => setShowBreathingExercise(false)}
      />
    );
  }

  if (showMoodTracking) {
    return (
      <MoodTrackingScreen
        onBack={() => setShowMoodTracking(false)}
        interruptedApp={redirectedFrom.appName}
      />
    );
  }

  if (showSimplify) {
    return (
      <SimplifyScreen
        onBack={() => setShowSimplify(false)}
      />
    );
  }

  if (showIntention) {
    return (
      <IntentionScreen
        onBack={() => setShowIntention(false)}
        currentSessionId={currentSessionId}
        interruptedApp={{
          packageName: redirectedFrom.packageName,
          appName: redirectedFrom.appName,
        }}
      />
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Wellbeing Break
        </Text>
        
        <Text style={[styles.message, isDarkMode && styles.darkText]}>
          We noticed you were about to open{' '}
          <Text style={styles.highlight}>{redirectedFrom.appName}</Text>.
        </Text>
        
        <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>
          Take a moment for yourself instead:
        </Text>

        <View style={styles.activitiesContainer}>
          <TouchableOpacity 
            style={styles.activityButton}
            onPress={() => handleActivityPress('Deep Breathing')}
          >
            <Text style={styles.activityText}>Deep Breathing</Text>
            <Text style={styles.activityDescription}>
              Take 3 deep breaths to center yourself
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityButton}
            onPress={() => handleActivityPress('Set Intention')}
          >
            <Text style={styles.activityText}>Set Intention</Text>
            <Text style={styles.activityDescription}>
              set a maximum time for this app, and write down your intentions with this time.
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityButton}
            onPress={() => handleActivityPress('Tracking your mood')}
          >
            <Text style={styles.activityText}>Track Mood</Text>
            <Text style={styles.activityDescription}>
              Understand your mood and how it changes over time
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activityButton}
            onPress={() => handleActivityPress('Simplify')}
          >
            <Text style={styles.activityText}>Simplify</Text>
            <Text style={styles.activityDescription}>
              review and declutter your social media apps
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.returnButton]} 
            onPress={handleReturnToApp}
          >
            <Text style={styles.buttonText}>
              Return to {redirectedFrom.appName}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.stayButton]} 
            onPress={onStayHere}
          >
            <Text style={styles.buttonText}>Stay Here</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  darkText: {
    color: '#333',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
    lineHeight: 24,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#666666',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#888',
  },
  activitiesContainer: {
    width: '100%',
    marginBottom: 40,
  },
  activityButton: {
    backgroundColor: '#999999',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  activityDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  returnButton: {
    backgroundColor: '#666666',
  },
  stayButton: {
    backgroundColor: '#999999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 