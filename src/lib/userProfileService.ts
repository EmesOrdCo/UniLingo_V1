import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  native_language: string; // Matches actual database column name
  target_language: string;
  subjects: string[]; // This will contain the single learning area
  level: 'beginner' | 'intermediate' | 'expert';
  created_at: string;
  last_active: string;
}

export interface CreateProfileData {
  name: string; // Added name field
  native_language: string; // Matches actual database column name
  learning_area: string; // Changed from study_subject
  proficiency_level: 'beginner' | 'intermediate' | 'expert';
}

export interface UpdateProfileData {
  name?: string; // Add name field for updates
  native_language?: string; // Matches actual database column name
  learning_area?: string; // Changed from study_subject
  proficiency_level?: 'beginner' | 'intermediate' | 'expert';
}

export class UserProfileService {
  /**
   * Debug function to check table structure
   */
  static async debugTableStructure(): Promise<void> {
    try {
      console.log('🔍 Debugging table structure...');
      
      // Try to get a sample row to see the actual column names
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Error checking table structure:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('📋 Sample row data:', data[0]);
        console.log('📋 Column names:', Object.keys(data[0]));
      } else {
        console.log('📋 Table is empty');
      }
    } catch (error) {
      console.error('❌ Error in debug function:', error);
    }
  }

  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user profile doesn't exist
          console.log('📋 No user profile found for user:', userId);
          return null;
        }
        throw error;
      }

      console.log('📋 User profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Create a new user profile
   */
  static async createUserProfile(userId: string, profileData: CreateProfileData): Promise<UserProfile> {
    try {
      console.log('📝 Creating user profile for:', userId, 'with data:', profileData);
      
      // First, get the user's email from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const insertData = {
        id: userId,
        email: user.email,
        name: profileData.name, // Use the name from profile data
        native_language: profileData.native_language, // Map to database column
        target_language: 'en', // Default to English
        subjects: [profileData.learning_area], // Store single learning area as array
        level: profileData.proficiency_level,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      console.log('📝 Inserting data into users table:', insertData);

      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting user profile:', error);
        throw error;
      }

      console.log('✅ User profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Update an existing user profile
   */
  static async updateUserProfile(userId: string, profileData: UpdateProfileData): Promise<UserProfile> {
    try {
      const updateData: any = {};
      
      if (profileData.name) {
        updateData.name = profileData.name;
      }
      
      if (profileData.native_language) {
        updateData.native_language = profileData.native_language;
      }
      
      if (profileData.learning_area) {
        updateData.subjects = [profileData.learning_area];
      }
      
      if (profileData.proficiency_level) {
        updateData.level = profileData.proficiency_level;
      }
      
      updateData.last_active = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Delete user profile
   */
  static async deleteUserProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('❌ Error deleting user profile:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed profile setup
   */
  static async hasCompletedProfile(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile !== null;
    } catch (error) {
      console.error('❌ Error checking profile completion:', error);
      return false;
    }
  }

  /**
   * Get profile completion status with details
   */
  static async getProfileCompletionStatus(userId: string): Promise<{
    hasProfile: boolean;
    profile?: UserProfile;
    isComplete: boolean;
  }> {
    try {
      const profile = await this.getUserProfile(userId);

      if (!profile) {
        return {
          hasProfile: false,
          isComplete: false,
        };
      }

      // Check if all required fields are filled
      const isComplete = !!(
        profile.native_language &&
        profile.subjects &&
        profile.subjects.length > 0 &&
        profile.level
      );

      console.log('📋 Profile completion status:', { hasProfile: true, isComplete, profile });

      return {
        hasProfile: true,
        profile,
        isComplete,
      };
    } catch (error) {
      console.error('❌ Error getting profile completion status:', error);
      return {
        hasProfile: false,
        isComplete: false,
      };
    }
  }
}
