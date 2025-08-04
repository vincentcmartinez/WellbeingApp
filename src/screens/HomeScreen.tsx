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
  NativeEventEmitter,
  NativeModules,
  AppState,
} from 'react-native';
import { AppDetectionService, AppInfo } from '../services/AppDetectionService';
import { RedirectScreen } from '../components/RedirectScreen';
import StatisticsService from '../services/StatisticsService';

const { AppDetectionModule, IntentionTimerModule } = NativeModules;

export const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [redirectedFrom, setRedirectedFrom] = useState<AppInfo | null>(null);
  const [showRedirectScreen, setShowRedirectScreen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastEventTime, setLastEventTime] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [permissionChecks, setPermissionChecks] = useState({
    usage: false,
    overlay: false,
    battery: false,
  });

  useEffect(() => {
    checkAllPermissions();
    setupEventListeners();
    setupAppStateListener();
    
    // Check for stored redirect info on app start
    AppDetectionService.getRedirectedApp().then(storedApp => {
      if (storedApp) {
        console.log('Found stored redirected app:', storedApp);
        setRedirectedFrom(storedApp);
        setShowRedirectScreen(true);
      }
    });

    return () => {
      // Cleanup will be handled by the effect cleanup functions
    };
  }, []);

  useEffect(() => {
    checkAllPermissions();
  }, [permissionChecks]);

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed from', appState, 'to', nextAppState);
      setAppState(nextAppState);
    };

    AppState.addEventListener('change', handleAppStateChange);
    return () => AppState.removeEventListener('change', handleAppStateChange);
  };

  const checkAllPermissions = async () => {
    try {
      const [usage, overlay, battery] = await Promise.all([
        AppDetectionModule.hasUsageStatsPermission(),
        AppDetectionModule.hasOverlayPermission(), 
        AppDetectionModule.isBatteryOptimizationDisabled()
      ]);

      setHasPermission(usage);
      setHasOverlayPermission(overlay);
      setIsBatteryOptimized(battery);

      setPermissionChecks({
        usage,
        overlay,
        battery: !battery // inverted because we want "not optimized"
      });

      console.log('Permission status:', { usage, overlay, battery: !battery });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const setupEventListeners = () => {
    const eventEmitter = new NativeEventEmitter(AppDetectionModule);
    
    const subscription = eventEmitter.addListener(
      'onSocialMediaAppDetected',
      (data: string) => {
        try {
          const appData = JSON.parse(data);
          const appInfo: AppInfo = {
            packageName: appData.packageName,
            appName: appData.appName,
            timestamp: Date.now(),
          };
          
          // Track interruption and get session ID for further tracking
          StatisticsService.trackInterruption(appInfo.appName, appInfo.packageName)
            .then(sessionId => {
              setCurrentSessionId(sessionId);
              console.log(`📊 Started tracking session: ${sessionId}`);
            })
            .catch(error => console.error('Error tracking interruption:', error));
          
          setRedirectedFrom(appInfo);
          setShowRedirectScreen(true);
          setLastEventTime(new Date().toLocaleTimeString());
          AppDetectionService.storeRedirectedApp(appInfo);
          // Social media app detected - redirect screen will be shown automatically
          console.log(`Social media app detected: ${appInfo.appName}, redirect screen shown`);
        } catch (error) {
          console.error('Error parsing app detection data:', error);
        }
      }
    );

    return () => subscription.remove();
  };

  const startAppDetection = async () => {
    try {
      console.log('Starting app detection...');
      await AppDetectionModule.startAppDetection();
      setIsMonitoring(true);
      console.log('App detection started successfully');
    } catch (error) {
      console.error('Error starting app detection:', error);
      setIsMonitoring(false);
      if (error === 'PERMISSION_DENIED') {
        Alert.alert(
          'Permissions Required',
          'This app needs usage access and display overlay permissions to work properly. Please grant all permissions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Grant Permissions', 
              onPress: requestAllPermissions 
            }
          ]
        );
      }
    }
  };

  const stopAppDetection = async () => {
    try {
      console.log('Stopping app detection...');
      await AppDetectionModule.stopAppDetection();
      setIsMonitoring(false);
      console.log('App detection stopped successfully');
    } catch (error) {
      console.error('Error stopping app detection:', error);
    }
  };

  const requestAllPermissions = async () => {
    try {
      console.log('Requesting all permissions...');
      
      // Request usage stats permission
      await AppDetectionModule.requestUsageStatsPermission();
      
      // Request overlay permission  
      await AppDetectionModule.requestOverlayPermission();
      
      // Request battery optimization disable
      await AppDetectionModule.requestDisableBatteryOptimization();
      
      // Update permission states
      await checkAllPermissions();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleReturnToApp = async () => {
    if (!redirectedFrom) {
      console.error('No redirected app found');
      return;
    }
    
    try {
      console.log(`Launching ${redirectedFrom.appName} (${redirectedFrom.packageName})`);
      
      // Track that user chose to return to app without doing any activity
      if (currentSessionId) {
        await StatisticsService.trackActivityChoice(currentSessionId, 'returnToApp');
      }
      
      // Launch the app using IntentionTimerModule
      await IntentionTimerModule.launchApp(redirectedFrom.packageName);
      
      console.log(`Successfully launched ${redirectedFrom.appName}`);
      
      // Dismiss the redirect screen
      setShowRedirectScreen(false);
      setRedirectedFrom(null);
      setCurrentSessionId(null);
      await AppDetectionService.clearRedirectedApp();
      
    } catch (error) {
      console.error('Error launching app:', error);
      Alert.alert(
        'Launch Failed',
        `Unable to launch ${redirectedFrom.appName}. ${error}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Still dismiss the screen even if launch failed
              setShowRedirectScreen(false);
              setRedirectedFrom(null);
              setCurrentSessionId(null);
              AppDetectionService.clearRedirectedApp();
            }
          }
        ]
      );
    }
  };

  const handleStayHere = async () => {
    setShowRedirectScreen(false);
    setRedirectedFrom(null);
    setCurrentSessionId(null);
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

  const allPermissionsGranted = hasPermission && hasOverlayPermission && !isBatteryOptimized;

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.mainContainer}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Digital Wellbeing
        </Text>
        
        {!allPermissionsGranted ? (
          <View style={styles.permissionContainer}>
            <Text style={[styles.message, isDarkMode && styles.darkText]}>
              To protect your digital wellbeing, this app needs some permissions to monitor your app usage and show helpful reminders.
            </Text>
            
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={requestAllPermissions}
            >
              <Text style={styles.buttonText}>Grant All Permissions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.permissionButton, { marginTop: 10, backgroundColor: '#666' }]}
              onPress={checkAllPermissions}
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
                onPress={startAppDetection}
              >
                <Text style={styles.buttonText}>Start Monitoring</Text>
              </TouchableOpacity>
            )}
            
            {isMonitoring && (
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: '#cccccc' }]}
                onPress={stopAppDetection}
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
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
});