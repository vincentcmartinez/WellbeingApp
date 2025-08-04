import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AppDetectionService, AppInfo } from '../services/AppDetectionService';
import { RedirectScreen } from '../components/RedirectScreen';
import StatisticsService from '../services/StatisticsService';

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
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [redirectedFrom, setRedirectedFrom] = useState<AppInfo | null>(null);
  const [showRedirectScreen, setShowRedirectScreen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored redirect info on app start
    AppDetectionService.getRedirectedApp().then(storedApp => {
      if (storedApp) {
        console.log('Found stored redirected app:', storedApp);
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

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.mainContainer}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Wellbeing App
        </Text>
        
        {(!hasPermission || !hasOverlayPermission) ? (
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
            
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={onRequestPermissions}
            >
              <Text style={styles.buttonText}>Grant All Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.permissionButton, { marginTop: 10, backgroundColor: '#666' }]}
              onPress={onCheckPermissions}
            >
              <Text style={styles.buttonText}>Check Permissions</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.message, isDarkMode && styles.darkText]}>
              {isMonitoring 
                ? "Monitoring for social media apps. Try opening Instagram to test the improved foreground detection!"
                : "All permissions granted! Ready to start monitoring."
              }
            </Text>
            
            {!isMonitoring && (
              <TouchableOpacity 
                style={styles.startButton}
                onPress={onStartMonitoring}
              >
                <Text style={styles.buttonText}>Start Monitoring</Text>
              </TouchableOpacity>
            )}
            
            {isMonitoring && (
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: '#cccccc' }]}
                onPress={onStopMonitoring}
              >
                <Text style={styles.buttonText}>Stop Monitoring</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.infoContainer}>
              <Text style={[styles.infoTitle, isDarkMode && styles.darkText]}>
                Monitored Apps:
              </Text>
              {AppDetectionService.getAllSocialMediaApps().map((app, index) => (
                <Text key={index} style={[styles.infoText, isDarkMode && styles.darkText]}>
                  • {app.displayName}
                </Text>
              ))}
            </View>
          </>
        )}
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
  startButton: {
    backgroundColor: '#999999',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    width: '100%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    textAlign: 'center',
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
});