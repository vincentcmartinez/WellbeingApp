import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MoodTrackingScreenProps {
  onBack: () => void;
  interruptedApp?: string;
}

interface MoodEntry {
  id: string;
  timestamp: number;
  mood: string;
  reasoning: string;
  interruptedApp?: string;
}

const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', emoji: '😊', color: '#4CAF50' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#2196F3' },
  { value: 'content', label: 'Content', emoji: '😌', color: '#8BC34A' },
  { value: 'bored', label: 'Bored', emoji: '😐', color: '#9E9E9E' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: '#FF9800' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#607D8B' },
];

export const MoodTrackingScreen: React.FC<MoodTrackingScreenProps> = ({
  onBack,
  interruptedApp,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMoodEntries();
  }, []);

  const loadMoodEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('moodEntries');
      if (storedEntries) {
        setMoodEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    }
  };

  const saveMoodEntry = async () => {
    if (!selectedMood.trim()) {
      Alert.alert('Please select a mood', 'Choose how you are feeling today.');
      return;
    }

    if (!reasoning.trim()) {
      Alert.alert('Please add reasoning', 'Tell us why you feel this way.');
      return;
    }

    setIsLoading(true);
    try {
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        mood: selectedMood,
        reasoning: reasoning.trim(),
        interruptedApp: interruptedApp,
      };

      const updatedEntries = [newEntry, ...moodEntries];
      await AsyncStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
      setMoodEntries(updatedEntries);
      
      // Reset form
      setSelectedMood('');
      setReasoning('');
      
      Alert.alert(
        'Mood Saved!',
        'Thank you for sharing how you feel. This helps you track your emotional wellbeing.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving mood entry:', error);
      Alert.alert('Error', 'Failed to save your mood entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodOption = MOOD_OPTIONS.find(option => option.value === mood);
    return moodOption?.emoji || '😐';
  };

  const getMoodLabel = (mood: string) => {
    const moodOption = MOOD_OPTIONS.find(option => option.value === mood);
    return moodOption?.label || mood;
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, isDarkMode && styles.darkText]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Track Your Mood
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {interruptedApp && (
          <View style={styles.interruptedAppContainer}>
            <Text style={[styles.interruptedAppText, isDarkMode && styles.darkText]}>
              You were about to open: <Text style={styles.appName}>{interruptedApp}</Text>
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            How are you feeling right now?
          </Text>
          
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  selectedMood === mood.value && styles.selectedMoodOption,
                  { borderColor: mood.color },
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.value && styles.selectedMoodLabel,
                  isDarkMode && styles.darkText
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Why do you feel this way?
          </Text>
          <TextInput
            style={[
              styles.reasoningInput,
              isDarkMode && styles.darkReasoningInput,
            ]}
            placeholder="Tell us more about your mood..."
            placeholderTextColor={isDarkMode ? '#888' : '#999'}
            value={reasoning}
            onChangeText={setReasoning}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!selectedMood || !reasoning.trim() || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={saveMoodEntry}
          disabled={!selectedMood || !reasoning.trim() || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Mood Entry'}
          </Text>
        </TouchableOpacity>

        {moodEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Recent Mood Entries
            </Text>
            {moodEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={[styles.entryCard, isDarkMode && styles.darkEntryCard]}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryMood}>
                    {getMoodEmoji(entry.mood)} {getMoodLabel(entry.mood)}
                  </Text>
                  <Text style={[styles.entryDate, isDarkMode && styles.darkText]}>
                    {formatDate(entry.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.entryReasoning, isDarkMode && styles.darkText]}>
                  {entry.reasoning}
                </Text>
                {entry.interruptedApp && (
                  <Text style={[styles.entryApp, isDarkMode && styles.darkText]}>
                    Interrupted: {entry.interruptedApp}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  darkText: {
    color: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#333333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  interruptedAppContainer: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  interruptedAppText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  appName: {
    fontWeight: 'bold',
    color: '#333333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333333',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  selectedMoodOption: {
    backgroundColor: '#f0f8ff',
    borderWidth: 3,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  selectedMoodLabel: {
    fontWeight: 'bold',
  },
  reasoningInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333333',
    minHeight: 100,
  },
  darkReasoningInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d0d0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  darkEntryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d0d0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryMood: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  entryDate: {
    fontSize: 12,
    color: '#666666',
  },
  entryReasoning: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 5,
  },
  entryApp: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
}); 