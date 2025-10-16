import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SimpleAudioLesson, SimpleAudioLessonService } from '../lib/simpleAudioLessonService';
import { RootStackParamList } from '../types/navigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const WAVEFORM_BARS = 50;

type AudioPlayerScreenRouteProp = RouteProp<RootStackParamList, 'AudioPlayer'>;

export default function AudioPlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute<AudioPlayerScreenRouteProp>();
  const { lesson, userId } = route.params;

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(lesson.audio_duration * 1000);
  const [hasError, setHasError] = useState(false);
  
  // Progress bar seeking state
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const progressBarRef = useRef<View>(null);
  const seekingRef = useRef(false);
  const lastSeekPosition = useRef(0); // Store the last valid seek position

  // Animated values for waveform
  const waveformAnimations = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(0.3))
  ).current;

  // PanResponder for progress bar seeking
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        return true;
      },
      onPanResponderGrant: (evt) => {
        setIsSeeking(true);
        seekingRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { locationX } = evt.nativeEvent;
        const progressBarWidth = screenWidth - 48;
        const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
        const newPosition = newProgress * duration;
        setSeekPosition(newPosition);
        lastSeekPosition.current = newPosition; // Store the initial position
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const progressBarWidth = screenWidth - 48;
        const newProgress = Math.max(0, Math.min(1, locationX / progressBarWidth));
        const newPosition = newProgress * duration;
        setSeekPosition(newPosition);
        lastSeekPosition.current = newPosition; // Store the last valid position
      },
      onPanResponderRelease: async () => {
        const finalPosition = lastSeekPosition.current;
        await handleSeek(finalPosition);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSeeking(false);
        seekingRef.current = false;
      },
      onPanResponderTerminate: async () => {
        if (isSeeking) {
          const finalPosition = lastSeekPosition.current;
          await handleSeek(finalPosition);
          setIsSeeking(false);
          seekingRef.current = false;
        }
      },
    })
  ).current;

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Disable swipe-back gesture on this screen to prevent interference with seeking
  useFocusEffect(
    React.useCallback(() => {
      // Disable swipe-back gesture
      navigation.setOptions({
        gestureEnabled: false,
      });

      // Re-enable when leaving the screen
      return () => {
        navigation.setOptions({
          gestureEnabled: true,
        });
      };
    }, [navigation])
  );

  useEffect(() => {
    if (isPlaying) {
      animateWaveform();
    }
  }, [isPlaying]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: lesson.audio_url },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsLoading(false);
      console.log('Audio loaded successfully');
      
      // Auto-play
      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading audio:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      
      // Only update position if we're not currently seeking
      if (!seekingRef.current && !isSeeking) {
        setPosition(status.positionMillis);
      }
      
      // Use the actual duration from the audio file if available, otherwise use the lesson duration
      const actualDuration = status.durationMillis || (lesson.audio_duration * 1000);
      setDuration(actualDuration);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        // Track completion
        SimpleAudioLessonService.trackPlayback(lesson.id, userId);
      }
    }
  };

  const animateWaveform = () => {
    const animations = waveformAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false, // Height animation requires JS driver
          }),
          Animated.timing(anim, {
            toValue: Math.random() * 0.4 + 0.2,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false, // Height animation requires JS driver
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  };

  const handlePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleSeek = async (value: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleSkip = async (seconds: number) => {
    if (!sound) return;

    try {
      const newPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error skipping:', error);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Use lastSeekPosition (stored in ref) during seeking, otherwise use the actual position
  const currentPosition = (isSeeking || seekingRef.current) ? lastSeekPosition.current : position;
  const progress = duration > 0 ? currentPosition / duration : 0;
  


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-down" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Lesson Info */}
        <View style={styles.infoSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={48} color="#8b5cf6" />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {lesson.title}
          </Text>
          <Text style={styles.subtitle}>
            Audio Lesson · {SimpleAudioLessonService.formatDuration(Math.round(duration / 1000))}
          </Text>
        </View>

        {/* Waveform Visualization */}
        <View style={styles.waveformContainer}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorText}>Failed to load audio</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadAudio}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.loadingText}>Loading audio...</Text>
            </View>
          ) : (
            <View style={styles.waveform}>
              {waveformAnimations.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 120],
                      }),
                      opacity: isPlaying ? 1 : 0.3,
                      backgroundColor:
                        index / WAVEFORM_BARS < progress ? '#8b5cf6' : '#374151',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View 
            ref={progressBarRef}
            style={styles.progressBar}
            {...panResponder.panHandlers}
          >
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <View
              style={[
                styles.progressThumb, 
                { 
                  left: `${progress * 100}%`,
                  backgroundColor: isSeeking ? '#ffffff' : '#ffffff',
                  transform: [{ scale: isSeeking ? 1.3 : 1 }],
                  shadowOpacity: isSeeking ? 0.5 : 0.25,
                  shadowRadius: isSeeking ? 8 : 4,
                }
              ]}
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSkip(-15)}
            disabled={isLoading || hasError}
          >
            <Ionicons name="play-back" size={32} color="#ffffff" />
            <Text style={styles.skipText}>15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            disabled={isLoading || hasError}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="#ffffff"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => handleSkip(15)}
            disabled={isLoading || hasError}
          >
            <Ionicons name="play-forward" size={32} color="#ffffff" />
            <Text style={styles.skipText}>15</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Ionicons
              name={isSeeking ? 'search' : isPlaying ? 'volume-high' : 'volume-mute'}
              size={16}
              color={isSeeking ? '#f59e0b' : isPlaying ? '#10b981' : '#6b7280'}
            />
            <Text style={[styles.statusText, isSeeking && styles.statusTextSeeking, isPlaying && styles.statusTextActive]}>
              {isSeeking ? 'Seeking...' : isPlaying ? 'Playing' : 'Paused'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  infoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  waveformContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 120,
    width: '100%',
    gap: 2,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressSection: {
    marginVertical: 20,
  },
  progressBar: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
    marginVertical: 7,
  },
  progressThumb: {
    position: 'absolute',
    top: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    marginLeft: -9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginVertical: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  skipText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    bottom: 14,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusTextActive: {
    color: '#10b981',
  },
  statusTextSeeking: {
    color: '#f59e0b',
  },
});

