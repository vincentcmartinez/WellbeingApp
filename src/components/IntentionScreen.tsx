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
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  Modal,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatisticsService from '../services/StatisticsService';

interface IntentionScreenProps {
  onBack: () => void;
  currentSessionId: string | null;
  interruptedApp: {
    packageName: string;
    appName: string;
  };
}

interface IntentionData {
  timestamp: number;
  packageName: string;
  appName: string;
  maxTimeMinutes: number;
  intention: string;
  startTime: number;
  totalUseTime?: number;
  intentionFulfilled?: boolean;
  keptUsingAfterPopup?: boolean;
  reflection?: string;
}

const { width } = Dimensions.get('window');

const timeOptions = [
  { value: 0.25, label: '15 sec', isSeconds: true },
  { value: 5, label: '5 min', isSeconds: false },
  { value: 10, label: '10 min', isSeconds: false },
  { value: 15, label: '15 min', isSeconds: false },
  { value: 20, label: '20 min', isSeconds: false },
  { value: 30, label: '30 min', isSeconds: false },
  { value: 45, label: '45 min', isSeconds: false },
  { value: 60, label: '60 min', isSeconds: false },
];

export const IntentionScreen: React.FC<IntentionScreenProps> = ({
  onBack,
  currentSessionId,
  interruptedApp,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedTimeOption, setSelectedTimeOption] = useState(timeOptions[3]); // Default to 15 min
  const [intention, setIntention] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [reflection, setReflection] = useState('');
  const [fulfillmentAnswer, setFulfillmentAnswer] = useState<boolean | null>(null);
  
  // Native module for timer service
  const { IntentionTimerModule } = NativeModules;
  const eventEmitter = new NativeEventEmitter(IntentionTimerModule);

  useEffect(() => {
    // Listen for timer completion events from native service
    const subscription = eventEmitter.addListener('onIntentionTimerComplete', (data) => {
      try {
        console.log('Timer completion event received:', data);
        const timerData = JSON.parse(data);
        if (timerData.packageName === interruptedApp.packageName) {
          console.log('Timer completed for current app, showing dialog');
          handleTimeUp();
        }
      } catch (error) {
        console.error('Error parsing timer complete event:', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [interruptedApp.packageName]);

  const handleStartIntention = async () => {
    if (!intention.trim()) {
      Alert.alert('Intention Required', 'Please enter your intention before starting.');
      return;
    }

    const maxTimeSeconds = selectedTimeOption.isSeconds 
      ? Math.floor(selectedTimeOption.value * 60) 
      : selectedTimeOption.value * 60;

    const intentionData: IntentionData = {
      timestamp: Date.now(),
      packageName: interruptedApp.packageName,
      appName: interruptedApp.appName,
      maxTimeMinutes: selectedTimeOption.isSeconds ? selectedTimeOption.value : selectedTimeOption.value,
      intention: intention.trim(),
      startTime: Date.now(),
    };

    try {
      // Save intention data
      await AsyncStorage.setItem('currentIntention', JSON.stringify(intentionData));
      setStartTime(Date.now());
      setTimeRemaining(maxTimeSeconds);
      setIsActive(true);
      
      // Track intention creation in statistics
      if (currentSessionId) {
        try {
          await StatisticsService.trackIntentionSet(currentSessionId);
          console.log('📊 Tracked intention set for statistics');
        } catch (error) {
          console.error('Error tracking intention in statistics:', error);
        }
      }
      
      // Start native timer service
      await IntentionTimerModule.startIntentionTimer(
        interruptedApp.packageName,
        interruptedApp.appName,
        maxTimeSeconds,
        intention.trim()
      );
      
      // Show success message and give time for app to launch
      Alert.alert(
        'Session Started! ⏰',
        `Your ${selectedTimeOption.isSeconds ? '15-second' : `${selectedTimeOption.value}-minute`} mindful session for ${interruptedApp.appName} has begun.\n\nThe timer will run in the background and you'll get an alert when time is up.`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Timer started successfully, target app should be launching...');
              // The native service should have already launched the target app
              // User can stay on this screen or navigate away
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error starting intention:', error);
      Alert.alert('Error', 'Failed to start intention session. Please try again.');
    }
  };

  const handleTimeUp = async () => {
    setIsActive(false);
    
    // Cancel the native timer
    try {
      await IntentionTimerModule.cancelIntentionTimer();
    } catch (error) {
      console.error('Error cancelling timer:', error);
    }
    
    // Reset dialog state
    setFulfillmentAnswer(null);
    setReflection('');
    setShowCompletionDialog(true);
  };

  const handleFulfillmentAnswer = (fulfilled: boolean) => {
    console.log('Setting fulfillment answer:', fulfilled);
    setFulfillmentAnswer(fulfilled);
  };

  const handleIntentionComplete = async (action: 'home' | 'back_to_app') => {
    if (fulfillmentAnswer === null) {
      Alert.alert('Please Answer', 'Please let us know if you fulfilled your intention before continuing.');
      return;
    }

    try {
      const keptUsing = action === 'back_to_app';
      const hasReflection = reflection.trim().length > 0;
      
      // Track intention fulfillment and post-timer behavior in statistics
      if (currentSessionId) {
        try {
          await StatisticsService.trackIntentionFulfillment(
            currentSessionId, 
            fulfillmentAnswer, 
            hasReflection
          );
          await StatisticsService.trackPostTimerBehavior(
            currentSessionId, 
            keptUsing
          );
          console.log(`📊 Tracked intention fulfillment: ${fulfillmentAnswer}, returned to app: ${keptUsing}`);
        } catch (error) {
          console.error('Error tracking intention completion in statistics:', error);
        }
      }
      
      await saveIntentionData(fulfillmentAnswer, keptUsing, reflection);
      
      // Close the completion dialog first
      setShowCompletionDialog(false);
      setReflection('');
      setFulfillmentAnswer(null);
      
      // Handle the action
      if (action === 'back_to_app') {
        // Launch the target app
        await launchTargetApp();
      } else {
        // Go to home screen
        onBack();
      }
    } catch (error) {
      console.error('Error saving intention data:', error);
      Alert.alert('Error', 'Failed to save intention data.');
    }
  };

  const launchTargetApp = async () => {
    try {
      console.log(`Attempting to launch app: ${interruptedApp.appName} (${interruptedApp.packageName})`);
      console.log('IntentionTimerModule:', IntentionTimerModule);
      console.log('Available methods:', Object.keys(IntentionTimerModule));
      
      if (typeof IntentionTimerModule.launchApp !== 'function') {
        throw new Error('launchApp method not available on IntentionTimerModule');
      }
      
      console.log('Calling launchApp with package:', interruptedApp.packageName);
      const result = await IntentionTimerModule.launchApp(interruptedApp.packageName);
      console.log(`Successfully launched ${interruptedApp.appName}, result:`, result);
    } catch (error) {
      console.error('Error launching target app:', error);
      console.log('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        code: (error as any)?.code,
        userInfo: (error as any)?.userInfo
      });
      
      const errorString = String(error);
      const isNotInstalled = errorString.includes('not installed') || errorString.includes('APP_NOT_INSTALLED');
      
      if (isNotInstalled) {
        Alert.alert(
          'App Not Available',
          `${interruptedApp.appName} is not installed on this device.\n\nFor testing purposes, you can:\n• Install ${interruptedApp.appName} from the Play Store\n• Use a different social media app that's installed\n• Continue without launching the app`,
          [
            { text: 'OK', onPress: onBack },
            { text: 'Go to Play Store', onPress: () => openPlayStore(interruptedApp.packageName) }
          ]
        );
      } else {
        Alert.alert(
          'Launch Failed',
          `Unable to open ${interruptedApp.appName}.\n\nThis might be due to:\n• App security restrictions\n• Permission issues\n• Instagram-specific launch requirements\n\nError: ${errorString}\n\nPlease open Instagram manually.`,
          [{ text: 'OK', onPress: onBack }]
        );
      }
    }
  };

  const openPlayStore = async (packageName: string) => {
    try {
      const playStoreUrl = `market://details?id=${packageName}`;
      const supported = await Linking.canOpenURL(playStoreUrl);
      
      if (supported) {
        await Linking.openURL(playStoreUrl);
      } else {
        // Fallback to web version
        await Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
      }
    } catch (error) {
      console.error('Error opening Play Store:', error);
      Alert.alert('Error', 'Could not open Play Store');
    }
  };

  const saveIntentionData = async (
    fulfilled: boolean,
    keptUsing: boolean,
    reflection: string
  ) => {
    try {
      const currentIntention = await AsyncStorage.getItem('currentIntention');
      if (currentIntention) {
        const intentionData: IntentionData = JSON.parse(currentIntention);
        const totalUseTime = Math.floor((Date.now() - intentionData.startTime) / 1000 / 60); // minutes

        const completedIntention: IntentionData = {
          ...intentionData,
          totalUseTime,
          intentionFulfilled: fulfilled,
          keptUsingAfterPopup: keptUsing,
          reflection: reflection.trim(),
        };

        // Save to completed intentions
        const existingIntentions = await AsyncStorage.getItem('completedIntentions');
        const intentions = existingIntentions ? JSON.parse(existingIntentions) : [];
        intentions.push(completedIntention);
        await AsyncStorage.setItem('completedIntentions', JSON.stringify(intentions));

        // Clear current intention
        await AsyncStorage.removeItem('currentIntention');

        Alert.alert(
          'Session Saved',
          'Your intention session has been saved. Thank you for being mindful!',
          [{ text: 'OK', onPress: onBack }]
        );
      }
    } catch (error) {
      console.error('Error saving intention data:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          Set Intention
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.appInfo}>
          <Text style={[styles.appName, isDarkMode && styles.darkText]}>
            {interruptedApp.appName}
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.darkText]}>
            Set a mindful intention for your time
          </Text>
        </View>

        {!isActive ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                How long do you want to use {interruptedApp.appName}?
              </Text>
                             <View style={styles.timeOptions}>
                 {timeOptions.map((option) => (
                   <TouchableOpacity
                     key={option.label}
                     style={[
                       styles.timeOption,
                       selectedTimeOption.label === option.label && styles.selectedTimeOption,
                     ]}
                     onPress={() => setSelectedTimeOption(option)}
                   >
                     <Text
                       style={[
                         styles.timeOptionText,
                         selectedTimeOption.label === option.label && styles.selectedTimeOptionText,
                       ]}
                     >
                       {option.label}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                What's your intention?
              </Text>
              <Text style={[styles.sectionSubtitle, isDarkMode && styles.darkText]}>
                Be specific about what you want to accomplish
              </Text>
              <TextInput
                style={[styles.intentionInput, isDarkMode && styles.darkIntentionInput]}
                placeholder="e.g., Check messages from family, watch one educational video, browse for 10 minutes..."
                placeholderTextColor="#999999"
                value={intention}
                onChangeText={setIntention}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.startButton, !intention.trim() && styles.disabledButton]}
              onPress={handleStartIntention}
              disabled={!intention.trim()}
            >
              <Text style={styles.startButtonText}>Start Mindful Session</Text>
            </TouchableOpacity>
          </>
                 ) : (
           <View style={styles.activeSession}>
             <View style={styles.intentionDisplay}>
               <Text style={[styles.intentionLabel, isDarkMode && styles.darkText]}>
                 Session Active:
               </Text>
               <Text style={[styles.intentionText, isDarkMode && styles.darkText]}>
                 Your {selectedTimeOption.isSeconds ? '15-second' : `${selectedTimeOption.value}-minute`} session for {interruptedApp.appName} is running in the background.
               </Text>
             </View>

             <TouchableOpacity
               style={styles.stopButton}
               onPress={() => {
                 Alert.alert(
                   'End Session Early?',
                   'Are you sure you want to end your mindful session?',
                   [
                     { text: 'Cancel', style: 'cancel' },
                     { text: 'End Session', onPress: () => handleTimeUp() },
                   ]
                 );
               }}
             >
               <Text style={styles.stopButtonText}>End Session Early</Text>
             </TouchableOpacity>

             <TouchableOpacity
               style={styles.oldGoBackButton}
               onPress={onBack}
             >
               <Text style={styles.oldGoBackButtonText}>Go Back to Main Screen</Text>
             </TouchableOpacity>
                     </View>
        )}
      </ScrollView>

      {/* Completion Dialog Modal */}
      <Modal
        visible={showCompletionDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Header Section */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                  ⏰ Session Complete
                </Text>
                <Text style={[styles.modalSubtitle, isDarkMode && styles.darkText]}>
                  Your mindful session has ended
                </Text>
              </View>

              {/* Intention Reminder Card */}
              <View style={styles.intentionReminder}>
                <Text style={[styles.intentionReminderLabel, isDarkMode && styles.darkText]}>
                  Your intention was:
                </Text>
                <Text style={[styles.intentionReminderText, isDarkMode && styles.darkText]}>
                  "{intention}"
                </Text>
              </View>

              {/* Fulfillment Question */}
              <View style={styles.fulfillmentSection}>
                <Text style={[styles.questionText, isDarkMode && styles.darkText]}>
                  Did you fulfill your intention?
                </Text>
                
                <View style={styles.fulfillmentButtons}>
                  <TouchableOpacity
                    style={[
                      styles.fulfillmentButton, 
                      fulfillmentAnswer === false && styles.selectedFulfillmentButton,
                      styles.noButton
                    ]}
                    onPress={() => handleFulfillmentAnswer(false)}
                  >
                    <Text style={[
                      styles.fulfillmentButtonText,
                      fulfillmentAnswer === false && styles.selectedFulfillmentButtonText
                    ]}>
                      No, I didn't
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.fulfillmentButton, 
                      fulfillmentAnswer === true && styles.selectedFulfillmentButton,
                      styles.yesButton
                    ]}
                    onPress={() => handleFulfillmentAnswer(true)}
                  >
                    <Text style={[
                      styles.fulfillmentButtonText,
                      fulfillmentAnswer === true && styles.selectedFulfillmentButtonText
                    ]}>
                      Yes, I did!
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reflection Section */}
              <View style={styles.reflectionSection}>
                <Text style={[styles.reflectionLabel, isDarkMode && styles.darkText]}>
                  Reflection (Optional)
                </Text>
                <Text style={[styles.reflectionSubtitle, isDarkMode && styles.darkText]}>
                  How do you feel about your time spent? Any insights?
                </Text>
                <TextInput
                  style={[styles.reflectionInput, isDarkMode && styles.darkReflectionInput]}
                  placeholder="Share your thoughts about this session..."
                  placeholderTextColor="#999999"
                  value={reflection}
                  onChangeText={setReflection}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              {fulfillmentAnswer !== null ? (
                <View style={styles.actionButtons}>
                  <Text style={[styles.actionQuestion, isDarkMode && styles.darkText]}>
                    What would you like to do now?
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.goHomeButton]}
                    onPress={() => handleIntentionComplete('home')}
                  >
                    <Text style={styles.actionButtonText}>🏠 Go Home</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.goBackButton]}
                    onPress={() => handleIntentionComplete('back_to_app')}
                  >
                    <Text style={styles.actionButtonText}>📱 Continue with {interruptedApp.appName}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promptSection}>
                  <Text style={[styles.promptText, isDarkMode && styles.darkText]}>
                    Please answer whether you fulfilled your intention above
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#9ac790',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeOption: {
    width: (width - 60) / 3,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f0f9e6',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedTimeOption: {
    backgroundColor: '#9ac790',
    borderColor: '#4CAF50',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedTimeOptionText: {
    color: 'white',
  },
  intentionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f0f9e6',
  },
  darkIntentionInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d0d0',
  },
  startButton: {
    backgroundColor: '#9ac790',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activeSession: {
    alignItems: 'center',
    padding: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  intentionDisplay: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
  },
  intentionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  intentionText: {
    fontSize: 16,
    color: '#333333',
    fontStyle: 'italic',
  },
  stopButton: {
    backgroundColor: 'gray',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
     stopButtonText: {
     color: 'white',
     fontSize: 14,
     fontWeight: '600',
   },
   oldGoBackButton: {
     backgroundColor: '#9ac790',
     paddingVertical: 12,
     paddingHorizontal: 20,
     borderRadius: 6,
     marginTop: 10,
   },
   oldGoBackButtonText: {
     color: 'white',
     fontSize: 14,
     fontWeight: '600',
   },
   // Modal Styles
   modalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
   },
   modalContent: {
     backgroundColor: '#ffffff',
     borderRadius: 20,
     padding: 0,
     width: '100%',
     maxWidth: 400,
     maxHeight: '90%',
     minHeight: 500,
     overflow: 'hidden',
   },
   darkModalContent: {
     backgroundColor: '#f5f5f5',
   },
   modalHeader: {
     backgroundColor: '#9ac790',
     paddingTop: 24,
     paddingBottom: 20,
     paddingHorizontal: 24,
     borderTopLeftRadius: 20,
     borderTopRightRadius: 20,
     alignItems: 'center',
   },
   modalTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     textAlign: 'center',
     marginBottom: 8,
     color: '#FFFFFF',
   },
   modalSubtitle: {
     fontSize: 16,
     textAlign: 'center',
     color: '#FFFFFF',
     opacity: 0.9,
   },
   intentionReminder: {
     backgroundColor: '#f0f9e6',
     padding: 20,
     borderRadius: 12,
     marginHorizontal: 24,
     marginTop: 24,
     marginBottom: 24,
     borderWidth: 1,
     borderColor: '#e8f5e8',
   },
   intentionReminderLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: '#333333',
     marginBottom: 8,
   },
   intentionReminderText: {
     fontSize: 16,
     color: '#333333',
     fontStyle: 'italic',
     lineHeight: 22,
   },
   fulfillmentSection: {
     paddingHorizontal: 24,
     marginBottom: 24,
   },
   questionText: {
     fontSize: 18,
     fontWeight: '600',
     textAlign: 'center',
     marginBottom: 20,
     color: '#333333',
   },
   fulfillmentButtons: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 12,
   },
   fulfillmentButton: {
     flex: 1,
     paddingVertical: 14,
     paddingHorizontal: 16,
     borderRadius: 10,
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#e0e0e0',
     backgroundColor: '#f8f8f8',
   },
   selectedFulfillmentButton: {
     borderColor: '#9ac790',
     backgroundColor: '#9ac790',
   },
   noButton: {
     borderColor: '#FF5722',
   },
   yesButton: {
     borderColor: '#4CAF50',
   },
   fulfillmentButtonText: {
     color: '#666666',
     fontSize: 16,
     fontWeight: '600',
   },
   selectedFulfillmentButtonText: {
     color: 'white',
   },
     reflectionSection: {
       paddingHorizontal: 24,
       marginBottom: 24,
     },
     reflectionLabel: {
       fontSize: 16,
       fontWeight: '600',
       marginBottom: 8,
       color: '#333333',
     },
     reflectionSubtitle: {
       fontSize: 14,
       color: '#666666',
       marginBottom: 12,
     },
     reflectionInput: {
       borderWidth: 1,
       borderColor: '#e0e0e0',
       borderRadius: 10,
       padding: 16,
       fontSize: 16,
       minHeight: 80,
       backgroundColor: '#f0f9e6',
       textAlignVertical: 'top',
     },
     darkReflectionInput: {
       backgroundColor: '#ffffff',
       borderColor: '#d0d0d0',
     },
     actionButtons: {
       paddingHorizontal: 24,
       paddingTop: 20,
       borderTopWidth: 1,
       borderTopColor: '#e0e0e0',
       marginTop: 8,
     },
     actionQuestion: {
       fontSize: 16,
       fontWeight: '600',
       textAlign: 'center',
       marginBottom: 16,
       color: '#333333',
     },
     actionButton: {
       paddingVertical: 16,
       paddingHorizontal: 20,
       borderRadius: 10,
       alignItems: 'center',
       marginBottom: 12,
     },
     goHomeButton: {
       backgroundColor: '#9ac790',
     },
     goBackButton: {
       backgroundColor: '#4CAF50',
     },
     actionButtonText: {
       color: 'white',
       fontSize: 16,
       fontWeight: '600',
     },
     promptSection: {
       paddingHorizontal: 24,
       paddingVertical: 20,
       alignItems: 'center',
     },
     promptText: {
       fontSize: 14,
       color: '#999999',
       textAlign: 'center',
       fontStyle: 'italic',
     },
   modalScrollContent: {
     flexGrow: 1,
     paddingBottom: 20,
   },
}); 