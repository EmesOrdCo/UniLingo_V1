/**
 * Audio Lesson Service
 * Frontend service for managing audio lessons generated from PDFs
 */

import { supabase } from './supabase';
import { BACKEND_CONFIG } from '../config/backendConfig';

export interface AudioLesson {
  id: string;
  user_id: string;
  lesson_id?: string;
  title: string;
  subject?: string;
  source_pdf_name?: string;
  audio_url: string;
  audio_s3_key?: string;
  audio_duration: number;
  audio_size_bytes?: number;
  voice_id: string;
  language_code: string;
  polly_engine: string;
  original_script: string;
  vocabulary_count: number;
  status: 'processing' | 'completed' | 'failed';
  generation_time_seconds?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  audio_generated_at: string;
  last_played_at?: string;
  play_count: number;
  total_listen_time_seconds: number;
}

export interface AudioLessonStats {
  totalLessons: number;
  completedLessons: number;
  totalDuration: number;
  totalPlays: number;
  totalListenTime: number;
}

export class AudioLessonService {
  
  /**
   * Generate audio for an existing lesson
   * @param lessonId - ID of the lesson in esp_lessons table
   * @param userId - User ID
   */
  static async generateAudio(lessonId: string, userId: string): Promise<{
    success: boolean;
    audioLesson?: AudioLesson;
    error?: string;
    generationTime?: number;
  }> {
    try {
      console.log(`🎵 Requesting audio generation for lesson ${lessonId}`);

      const response = await fetch(
        `${BACKEND_CONFIG.BASE_URL}/api/audio/generate-lesson`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonId,
            userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate audio');
      }

      const result = await response.json();
      console.log(`✅ Audio generated:`, result);

      return {
        success: true,
        audioLesson: result.audioLesson,
        generationTime: result.generationTime,
      };
    } catch (error: any) {
      console.error('❌ Audio generation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all audio lessons for a user
   * @param userId - User ID
   */
  static async getUserAudioLessons(userId: string): Promise<AudioLesson[]> {
    try {
      console.log(`📥 Fetching audio lessons for user: ${userId}`);

      const { data, error } = await supabase
        .from('audio_lessons')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

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
  static async getAudioLesson(audioLessonId: string, userId: string): Promise<AudioLesson | null> {
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
   * Delete audio lesson
   * @param audioLessonId - Audio lesson ID
   * @param userId - User ID (for security)
   */
  static async deleteAudioLesson(audioLessonId: string, userId: string): Promise<boolean> {
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
   * Track audio playback
   * @param audioLessonId - Audio lesson ID
   * @param userId - User ID
   * @param listenTime - Time listened in seconds (optional)
   */
  static async trackPlayback(
    audioLessonId: string,
    userId: string,
    listenTime?: number
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
            listenTime,
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
   * Get audio lesson statistics for a user
   * @param userId - User ID
   */
  static async getStats(userId: string): Promise<AudioLessonStats | null> {
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
}

