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
  level: 'beginner' | 'intermediate' | 'expert';
}

export interface UpdateProfileData {
  name?: string; // Add name field for updates
  native_language?: string; // Matches actual database column name
  learning_area?: string; // Changed from study_subject
  level?: 'beginner' | 'intermediate' | 'expert';
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
        name: profileData.name,
        native_language: profileData.native_language,
        target_language: 'English', // Default to English for now
        subjects: [profileData.learning_area], // Convert to array format
                        level: profileData.level,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      console.log('📝 Inserting profile data:', insertData);

      const { data, error } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user profile:', error);
        throw error;
      }

      console.log('✅ User profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in createUserProfile:', error);
      throw error;
    }
  }

  /**
   * Update an existing user profile
   */
  static async updateUserProfile(userId: string, profileData: UpdateProfileData): Promise<UserProfile> {
    try {
      console.log('📝 Updating user profile for:', userId, 'with data:', profileData);
      
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
        
                        if (profileData.level) {
                  updateData.level = profileData.level;
                }

        updateData.last_active = new Date().toISOString();

        console.log('📝 Updating with data:', updateData);

        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating user profile:', error);
          throw error;
        }

        console.log('✅ User profile updated successfully:', data);
        return data;
      } catch (error) {
        console.error('❌ Error in updateUserProfile:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error);
      throw error;
    }
  }

  /**
   * Delete a user profile
   */
  static async deleteUserProfile(userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting user profile for:', userId);
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Error deleting user profile:', error);
        throw error;
      }

      console.log('✅ User profile deleted successfully');
    } catch (error) {
      console.error('❌ Error in deleteUserProfile:', error);
      throw error;
    }
  }

  /**
   * Get all user profiles (for admin purposes)
   */
  static async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all user profiles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllUserProfiles:', error);
      throw error;
    }
  }

  /**
   * Search user profiles by name or email
   */
  static async searchUserProfiles(searchTerm: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error searching user profiles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in searchUserProfiles:', error);
      throw error;
    }
  }

  /**
   * Get user profiles by proficiency level
   */
  static async getUserProfilesByLevel(level: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('level', level)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user profiles by level:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserProfilesByLevel:', error);
      throw error;
    }
  }

  /**
   * Get user profiles by learning area
   */
  static async getUserProfilesByLearningArea(learningArea: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .contains('subjects', [learningArea])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user profiles by learning area:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserProfilesByLearningArea:', error);
      throw error;
    }
  }

  /**
   * Update user's last active timestamp
   */
  static async updateLastActive(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error updating last active:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error in updateLastActive:', error);
      throw error;
    }
  }
}
