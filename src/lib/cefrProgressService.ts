import { supabase } from './supabase';
import { logger } from './logger';

export interface CefrLevelProgress {
  cefrLevel: string;
  completedUnits: number;
  totalUnits: number;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export class CefrProgressService {
  /**
   * Get progress for a specific CEFR level
   */
  static async getCefrLevelProgress(
    userId: string,
    cefrLevel: string
  ): Promise<CefrLevelProgress | null> {
    try {
      // Get user's progress for this CEFR level (CEFR lessons have lesson_type = 'cefr' or NULL)
      const { data: userProgress, error: progressError } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('cefr_level', cefrLevel)
        .or('lesson_type.is.null,lesson_type.eq.cefr');

      if (progressError) {
        logger.error('Error fetching CEFR progress:', progressError);
        return null;
      }

      // For now, let's define the available CEFR units based on common structure
      // A1 typically has units: A1.1, A1.2, A1.3, A1.4, A1.5 (5 units)
      // A2 typically has units: A2.1, A2.2, A2.3, A2.4, A2.5 (5 units)
      // etc.
      const unitsPerLevel: { [key: string]: number } = {
        'A1': 5,
        'A2': 5,
        'B1': 5,
        'B2': 5,
        'C1': 5,
        'C2': 5
      };

      const totalUnits = unitsPerLevel[cefrLevel] || 5;

      // Calculate completed units (units with status 'completed')
      const completedUnits = userProgress?.filter(p => p.status === 'completed').length || 0;

      // Calculate progress percentage
      const progressPercentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

      // Determine status
      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      if (completedUnits > 0) {
        status = completedUnits >= totalUnits ? 'completed' : 'in_progress';
      }

      return {
        cefrLevel,
        completedUnits,
        totalUnits,
        progressPercentage,
        status
      };
    } catch (error) {
      logger.error('Error in getCefrLevelProgress:', error);
      return null;
    }
  }

  /**
   * Get progress for all CEFR levels
   */
  static async getAllCefrLevelProgress(userId: string): Promise<CefrLevelProgress[]> {
    try {
      const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const progressPromises = cefrLevels.map(level => 
        this.getCefrLevelProgress(userId, level)
      );

      const results = await Promise.all(progressPromises);
      return results.filter((progress): progress is CefrLevelProgress => progress !== null);
    } catch (error) {
      logger.error('Error in getAllCefrLevelProgress:', error);
      return [];
    }
  }

  /**
   * Get overall CEFR progress summary
   */
  static async getCefrProgressSummary(userId: string): Promise<{
    totalUnitsCompleted: number;
    totalUnitsAvailable: number;
    overallProgressPercentage: number;
    currentLevel: string;
    nextLevel: string | null;
  }> {
    try {
      const allProgress = await this.getAllCefrLevelProgress(userId);
      
      const totalUnitsCompleted = allProgress.reduce((sum, p) => sum + p.completedUnits, 0);
      const totalUnitsAvailable = allProgress.reduce((sum, p) => sum + p.totalUnits, 0);
      const overallProgressPercentage = totalUnitsAvailable > 0 
        ? Math.round((totalUnitsCompleted / totalUnitsAvailable) * 100) 
        : 0;

      // Find current level (highest level with progress)
      const currentLevel = allProgress
        .filter(p => p.status !== 'not_started')
        .sort((a, b) => a.cefrLevel.localeCompare(b.cefrLevel))
        .pop()?.cefrLevel || 'A1';

      // Find next level
      const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentIndex = cefrOrder.indexOf(currentLevel);
      const nextLevel = currentIndex < cefrOrder.length - 1 ? cefrOrder[currentIndex + 1] : null;

      return {
        totalUnitsCompleted,
        totalUnitsAvailable,
        overallProgressPercentage,
        currentLevel,
        nextLevel
      };
    } catch (error) {
      logger.error('Error in getCefrProgressSummary:', error);
      return {
        totalUnitsCompleted: 0,
        totalUnitsAvailable: 0,
        overallProgressPercentage: 0,
        currentLevel: 'A1',
        nextLevel: 'A2'
      };
    }
  }
}
