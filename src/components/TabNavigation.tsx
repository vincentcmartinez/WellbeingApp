import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';

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
        <Text style={[styles.tabIcon, { color: activeTab === 'home' ? '#999999' : '#cccccc' }]}>
          🏠
        </Text>
        <Text style={[styles.tabLabel, { color: activeTab === 'home' ? '#999999' : '#cccccc' }]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'metrics' && styles.activeTab,
          { borderTopColor: isDarkMode ? '#e0e0e0' : '#e0e0e0' }
        ]}
        onPress={() => onTabPress('metrics')}
      >
        <Text style={[styles.tabIcon, { color: activeTab === 'metrics' ? '#999999' : '#cccccc' }]}>
          📊
        </Text>
        <Text style={[styles.tabLabel, { color: activeTab === 'metrics' ? '#999999' : '#cccccc' }]}>
          Metrics
        </Text>
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
  },
  activeTab: {
    // Active tab styling
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 