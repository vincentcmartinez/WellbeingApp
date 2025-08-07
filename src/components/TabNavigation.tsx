import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Image } from 'react-native';

interface TabNavigationProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabPress }) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[styles.tabBar, { backgroundColor: isDarkMode ? '#f5f5f5' : '#ffffff' }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'home' && styles.activeTab,
          { borderTopColor: isDarkMode ? '#e0e0e0' : '#e0e0e0' }
        ]}
        onPress={() => onTabPress('home')}
      >
        <Image 
          source={require('../../images/Home.png')} 
          style={[styles.tabIcon, { tintColor: activeTab === 'home' ? '#007AFF' : '#CCCCCC' }]} 
        />
        {activeTab === 'home' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'metrics' && styles.activeTab,
          { borderTopColor: isDarkMode ? '#e0e0e0' : '#e0e0e0' }
        ]}
        onPress={() => onTabPress('metrics')}
      >
        <Image 
          source={require('../../images/PositiveDynamic.png')} 
          style={[styles.tabIcon, { tintColor: activeTab === 'metrics' ? '#007AFF' : '#CCCCCC' }]} 
        />
        {activeTab === 'metrics' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'settings' && styles.activeTab,
          { borderTopColor: isDarkMode ? '#e0e0e0' : '#e0e0e0' }
        ]}
        onPress={() => onTabPress('settings')}
      >
        <Image 
          source={require('../../images/Settings.png')} 
          style={[styles.tabIcon, { tintColor: activeTab === 'settings' ? '#007AFF' : '#CCCCCC' }]} 
        />
        {activeTab === 'settings' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
}); 