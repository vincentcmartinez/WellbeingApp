import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';

interface BreathingExerciseScreenProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');

export const BreathingExerciseScreen: React.FC<BreathingExerciseScreenProps> = ({
  onBack,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isBreathing, setIsBreathing] = useState(false);
  const [isInhaling, setIsInhaling] = useState(true);
  const [breathCount, setBreathCount] = useState(0);
  const [instruction, setInstruction] = useState('Hold the button and breathe in...');
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const BREATH_DURATION = 3000; // 3 seconds

  const startBreathingCycle = () => {
    setIsBreathing(true);
    setIsInhaling(true);
    setInstruction('Breathe in...');
    
    // Animate progress bar filling up (inhale)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: BREATH_DURATION,
      useNativeDriver: false,
    }).start(() => {
      // Switch to exhale
      setIsInhaling(false);
      setInstruction('Now breathe out...');
      
      // Animate progress bar emptying (exhale)
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: BREATH_DURATION,
        useNativeDriver: false,
      }).start(() => {
        // Complete breath cycle
        setBreathCount(prev => prev + 1);
        setIsBreathing(false);
        setIsInhaling(true);
        setInstruction('Hold the button and breathe in...');
      });
    });
  };

  const handleButtonPress = () => {
    if (!isBreathing) {
      startBreathingCycle();
    }
  };

  const handleButtonPressIn = () => {
    if (!isBreathing) {
      Animated.spring(buttonScaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const resetExercise = () => {
    setBreathCount(0);
    setIsBreathing(false);
    setIsInhaling(true);
    setInstruction('Hold the button and breathe in...');
    progressAnim.setValue(0);
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
          Deep Breathing
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.instruction, isDarkMode && styles.darkText]}>
          {instruction}
        </Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, isDarkMode && styles.darkProgressBar]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: isInhaling ? '#4CAF50' : '#FF9800',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.breathingButton,
                isBreathing && styles.breathingButtonActive,
                isInhaling && isBreathing && styles.inhaleButton,
                !isInhaling && isBreathing && styles.exhaleButton,
              ]}
              onPress={handleButtonPress}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={isBreathing}
            >
              <Text style={styles.breathingButtonText}>
                {isBreathing ? (isInhaling ? 'Breathe In' : 'Breathe Out') : 'Start Breathing'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, isDarkMode && styles.darkText]}>
            Breaths completed: {breathCount}
          </Text>
        </View>

        {breathCount > 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={resetExercise}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#aab6f3', // header color from HomeScreen
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  darkText: {
    color: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instruction: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666666',
    fontWeight: '500',
  },
  progressContainer: {
    width: width * 0.8,
    marginBottom: 60,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#e0e0f0', // lighter lavender
    borderRadius: 10,
    overflow: 'hidden',
  },
  darkProgressBar: {
    backgroundColor: '#d0d0d0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  breathingButton: {
    backgroundColor: '#e6e6fa', // match pastel card background
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  breathingButtonActive: {
    backgroundColor: '#d1c4f6', // slightly darker lavender
  },
  inhaleButton: {
    backgroundColor: '#c8e6c9', // light green
  },
  exhaleButton: {
    backgroundColor: '#ffe0b2', // soft orange
  },
  breathingButtonText: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#666666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
