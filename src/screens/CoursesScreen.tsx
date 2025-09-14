import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ConsistentHeader from '../components/ConsistentHeader';
import { UnitDataService, UnitData } from '../lib/unitDataService';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedUnit } from '../contexts/SelectedUnitContext';

export default function CoursesScreen() {
  const [activeTab, setActiveTab] = useState<'levels'>('levels');
  const [allUnits, setAllUnits] = useState<UnitData[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { setSelectedUnit } = useSelectedUnit();

  // Load all units on component mount
  useEffect(() => {
    loadAllUnits();
  }, []);

  const loadAllUnits = async () => {
    try {
      setLoadingUnits(true);
      const dbUnits = await UnitDataService.getAllUnits();
      
      // Define all expected unit codes
      const expectedUnits = [
        'A1.1', 'A1.2', 'A1.3', 'A1.4', 'A1.5', 'A1.6',
        'A2.1', 'A2.2', 'A2.3',
        'B1.1', 'B1.2', 'B1.3',
        'B2.1', 'B2.2', 'B2.3', 'B2.4',
        'C1.1', 'C1.2', 'C1.3', 'C1.4',
        'C2.1', 'C2.2'
      ];
      
      // Create a map of existing units for quick lookup
      const dbUnitsMap = new Map(dbUnits.map(unit => [unit.unit_code, unit]));
      
      // Get real data for units that don't have unit_code assignments yet
      const allUnitsList = await Promise.all(expectedUnits.map(async (unitCode) => {
        const existingUnit = dbUnitsMap.get(unitCode);
        if (existingUnit) {
          return existingUnit;
        } else {
          // For units without unit_code assignments, create placeholder with estimated data
          const cefrLevel = unitCode.split('.')[0];
          const estimatedData = await getEstimatedUnitData(unitCode, cefrLevel);
          return {
            unit_code: unitCode,
            unit_title: UnitDataService.getUnitTitle(unitCode),
            topic_groups: estimatedData.topic_groups,
            total_words: estimatedData.total_words,
            total_lessons: 5,
            lessons_completed: 0,
            status: 'not_started' as const
          };
        }
      }));
      
      setAllUnits(allUnitsList);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoadingUnits(false);
    }
  };

  const getEstimatedUnitData = async (unitCode: string, cefrLevel: string) => {
    try {
      // Get all topic groups for this CEFR level
      const data = await UnitDataService.getTopicGroupsByCefrLevel(cefrLevel);
      
      console.log(`🔍 ${unitCode}: Found ${data.length} topic groups for ${cefrLevel}`);
      
      if (!data || data.length === 0) {
        // Fallback to estimated data
        console.log(`⚠️ ${unitCode}: No data found, using fallback`);
        return {
          topic_groups: [`${unitCode} Topics`],
          total_words: 100
        };
      }

      // Distribute topic groups across units for this CEFR level
      const unitNumber = parseInt(unitCode.split('.')[1]);
      const totalUnits = getTotalUnitsForCefrLevel(cefrLevel);
      const groupsPerUnit = Math.ceil(data.length / totalUnits);
      const startIndex = (unitNumber - 1) * groupsPerUnit;
      const endIndex = Math.min(startIndex + groupsPerUnit, data.length);
      
      const assignedGroups = data.slice(startIndex, endIndex);
      const totalWords = assignedGroups.reduce((sum, group) => sum + group.word_count, 0);

      console.log(`✅ ${unitCode}: Assigned ${assignedGroups.length} groups, ${totalWords} words`);

      return {
        topic_groups: assignedGroups.map(group => group.topic_group),
        total_words: totalWords
      };
    } catch (error) {
      console.error(`❌ Error getting estimated unit data for ${unitCode}:`, error);
      return {
        topic_groups: [`${unitCode} Topics`],
        total_words: 100
      };
    }
  };

  const getTotalUnitsForCefrLevel = (cefrLevel: string): number => {
    switch (cefrLevel) {
      case 'A1': return 6;
      case 'A2': return 3;
      case 'B1': return 3;
      case 'B2': return 4;
      case 'C1': return 4;
      case 'C2': return 2;
      default: return 1;
    }
  };

  const handleCourseSelect = (unit: UnitData) => {
    console.log('🎯 Course selected:', unit.unit_code, unit.unit_title);
    console.log('🎯 Setting selectedUnit in context:', unit);
    // Set the selected unit in context
    setSelectedUnit(unit);
    // Navigate back to Dashboard
    navigation.goBack();
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Courses</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, styles.activeTab]}
            >
              <Text style={[styles.tabText, styles.activeTabText]}>
                Levels
              </Text>
            </TouchableOpacity>
          </View>

          {/* Course Cards */}
          <View style={styles.coursesContainer}>
            {loadingUnits ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading courses...</Text>
              </View>
            ) : (
              allUnits.map((unit) => (
                <TouchableOpacity 
                  key={unit.unit_code} 
                  style={styles.courseCard}
                  onPress={() => handleCourseSelect(unit)}
                >
                  <View style={styles.courseContent}>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseLevel}>{unit.unit_code}</Text>
                      <Text style={styles.courseTitle}>{unit.unit_title}</Text>
                      <Text style={styles.unitsText}>
                        {unit.topic_groups.length} topics • {unit.total_words} words
                      </Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unit.unit_code.split('.')[0]}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  coursesContainer: {
    marginBottom: 32,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  courseCard: {
    backgroundColor: '#fef7ed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  unitsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  badgeContainer: {
    marginLeft: 16,
  },
  badge: {
    width: 60,
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
});
