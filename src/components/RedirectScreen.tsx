import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { AppInfo } from '../services/AppDetectionService';

interface RedirectScreenProps {
  redirectedFrom: AppInfo;
  onReturnToApp: () => void;
  onStayHere: () => void;
}

export const RedirectScreen: React.FC<RedirectScreenProps> = ({
  redirectedFrom,
  onReturnToApp,
  onStayHere,
}) => {
  const isDarkMode = useColorScheme() === 'dark';

  const handleReturnToApp = () => {
    Alert.alert(
      'Return to App',
      `Returning to ${redirectedFrom.appName}...`,
      [
        {
          text: 'OK',
          onPress: onReturnToApp,
        },
      ]
    );
  };

  const handleActivityPress = (activityName: string) => {
    Alert.alert(
      'Activity Selected',
      `Great choice! ${activityName} is a wonderful way to take care of yourself.`,
      [
        {
          text: 'Continue',
        },
      ]
    );
  };

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
            onPress={() => handleActivityPress('Setting Intentions')}
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
            onPress={() => handleActivityPress('Getting outside')}
          >
            <Text style={styles.activityText}>Take a Walk</Text>
            <Text style={styles.activityDescription}>
              get some fresh air and movement
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