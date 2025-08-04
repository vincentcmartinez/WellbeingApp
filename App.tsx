/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, useColorScheme } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { RedirectScreen } from './src/components/RedirectScreen';
import { AppDetectionService, AppInfo } from './src/services/AppDetectionService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [redirectedFrom, setRedirectedFrom] = useState<AppInfo | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate app detection after 3 seconds (for demo purposes)
    const timer = setTimeout(() => {
      const detectedApp: AppInfo = {
        packageName: 'com.instagram.android',
        appName: 'Instagram',
        timestamp: Date.now(),
      };
      setRedirectedFrom(detectedApp);
      setCurrentSessionId(`session_${Date.now()}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleReturnToApp = () => {
    setRedirectedFrom(null);
    setCurrentSessionId(null);
  };

  const handleStayHere = () => {
    setRedirectedFrom(null);
    setCurrentSessionId(null);
  };

  if (redirectedFrom) {
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
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        Wellbeing App
      </Text>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default App;