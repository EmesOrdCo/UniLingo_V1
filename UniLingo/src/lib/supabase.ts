import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the correct environment variable names for Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zbnozflfozvaktjlomka.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpibm96Zmxmb3p2YWt0amxvbWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTkxODIsImV4cCI6MjA3MDQ5NTE4Mn0.D-kYtY35Tmp3tZ6hU-O2IeZVXMzBvsYr7drUfeKjMkM';

// Debug logging
console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey ? supabaseAnonKey.length : 'undefined');
console.log('Using env vars:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Using fallback Supabase credentials. For production, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env file');
} else {
  console.log('✅ Supabase credentials loaded successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const TABLES = {
  USERS: 'users',
  SUBJECTS: 'subjects',
  TOPICS: 'topics',
  VOCABULARY: 'vocabulary',
  FLASHCARDS: 'flashcards',
  EXERCISES: 'exercises',
  LEARNING_MATERIALS: 'learning_materials',
  PROGRESS: 'progress',
  COURSE_NOTES: 'course_notes',
  USER_FLASHCARDS: 'user_flashcards',
  STUDY_SESSIONS: 'study_sessions',
  UPLOADED_FILES: 'uploaded_files',
};

export const supabaseHelpers = {
  // Helper functions for common database operations
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async getSubjects() {
    const { data, error } = await supabase
      .from(TABLES.SUBJECTS)
      .select('*')
      .order('name');
    
    return { data, error };
  },

  async getTopicsBySubject(subjectId: string) {
    const { data, error } = await supabase
      .from(TABLES.TOPICS)
      .select('*')
      .eq('subject_id', subjectId)
      .order('name');
    
    return { data, error };
  },

  async getVocabularyByTopic(topicId: string) {
    const { data, error } = await supabase
      .from(TABLES.VOCABULARY)
      .select('*')
      .eq('topic_id', topicId)
      .order('term');
    
    return { data, error };
  },

  async getUserFlashcards(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .select(`
        *,
        vocabulary:vocabulary_id(*),
        topic:topics(*),
        subject:subjects(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createUserFlashcard(flashcardData: any) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .insert([flashcardData])
      .select()
      .single();
    
    return { data, error };
  },

  async updateUserFlashcard(id: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteUserFlashcard(id: string) {
    const { error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .delete()
      .eq('id', id);
    
    return { error };
  },

  async searchUserFlashcards(userId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .select('*')
      .eq('user_id', userId)
      .or(`front.ilike.%${searchTerm}%,back.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getFlashcardsBySubject(userId: string, subject: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getFlashcardsByTopic(userId: string, topic: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getFlashcardsByDifficulty(userId: string, difficulty: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .select('*')
      .eq('user_id', userId)
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getFlashcardStats(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.USER_FLASHCARDS)
      .select('*')
      .eq('user_id', userId);
    
    if (error) return { data: null, error };
    
    const flashcards = data || [];
    const stats = {
      total: flashcards.length,
      byDifficulty: {} as { [key: string]: number },
      bySubject: {} as { [key: string]: number },
      byTopic: {} as { [key: string]: number }
    };

    flashcards.forEach(card => {
      stats.byDifficulty[card.difficulty] = (stats.byDifficulty[card.difficulty] || 0) + 1;
      stats.bySubject[card.subject] = (stats.bySubject[card.subject] || 0) + 1;
      stats.byTopic[card.topic] = (stats.byTopic[card.topic] || 0) + 1;
    });

    return { data: stats, error: null };
  },

  async createUserProfile(profileData: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([profileData])
      .select()
      .single();
    
    return { data, error };
  },

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

};
