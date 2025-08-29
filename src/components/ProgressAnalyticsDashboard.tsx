import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedProgressService, EnhancedProgressInsights } from '../lib/enhancedProgressService';

const { width } = Dimensions.get('window');

interface ProgressAnalyticsDashboardProps {
  userId: string;
  onClose?: () => void;
}

export default function ProgressAnalyticsDashboard({ userId, onClose }: ProgressAnalyticsDashboardProps) {
  const [insights, setInsights] = useState<EnhancedProgressInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'patterns' | 'vocabulary'>('overview');

  useEffect(() => {
    loadProgressInsights();
  }, [userId]);

  const loadProgressInsights = async () => {
    try {
      setLoading(true);
      const progressInsights = await EnhancedProgressService.getProgressInsights(userId);
      setInsights(progressInsights);
    } catch (error) {
      console.error('Error loading progress insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { icon: 'trending-up', color: '#10b981', text: 'Improving' };
      case 'declining':
        return { icon: 'trending-down', color: '#ef4444', text: 'Declining' };
      default:
        return { icon: 'trending-up', color: '#6b7280', text: 'Stable' };
    }
  };

  const getOptimalStudyTimeIcon = (time: string) => {
    switch (time) {
      case 'morning':
        return { icon: 'sunny', color: '#f59e0b', text: 'Morning' };
      case 'afternoon':
        return { icon: 'partly-sunny', color: '#f97316', text: 'Afternoon' };
      default:
        return { icon: 'moon', color: '#6366f1', text: 'Evening' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Analyzing your progress...</Text>
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load progress insights</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProgressInsights}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trendInfo = getPerformanceTrendIcon(insights.performanceTrend);
  const studyTimeInfo = getOptimalStudyTimeIcon(insights.optimalStudyTime);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Analytics</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['overview', 'skills', 'patterns', 'vocabulary'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <OverviewTab insights={insights} trendInfo={trendInfo} studyTimeInfo={studyTimeInfo} />
        )}
        {activeTab === 'skills' && (
          <SkillsTab userId={userId} />
        )}
        {activeTab === 'patterns' && (
          <PatternsTab userId={userId} />
        )}
        {activeTab === 'vocabulary' && (
          <VocabularyTab userId={userId} />
        )}
      </ScrollView>
    </View>
  );
}

// Overview Tab Component
function OverviewTab({ 
  insights, 
  trendInfo, 
  studyTimeInfo 
}: { 
  insights: EnhancedProgressInsights; 
  trendInfo: { icon: string; color: string; text: string };
  studyTimeInfo: { icon: string; color: string; text: string };
}) {
  return (
    <View style={styles.tabContent}>
      {/* Performance Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Performance Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name={trendInfo.icon as any} size={24} color={trendInfo.color} />
            <Text style={styles.overviewLabel}>Trend</Text>
            <Text style={[styles.overviewValue, { color: trendInfo.color }]}>{trendInfo.text}</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="star" size={24} color="#f59e0b" />
            <Text style={styles.overviewLabel}>Proficiency</Text>
            <Text style={styles.overviewValue}>{insights.estimatedProficiency}/10</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name={studyTimeInfo.icon as any} size={24} color={studyTimeInfo.color} />
            <Text style={styles.overviewLabel}>Best Time</Text>
            <Text style={styles.overviewValue}>{studyTimeInfo.text}</Text>
          </View>
        </View>
      </View>

      {/* Strengths */}
      {insights.strengths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Your Strengths</Text>
          {insights.strengths.map((strength, index) => (
            <View key={index} style={styles.strengthItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Areas for Improvement */}
      {insights.weaknesses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Areas for Improvement</Text>
          {insights.weaknesses.map((weakness, index) => (
            <View key={index} style={styles.weaknessItem}>
              <Ionicons name="alert-circle" size={20} color="#f59e0b" />
              <Text style={styles.weaknessText}>{weakness}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {insights.recommendedFocus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Recommended Focus</Text>
          {insights.recommendedFocus.map((focus, index) => (
            <View key={index} style={styles.focusItem}>
              <Ionicons name="bulb" size={20} color="#6366f1" />
              <Text style={styles.focusText}>{focus}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Next Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Next Steps</Text>
        {insights.nextSteps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Skills Tab Component
function SkillsTab({ userId }: { userId: string }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      // This would call the enhanced progress service to get skill metrics
      // For now, showing placeholder data
      setSkills([
        { skill_type: 'vocabulary', proficiency_level: 7, average_score: 85.5 },
        { skill_type: 'grammar', proficiency_level: 5, average_score: 72.0 },
        { skill_type: 'comprehension', proficiency_level: 8, average_score: 88.0 }
      ]);
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🎯 Skill Development</Text>
      {skills.map((skill, index) => (
        <View key={index} style={styles.skillCard}>
          <View style={styles.skillHeader}>
            <Text style={styles.skillName}>{skill.skill_type}</Text>
            <Text style={styles.skillLevel}>Level {skill.proficiency_level}/10</Text>
          </View>
          <View style={styles.skillProgress}>
            <View style={[styles.progressBar, { width: `${skill.proficiency_level * 10}%` }]} />
          </View>
          <Text style={styles.skillScore}>Average: {skill.average_score}%</Text>
        </View>
      ))}
    </View>
  );
}

// Patterns Tab Component
function PatternsTab({ userId }: { userId: string }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📈 Learning Patterns</Text>
      <Text style={styles.comingSoonText}>Detailed learning pattern analysis coming soon!</Text>
    </View>
  );
}

// Vocabulary Tab Component
function VocabularyTab({ userId }: { userId: string }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📚 Vocabulary Mastery</Text>
      <Text style={styles.comingSoonText}>Vocabulary retention analysis coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  strengthText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 12,
    flex: 1,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  weaknessText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 12,
    flex: 1,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  focusText: {
    fontSize: 14,
    color: '#3730a3',
    marginLeft: 12,
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  skillCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  skillLevel: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  skillProgress: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  skillScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

