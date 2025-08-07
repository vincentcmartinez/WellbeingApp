/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, useColorScheme, Alert, NativeEventEmitter, NativeModules, AppState } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { MetricsScreen } from './src/screens/MetricsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RedirectScreen } from './src/components/RedirectScreen';
import { TabNavigation } from './src/components/TabNavigation';
import { BreathingExerciseScreen } from './src/components/BreathingExerciseScreen';
import { IntentionScreen } from './src/components/IntentionScreen';
import { MoodTrackingScreen } from './src/components/MoodTrackingScreen';
import { SimplifyScreen } from './src/components/SimplifyScreen';
import { AppDetectionService, AppInfo } from './src/services/AppDetectionService';

const { AppDetectionModule, IntentionTimerModule } = NativeModules;

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [redirectedFrom, setRedirectedFrom] = useState<AppInfo | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentActivity, setCurrentActivity] = useState<string | null>(null);
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
    
    // Check for stored redirect info on app start
    AppDetectionService.getRedirectedApp().then(storedApp => {
      if (storedApp) {
        console.log('Found stored redirected app:', storedApp);
        setRedirectedFrom(storedApp);
        setShowRedirectScreen(true);
      }
    });

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
    if (!redirectedFrom) {
      console.error('No redirected app found');
      return;
    }
    
    try {
      console.log(`Launching ${redirectedFrom.appName} (${redirectedFrom.packageName})`);
      
      // Launch the app using IntentionTimerModule
      await IntentionTimerModule.launchApp(redirectedFrom.packageName);
      
      console.log(`Successfully launched ${redirectedFrom.appName}`);
      
      // Dismiss the redirect screen
      setShowRedirectScreen(false);
      setRedirectedFrom(null);
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
    await AppDetectionService.clearRedirectedApp();
  };

  const handleTabPress = (tabName: string) => {
    setActiveTab(tabName);
    setCurrentActivity(null); // Clear activity when switching tabs
  };

  const handleNavigateToActivity = (activity: string) => {
    setCurrentActivity(activity);
  };

  if (showRedirectScreen && redirectedFrom) {
    return (
      <RedirectScreen
        redirectedFrom={redirectedFrom}
        currentSessionId={currentSessionId}
        onReturnToApp={handleReturnToApp}
        onStayHere={handleStayHere}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      {activeTab === 'home' && !currentActivity && (
        <HomeScreen 
          hasPermission={hasPermission}
          hasOverlayPermission={hasOverlayPermission}
          isBatteryOptimized={isBatteryOptimized}
          isMonitoring={isMonitoring}
          permissionChecks={permissionChecks}
          onStartMonitoring={startAppDetection}
          onStopMonitoring={stopAppDetection}
          onRequestPermissions={requestAllPermissions}
          onCheckPermissions={checkAllPermissions}
          onNavigateToActivity={handleNavigateToActivity}
        />
      )}
      {activeTab === 'home' && currentActivity === 'Deep Breathing' && (
        <BreathingExerciseScreen onBack={() => setCurrentActivity(null)} />
      )}
      {activeTab === 'home' && currentActivity === 'Set Intention' && (
        <IntentionScreen 
          onBack={() => setCurrentActivity(null)}
          interruptedApp={{ packageName: '', appName: 'Focus Session' }}
          currentSessionId={currentSessionId}
        />
      )}
      {activeTab === 'home' && currentActivity === 'Tracking your mood' && (
        <MoodTrackingScreen onBack={() => setCurrentActivity(null)} />
      )}
      {activeTab === 'home' && currentActivity === 'Simplify' && (
        <SimplifyScreen onBack={() => setCurrentActivity(null)} />
      )}
      {activeTab === 'metrics' && <MetricsScreen />}
      {activeTab === 'settings' && <SettingsScreen />}
      <TabNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;