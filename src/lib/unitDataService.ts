import { supabase } from './supabase';
import { logger } from './logger';

export interface UnitData {
  unit_code: string;
  unit_title: string;
  topic_groups: string[];
  total_words: number;
  lessons_completed?: number;
  total_lessons: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface Lesson {
  id: number;
  title: string;
  status: 'active' | 'locked';
}

export class UnitDataService {
  /**
   * Get all units with their topic groups and word counts
   */
  static async getAllUnits(): Promise<UnitData[]> {
    try {
      const { data, error } = await supabase
        .from('general_english_vocab')
        .select('unit_code, topic_group')
        .not('unit_code', 'is', null)
        .order('unit_code', { ascending: true });

      if (error) {
        logger.error('Error fetching units:', error);
        return [];
      }

      // Group by unit_code and count words
      const unitMap = new Map<string, { topic_groups: Set<string>, word_count: number }>();
      
      data.forEach(item => {
        if (item.unit_code && item.topic_group) {
          if (!unitMap.has(item.unit_code)) {
            unitMap.set(item.unit_code, { topic_groups: new Set(), word_count: 0 });
          }
          const unit = unitMap.get(item.unit_code)!;
          unit.topic_groups.add(item.topic_group);
          unit.word_count++;
        }
      });

      // Convert to UnitData array
      const units: UnitData[] = Array.from(unitMap.entries()).map(([unit_code, data]) => ({
        unit_code,
        unit_title: this.getUnitTitle(unit_code),
        topic_groups: Array.from(data.topic_groups),
        total_words: data.word_count,
        total_lessons: 5, // Words, Listen, Write, Speak, Roleplay
        lessons_completed: 0, // Will be updated with real progress later
        status: 'not_started'
      }));

      return units;
    } catch (error) {
      logger.error('Error in getAllUnits:', error);
      return [];
    }
  }

  /**
   * Get all A-level units with their topic groups and word counts
   */
  static async getALevelUnits(): Promise<UnitData[]> {
    const allUnits = await this.getAllUnits();
    return allUnits.filter(unit => unit.unit_code.startsWith('A'));
  }

