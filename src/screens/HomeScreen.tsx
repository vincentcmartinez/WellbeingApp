import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { AppDetectionService, AppInfo } from '../services/AppDetectionService';
import { RedirectScreen } from '../components/RedirectScreen';

interface HomeScreenProps {
  hasPermission: boolean;
  hasOverlayPermission: boolean;
  isBatteryOptimized: boolean;
  isMonitoring: boolean;
  permissionChecks: {
    usage: boolean;
    overlay: boolean;
    battery: boolean;
  };
  onStartMonitoring: () => Promise<void>;
  onStopMonitoring: () => Promise<void>;
  onRequestPermissions: () => Promise<void>;
  onCheckPermissions: () => Promise<void>;
  onNavigateToActivity: (activity: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  hasPermission,
  hasOverlayPermission,
  isBatteryOptimized,
  isMonitoring,
  permissionChecks,
  onStartMonitoring,
  onStopMonitoring,
  onRequestPermissions,
  onCheckPermissions,
  onNavigateToActivity,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [redirectedFrom, setRedirectedFrom] = useState<AppInfo | null>(null);
  const [showRedirectScreen, setShowRedirectScreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    AppDetectionService.getRedirectedApp().then(storedApp => {
      if (storedApp) {
        setRedirectedFrom(storedApp);
        setShowRedirectScreen(true);
      }
    });
  }, []);

  const handleReturnToApp = async () => {
    setShowRedirectScreen(false);
    setRedirectedFrom(null);
    await AppDetectionService.clearRedirectedApp();
  };

  const handleStayHere = async () => {
    setShowRedirectScreen(false);
    setRedirectedFrom(null);
    await AppDetectionService.clearRedirectedApp();
  };

  const handleActivityPress = (activity: string) => {
    onNavigateToActivity(activity);
  };

  if (showRedirectScreen && redirectedFrom) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RedirectScreen
          redirectedFrom={redirectedFrom}
          currentSessionId={currentSessionId}
          onReturnToApp={handleReturnToApp}
          onStayHere={handleStayHere}
        />
      </SafeAreaView>
    );
  }

  if (!hasPermission || !hasOverlayPermission) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.mainContainer}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>Wellbeing App</Text>
          <View style={styles.permissionContainer}>
            <Text style={[styles.message, isDarkMode && styles.darkText]}>
              This app needs several permissions to work properly:
            </Text>
            <View style={styles.permissionsList}>
              <Text style={[styles.permissionItem, isDarkMode && styles.darkText]}>
                Usage Access: {hasPermission ? 'Granted' : 'Required'}
              </Text>
              <Text style={[styles.permissionItem, isDarkMode && styles.darkText]}>
                Display Over Apps: {hasOverlayPermission ? 'Granted' : 'Required'}
              </Text>
              <Text style={[styles.permissionItem, isDarkMode && styles.darkText]}>
                Battery Optimization: {!isBatteryOptimized ? 'Disabled' : 'Recommended'}
              </Text>
            </View>
            <TouchableOpacity style={styles.permissionButton} onPress={onRequestPermissions}>
              <Text style={styles.buttonText}>Grant All Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permissionButton, { marginTop: 10, backgroundColor: '#666' }]}
              onPress={onCheckPermissions}
            >
              <Text style={styles.buttonText}>Check Permissions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header with Date and Monitoring Toggle */}
      <View style={styles.header}>
        <Text style={styles.dateText}>Today</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</Text>

        <View style={styles.monitoringContainer}>
          <Text style={styles.monitoringLabel}>Monitoring</Text>
          <Switch
            value={isMonitoring}
            onValueChange={async (value) => {
              if (value) {
                await onStartMonitoring();
              } else {
                await onStopMonitoring();
              }
            }}
            trackColor={{ false: '#ccc', true: '#8d9dfd' }}
            thumbColor={isMonitoring ? '#ffffff' : '#f4f3f4'}
            ios_backgroundColor="#ccc"
          />
        </View>
      </View>

      {/* 2x2 Card Grid */}
      <View style={styles.cardGrid}>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#e6e6fa' }]}
          onPress={() => handleActivityPress('Deep Breathing')}
        >
          <Image source={require('../../images/Meditation.png')} style={styles.cardIcon} />
          <Text style={styles.cardText}>Deep Breathing</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#f0f9e6' }]}
          onPress={() => handleActivityPress('Set Intention')}
        >
          <Image source={require('../../images/BusinessTime.png')} style={styles.cardIcon} />
          <Text style={styles.cardText}>Set Intention</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#f4ece4' }]}
          onPress={() => handleActivityPress('Tracking your mood')}
        >
          <Image source={require('../../images/Journal.png')} style={styles.cardIcon} />
          <Text style={styles.cardText}>Track Mood</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#e4f6f6' }]}
          onPress={() => handleActivityPress('Simplify')}
        >
          <Image source={require('../../images/Trash.png')} style={styles.cardIcon} />
          <Text style={styles.cardText}>Simplify</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  mainContainer: {
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
    marginBottom: 20,
    color: '#666',
    lineHeight: 24,
  },
  permissionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionsList: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: '100%',
  },
  permissionItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    textAlign: 'left',
  },
  header: {
    backgroundColor: '#aab6f3',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  monitoringContainer: {
    marginTop: 20,
    backgroundColor: '#eaeaff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    width: '100%',
  },
  monitoringLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
cardGrid: {
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingTop: 24,
  gap: 12,
},

card: {
  width: '48%',
  aspectRatio: 0.4,
  borderRadius: 20,
  marginBottom: 16,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
},
  cardIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
