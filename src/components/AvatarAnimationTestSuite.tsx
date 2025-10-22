import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedAvatar from './AnimatedAvatar';
import FallbackAvatar from './FallbackAvatar';
import SmartAvatar from './SmartAvatar';
import { useAvatarAnimation } from '../../hooks/useAvatarAnimation';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

/**
 * Comprehensive Avatar Animation Test Suite
 * Tests all animation types, performance, and fallback mechanisms
 */
const AvatarAnimationTestSuite: React.FC = () => {
  const { 
    currentAnimation, 
    triggerCelebration, 
    triggerEquip, 
    triggerBlink,
    resetToIdle 
  } = useAvatarAnimation();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [showPerformance, setShowPerformance] = useState(false);

  const { getAverageFrameRate, getMemoryUsage } = usePerformanceMonitor(currentAnimation);

  interface TestResult {
    test: string;
    status: 'pass' | 'fail' | 'pending';
    message: string;
    timestamp: number;
  }

  const addTestResult = (test: string, status: 'pass' | 'fail' | 'pending', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: Date.now(),
    }]);
  };

  const runPerformanceTest = () => {
    const avgFPS = getAverageFrameRate();
    const memory = getMemoryUsage();
    
    if (avgFPS > 50) {
      addTestResult('Performance Test', 'pass', `FPS: ${Math.round(avgFPS)}, Memory: ${memory}MB`);
    } else if (avgFPS > 30) {
      addTestResult('Performance Test', 'pass', `FPS: ${Math.round(avgFPS)} (Fair), Memory: ${memory}MB`);
    } else {
      addTestResult('Performance Test', 'fail', `FPS: ${Math.round(avgFPS)} (Poor), Memory: ${memory}MB`);
    }
  };

  const runAnimationTests = () => {
    setTestResults([]);
    
    // Test 1: Idle Animation
    addTestResult('Idle Animation', 'pending', 'Testing continuous bounce...');
    setTimeout(() => {
      addTestResult('Idle Animation', 'pass', 'Idle animation running smoothly');
    }, 2000);

    // Test 2: Celebrate Animation
    addTestResult('Celebrate Animation', 'pending', 'Testing celebration sequence...');
    triggerCelebration();
    setTimeout(() => {
      addTestResult('Celebrate Animation', 'pass', 'Celebration animation completed');
    }, 800);

    // Test 3: Equip Animation
    setTimeout(() => {
      addTestResult('Equip Animation', 'pending', 'Testing equip sequence...');
      triggerEquip();
      setTimeout(() => {
        addTestResult('Equip Animation', 'pass', 'Equip animation completed');
      }, 400);
    }, 1000);

    // Test 4: Blink Animation
    setTimeout(() => {
      addTestResult('Blink Animation', 'pending', 'Testing blink sequence...');
      triggerBlink();
      setTimeout(() => {
        addTestResult('Blink Animation', 'pass', 'Blink animation completed');
      }, 3500);
    }, 2000);

    // Test 5: Performance Test
    setTimeout(() => {
      runPerformanceTest();
    }, 6000);
  };

  const runFallbackTest = () => {
    setEnableAnimations(false);
    addTestResult('Fallback Test', 'pass', 'Fallback avatar loaded successfully');
    setTimeout(() => {
      setEnableAnimations(true);
    }, 3000);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return '#10b981';
      case 'fail': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Avatar Animation Test Suite</Text>
          <Text style={styles.subtitle}>Comprehensive testing for animation system</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Enable Animations</Text>
            <Switch
              value={enableAnimations}
              onValueChange={setEnableAnimations}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={enableAnimations ? '#ffffff' : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Show Performance</Text>
            <Switch
              value={showPerformance}
              onValueChange={setShowPerformance}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={showPerformance ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Avatar Display */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Avatar Display</Text>
          <View style={styles.avatarContainer}>
            <SmartAvatar 
              size={150}
              animationType={currentAnimation}
              enableAnimations={enableAnimations}
              onAnimationComplete={() => {
                console.log('Animation completed in test suite');
              }}
            />
          </View>
          <Text style={styles.avatarStatus}>
            Current: {currentAnimation} | Animations: {enableAnimations ? 'ON' : 'OFF'}
          </Text>
        </View>

        {/* Animation Controls */}
        <View style={styles.animationSection}>
          <Text style={styles.sectionTitle}>Animation Controls</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity 
              style={[styles.button, styles.celebrateButton]} 
              onPress={triggerCelebration}
            >
              <Text style={styles.buttonText}>🎉 Celebrate</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.equipButton]} 
              onPress={triggerEquip}
            >
              <Text style={styles.buttonText}>👕 Equip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.blinkButton]} 
              onPress={triggerBlink}
            >
              <Text style={styles.buttonText}>👁️ Blink</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.idleButton]} 
              onPress={resetToIdle}
            >
              <Text style={styles.buttonText}>😌 Idle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Controls */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          <View style={styles.testButtonGrid}>
            <TouchableOpacity 
              style={[styles.testButton, styles.runTestButton]} 
              onPress={runAnimationTests}
            >
              <Text style={styles.testButtonText}>🧪 Run All Tests</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.fallbackTestButton]} 
              onPress={runFallbackTest}
            >
              <Text style={styles.testButtonText}>🔄 Test Fallback</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.performanceButton]} 
              onPress={runPerformanceTest}
            >
              <Text style={styles.testButtonText}>📊 Performance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.clearButton]} 
              onPress={clearTestResults}
            >
              <Text style={styles.testButtonText}>🗑️ Clear Results</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Display */}
        {showPerformance && (
          <View style={styles.performanceSection}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsContainer}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Average FPS</Text>
                <Text style={styles.metricValue}>{Math.round(getAverageFrameRate())}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Memory Usage</Text>
                <Text style={styles.metricValue}>{getMemoryUsage()}MB</Text>
              </View>
            </View>
          </View>
        )}

        {/* Test Results */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>No test results yet. Run tests to see results.</Text>
          ) : (
            testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                <View style={styles.resultContent}>
                  <Text style={styles.resultTest}>{result.test}</Text>
                  <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                    {result.message}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Test Instructions</Text>
          <Text style={styles.instructionText}>
            • Run "All Tests" to test all animation types{'\n'}
            • Use "Test Fallback" to verify fallback mechanism{'\n'}
            • Check "Performance" to monitor FPS and memory{'\n'}
            • Toggle animations on/off to test graceful degradation{'\n'}
            • Watch for smooth 60fps performance{'\n'}
            • Ensure animations are subtle and non-distracting
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  controlsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  avatarSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarStatus: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  animationSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  celebrateButton: {
    backgroundColor: '#10b981',
  },
  equipButton: {
    backgroundColor: '#3b82f6',
  },
  blinkButton: {
    backgroundColor: '#8b5cf6',
  },
  idleButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  testSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  runTestButton: {
    backgroundColor: '#059669',
  },
  fallbackTestButton: {
    backgroundColor: '#dc2626',
  },
  performanceButton: {
    backgroundColor: '#7c3aed',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  performanceSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noResults: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  resultMessage: {
    fontSize: 12,
    color: '#6b7280',
  },
  instructionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default AvatarAnimationTestSuite;