  /**
   * Get topic groups for a CEFR level (all topic groups, not just unassigned ones)
   */
  static async getTopicGroupsByCefrLevel(cefrLevel: string): Promise<{ topic_group: string, word_count: number }[]> {
    try {
      console.log(`🔍 getTopicGroupsByCefrLevel called with: "${cefrLevel}"`);
      
      const { data, error } = await supabase
        .from('general_english_vocab')
        .select('topic_group, cefr_level')
        .eq('cefr_level', cefrLevel);

      console.log(`📊 Query result - Error:`, error, 'Data count:', data?.length || 0);
      
      if (error) {
        logger.error('Error fetching topic groups by CEFR level:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log(`⚠️ No data found for cefr_level = "${cefrLevel}"`);
        
        // Try to debug - get ALL cefr_level values to see what's in the DB
        const { data: allLevels } = await supabase
          .from('general_english_vocab')
          .select('cefr_level')
          .limit(10);
        console.log('📋 Sample cefr_level values in DB:', allLevels?.map(x => `"${x.cefr_level}"`));
        
        return [];
      }

      console.log(`✅ Found ${data.length} rows. Sample topic_groups:`, data.slice(0, 3).map(x => x.topic_group));

      // Group by topic_group and count words
      const groupMap = new Map<string, number>();
      data.forEach(item => {
        if (item.topic_group) {
          groupMap.set(item.topic_group, (groupMap.get(item.topic_group) || 0) + 1);
        }
      });

      const result = Array.from(groupMap.entries()).map(([topic_group, word_count]) => ({
        topic_group,
        word_count
      }));
      
      console.log(`📦 Returning ${result.length} topic groups:`, result.map(x => x.topic_group));

      return result;
    } catch (error) {
      logger.error('Error in getTopicGroupsByCefrLevel:', error);
      return [];
    }
  }

  /**
   * Get unit data by unit code, fetching from CEFR level if unit_code is not assigned
   */
  static async getUnitDataByCode(unitCode: string): Promise<{ topic_groups: string[], total_words: number }> {
    try {
      // First try to get data with unit_code assignment
      const { data: unitData, error: unitError } = await supabase
        .from('general_english_vocab')
        .select('topic_group')
        .eq('unit_code', unitCode);

      if (!unitError && unitData && unitData.length > 0) {
        // Data exists with unit_code assignment
        const topicGroups = [...new Set(unitData.map(item => item.topic_group).filter(Boolean))];
        return {
          topic_groups: topicGroups,
          total_words: unitData.length
        };
      }

      // If no unit_code data, try to get data by CEFR level
      const cefrLevel = unitCode.split('.')[0];
      const { data: cefrData, error: cefrError } = await supabase
        .from('general_english_vocab')
        .select('topic_group')
        .eq('cefr_level', cefrLevel)
        .is('unit_code', null);

      if (!cefrError && cefrData && cefrData.length > 0) {
        // Data exists but not assigned to unit_code yet
        const topicGroups = [...new Set(cefrData.map(item => item.topic_group).filter(Boolean))];
        return {
          topic_groups: topicGroups,
          total_words: cefrData.length
        };
      }

      // No data found
      return {
        topic_groups: [],
        total_words: 0
      };
    } catch (error) {
      logger.error('Error in getUnitDataByCode:', error);
      return {
        topic_groups: [],
        total_words: 0
      };
    }
  }

  /**
   * Get lessons for a specific unit
   */
  static getLessonsForUnit(unit: UnitData): Lesson[] {
    const lessons: Lesson[] = [
      { id: 1, title: 'Words', status: 'active' },
      { id: 2, title: 'Listen', status: 'active' },
      { id: 3, title: 'Write', status: 'active' },
      { id: 4, title: 'Speak', status: 'locked' }, // TODO: Implement when ready
      { id: 5, title: 'Roleplay', status: 'locked' }, // TODO: Implement when ready
    ];

    return lessons;
  }

  /**
   * Get unit title based on unit code
   */
  static getUnitTitle(unitCode: string): string {
    const [level, number] = unitCode.split('.');
    
    switch (level) {
      case 'A1':
        switch (number) {
          case '1': return 'Foundation';
          case '2': return 'Basic Actions & Objects';
          case '3': return 'Daily Life & Activities';
          case '4': return 'Communication & Expression';
          case '5': return 'Work & Society';
          case '6': return 'Advanced Concepts';
          default: return `A1.${number}`;
        }
      case 'A2':
        switch (number) {
          case '1': return 'Daily Life & Routines';
          case '2': return 'Food & Dining';
          case '3': return 'Shopping & Money';
          default: return `A2.${number}`;
        }
      case 'B1':
        switch (number) {
          case '1': return 'Intermediate Foundation';
          case '2': return 'Intermediate Development';
          case '3': return 'Intermediate Mastery';
          default: return `B1.${number}`;
        }
      case 'B2':
        switch (number) {
          case '1': return 'Upper Intermediate 1';
          case '2': return 'Upper Intermediate 2';
          case '3': return 'Upper Intermediate 3';
          case '4': return 'Upper Intermediate 4';
          default: return `B2.${number}`;
        }
      case 'C1':
        switch (number) {
          case '1': return 'Advanced Foundation';
          case '2': return 'Advanced Development';
          case '3': return 'Advanced Mastery';
          case '4': return 'Advanced Proficiency';
          default: return `C1.${number}`;
        }
      case 'C2':
        switch (number) {
          case '1': return 'Proficient 1';
          case '2': return 'Proficient 2';
          default: return `C2.${number}`;
        }
      default:
        return unitCode;
    }
  }

  /**
   * Get topic group for a specific unit (for navigation)
   */
  static getTopicGroupForUnit(unitCode: string): string {
    // For now, return the first topic group of the unit
    // In the future, we might want to be more specific about which topic group to use
    return 'Basic Concepts'; // This will be updated when we implement the real data fetching
  }

  /**
   * Check if a unit has vocabulary available
   */
  static async hasVocabulary(unitCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('general_english_vocab')
        .select('id')
        .eq('unit_code', unitCode)
        .limit(1);

      if (error) {
        logger.error('Error checking vocabulary:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error('Error in hasVocabulary:', error);
      return false;
    }
  }
}
