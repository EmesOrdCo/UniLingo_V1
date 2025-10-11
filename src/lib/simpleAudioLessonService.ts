/**
 * Simple Audio Lesson Service
 * Standalone system for PDF → Text → Audio conversion
 */

import { supabase } from './supabase';
import { BACKEND_CONFIG } from '../config/backendConfig';

export interface SimpleAudioLesson {
  id: string;
  user_id: string;
  title: string;
  script_text: string;
  audio_url: string;
  audio_file_path?: string;
  audio_duration: number;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  last_played_at?: string;
  play_count: number;
}

export interface AudioStats {
  total_lessons: number;
  not_started: number;
  in_progress: number;
  completed: number;
  total_duration_seconds: number;
  total_plays: number;
}

export class SimpleAudioLessonService {
  
  /**
   * Create audio lesson from PDF text (full pipeline)
   * @param pdfText - Extracted text from PDF
   * @param fileName - Original PDF filename
   * @param nativeLanguage - User's native language
   * @param userId - User ID
   */
  static async createAudioLessonFromPDF(
    pdfText: string,
    fileName: string,
    nativeLanguage: string,
    userId: string
  ): Promise<{
    success: boolean;
    audioLesson?: SimpleAudioLesson;
    error?: string;
    generationTime?: number;
  }> {
    try {
      console.log(`🎵 Creating audio lesson from PDF: ${fileName}`);

      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/create-from-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfText,
            fileName,
            nativeLanguage,
            userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to create audio from PDF');
      }

      const result = await response.json();
      console.log(`✅ Audio lesson created from PDF:`, result);

      return {
        success: true,
        audioLesson: result.audioLesson,
        generationTime: result.generationTime,
      };
    } catch (error: any) {
      console.error('❌ Audio creation from PDF failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create audio lesson from text
   * @param title - Lesson title
   * @param scriptText - Text to convert to audio
   * @param userId - User ID
   */
  static async createAudioLesson(
    title: string,
    scriptText: string,
    userId: string
  ): Promise<{
    success: boolean;
    audioLesson?: SimpleAudioLesson;
    error?: string;
    generationTime?: number;
  }> {
    try {
      console.log(`🎵 Creating audio lesson: ${title}`);

      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            scriptText,
            userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to create audio');
      }

      const result = await response.json();
      console.log(`✅ Audio lesson created:`, result);

      return {
        success: true,
        audioLesson: result.audioLesson,
        generationTime: result.generationTime,
      };
    } catch (error: any) {
      console.error('❌ Audio creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all audio lessons for a user
   * @param userId - User ID
   * @param status - Optional filter: 'not_started', 'in_progress', 'completed'
   */
  static async getUserAudioLessons(
    userId: string,
    status?: 'not_started' | 'in_progress' | 'completed'
  ): Promise<SimpleAudioLesson[]> {
    try {
      console.log(`📥 Fetching audio lessons for user: ${userId}`);

      let query = supabase
        .from('audio_lessons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audio lessons:', error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} audio lessons`);
      return data || [];
    } catch (error) {
      console.error('Error fetching audio lessons:', error);
      return [];
    }
  }

  /**
   * Get a specific audio lesson
   * @param audioLessonId - Audio lesson ID
   * @param userId - User ID (for security)
   */
  static async getAudioLesson(
    audioLessonId: string,
    userId: string
  ): Promise<SimpleAudioLesson | null> {
    try {
      const { data, error } = await supabase
        .from('audio_lessons')
        .select('*')
        .eq('id', audioLessonId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching audio lesson:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching audio lesson:', error);
      return null;
    }
  }

  /**
   * Track audio playback (updates last_played_at, auto-increments play_count)
   * @param audioLessonId - Audio lesson ID
   * @param userId - User ID
   */
  static async trackPlayback(
    audioLessonId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/lesson/${audioLessonId}/play`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to track playback');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to track playback:', error);
      return false;
    }
  }

  /**
   * Mark audio lesson as completed
   * @param audioLessonId - Audio lesson ID
   * @param userId - User ID
   */
  static async markAsCompleted(
    audioLessonId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/lesson/${audioLessonId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark as completed');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to mark as completed:', error);
      return false;
    }
  }

  /**
   * Delete audio lesson
   * @param audioLessonId - Audio lesson ID
   * @param userId - User ID (for security)
   */
  static async deleteAudioLesson(
    audioLessonId: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting audio lesson: ${audioLessonId}`);

      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/lesson/${audioLessonId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete audio lesson');
      }

      console.log('✅ Audio lesson deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete audio lesson:', error);
      return false;
    }
  }

  /**
   * Get audio lesson statistics for a user
   * @param userId - User ID
   */
  static async getStats(userId: string): Promise<AudioStats | null> {
    try {
      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/stats/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('❌ Failed to fetch stats:', error);
      return null;
    }
  }

  /**
   * Format duration in seconds to readable string (MM:SS)
   * @param seconds - Duration in seconds
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format duration in seconds to readable string (hours/minutes)
   * @param seconds - Duration in seconds
   */
  static formatLongDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get status badge color
   * @param status - Audio lesson status
   */
  static getStatusColor(status: 'not_started' | 'in_progress' | 'completed'): string {
    switch (status) {
      case 'not_started':
        return '#6b7280'; // Gray
      case 'in_progress':
        return '#f59e0b'; // Orange
      case 'completed':
        return '#10b981'; // Green
      default:
        return '#6b7280';
    }
  }

  /**
   * Get status display text
   * @param status - Audio lesson status
   */
  static getStatusText(status: 'not_started' | 'in_progress' | 'completed'): string {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  }
}

