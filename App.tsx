/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

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
import { AppDetectionService, AppInfo } from './src/services/AppDetectionService';
import { RedirectScreen } from './src/components/RedirectScreen';

const { AppDetectionModule } = NativeModules;

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [redirectedFrom, setRedirectedFrom] = useState<AppInfo | null>(null);
  const [showRedirectScreen, setShowRedirectScreen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastEventTime, setLastEventTime] = useState<string>('');
  const [permissionChecks, setPermissionChecks] = useState({
    usage: false,
    overlay: false,
    battery: false,
  });

  useEffect(() => {
    checkAllPermissions();
    setupEventListeners();
    setupAppStateListener();
    
    return () => {
      // Cleanup event listeners
      if (isMonitoring) {
        stopAppDetection();
      }
    };
  }, []);

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('App state changed from', appState, 'to', nextAppState);
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('App came to foreground, checking for stored redirect...');
        checkForStoredRedirect();
      } else if (nextAppState === 'active') {
        console.log('App is now active, checking for stored redirect...');
        checkForStoredRedirect();
      }
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  };

  const checkForStoredRedirect = async () => {
    try {
      console.log('Checking for stored redirect...');
      const storedApp = await AppDetectionService.getRedirectedApp();
      console.log('Stored app data:', storedApp);
      if (storedApp) {
        // Check if the redirect happened recently (within last 30 seconds)
        const timeDiff = Date.now() - storedApp.timestamp;
        console.log('Time difference since redirect:', timeDiff, 'ms');
        if (timeDiff < 30000) { // 30 seconds
          console.log('Showing redirect screen for recent redirect');
          setRedirectedFrom(storedApp);
          setShowRedirectScreen(true);
          
          // Redirect screen will be shown automatically
        } else {
          console.log('Redirect too old, clearing data');
          // Clear old redirect data
          await AppDetectionService.clearRedirectedApp();
        }
      } else {
        console.log('No stored redirect data found');
      }
    } catch (error) {
      console.error('Error checking for stored redirect:', error);
    }
  };

  const checkAllPermissions = async () => {
    try {
      console.log('Checking all permissions...');
      
      // Check usage stats permission
      const hasUsagePermission = await AppDetectionModule.hasUsageStatsPermission();
      console.log('Usage permission result:', hasUsagePermission);
      setHasPermission(hasUsagePermission);
      
      // Check overlay permission
      const hasOverlay = await AppDetectionModule.hasOverlayPermission();
      console.log('Overlay permission result:', hasOverlay);
      setHasOverlayPermission(hasOverlay);
      
      // Check battery optimization
      const batteryOptimized = !(await AppDetectionModule.isBatteryOptimizationDisabled());
      console.log('Battery optimized:', batteryOptimized);
      setIsBatteryOptimized(batteryOptimized);
      
      setPermissionChecks({
        usage: hasUsagePermission,
        overlay: hasOverlay,
        battery: !batteryOptimized,
      });
      
      if (hasUsagePermission && hasOverlay) {
        console.log('All critical permissions granted, starting app detection...');
        startAppDetection();
      } else {
        console.log('Some permissions not granted');
        setIsMonitoring(false);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
      setHasOverlayPermission(false);
      setIsBatteryOptimized(true);
      setIsMonitoring(false);
    }
  };
  
  const checkPermission = async () => {
    // Backwards compatibility function
    await checkAllPermissions();
  };

  const setupEventListeners = () => {
    const eventEmitter = new NativeEventEmitter(AppDetectionModule);
    
    const subscription = eventEmitter.addListener(
      'onSocialMediaAppDetected',
      (data: string) => {
        try {
          console.log('Received social media app detection event:', data);
          const appData = JSON.parse(data);
          const appInfo: AppInfo = {
            packageName: appData.packageName,
            appName: appData.appName,
            timestamp: Date.now(),
          };
          
          console.log('Parsed app info:', appInfo);
          console.log('Setting redirect screen to visible at:', new Date().toISOString());
          setRedirectedFrom(appInfo);
          setShowRedirectScreen(true);
          setLastEventTime(new Date().toLocaleTimeString());
          AppDetectionService.storeRedirectedApp(appInfo);
          console.log('Redirect screen should now be visible');
          
          // Only show alert if app is in foreground
          if (appState === 'active') {
            Alert.alert(
              'Social Media Detected!',
              `${appInfo.appName} was detected! Redirect screen should be visible.`,
              [{ text: 'OK' }]
            );
          } else {
            console.log('App is in background, alert will be shown when app comes to foreground');
          }
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
      await AppDetectionModule.stopAppDetection();
      setIsMonitoring(false);
      console.log('App detection stopped');
    } catch (error) {
      console.error('Error stopping app detection:', error);
    }
  };

  const requestPermission = async () => {
    // Backwards compatibility function
    await requestAllPermissions();
  };

  const requestAllPermissions = async () => {
    try {
      if (!hasPermission) {
        await AppDetectionModule.requestUsageStatsPermission();
      }
      
      if (!hasOverlayPermission) {
        await AppDetectionModule.requestOverlayPermission();
      }
      
      if (isBatteryOptimized) {
        await AppDetectionModule.requestDisableBatteryOptimization();
      }
      
      // Permission requests will open settings, user needs to return to app
      Alert.alert(
        'Permissions Setup',
        'Please grant the following permissions in settings:\n\n' +
        (!hasPermission ? '• Usage Access\n' : '') +
        (!hasOverlayPermission ? '• Display over other apps\n' : '') +
        (isBatteryOptimized ? '• Disable battery optimization\n' : '') +
        '\nThen return here and tap "Check Permissions".',
        [
          { text: 'OK' },
          { 
            text: 'Check Permissions', 
            onPress: checkAllPermissions 
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

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
}

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
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#333',
  },
});

export default App;
