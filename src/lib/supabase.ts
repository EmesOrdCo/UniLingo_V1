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

  async createUserFlashcard(flashcardData: {
    user_id: string;
    vocabulary_id: string;
    notes?: string;
    difficulty?: number;
  }) {
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

  async getStudySessions(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.STUDY_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async createStudySession(sessionData: {
    user_id: string;
    subject_id?: string;
    topic_id?: string;
    duration: number;
    cards_studied: number;
    correct_answers: number;
  }) {
    const { data, error } = await supabase
      .from(TABLES.STUDY_SESSIONS)
      .insert([sessionData])
      .select()
      .single();
    
    return { data, error };
  },

  async getProgress(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.PROGRESS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async updateProgress(progressData: {
    user_id: string;
    subject_id?: string;
    topic_id?: string;
    vocabulary_id?: string;
    action: string;
    metadata?: any;
  }) {
    const { data, error } = await supabase
      .from(TABLES.PROGRESS)
      .insert([progressData])
      .select()
      .single();
    
    return { data, error };
  },

  async uploadFile(file: any, userId: string) {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(fileName, file);
    
    if (error) return { data: null, error };
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-materials')
      .getPublicUrl(fileName);
    
    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabase
      .from(TABLES.UPLOADED_FILES)
      .insert([{
        user_id: userId,
        file_name: file.name,
        file_path: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      }])
      .select()
      .single();
    
    return { data: fileRecord, error: dbError };
  },

  async getUploadedFiles(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.UPLOADED_FILES)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },
};

