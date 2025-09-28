import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  native_language: string;
  target_language: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced';
  wants_notifications: boolean;
  discovery_source: string | null;
  selected_plan_id: string | null;
  has_active_subscription: boolean;
  subjects: string[]; // Legacy field for backward compatibility
  level: 'beginner' | 'intermediate' | 'expert'; // Legacy field
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface CreateProfileData {
  id?: string;
  email: string;
  name: string;
  native_language: string;
  target_language: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced';
  wants_notifications?: boolean;
  discovery_source?: string | null;
  selected_plan_id?: string | null;
  has_active_subscription?: boolean;
  // Legacy fields for backward compatibility
  learning_area?: string;
  subjects?: string[];
  level?: 'beginner' | 'intermediate' | 'expert';
}

export interface UpdateProfileData {
  name?: string;
  native_language?: string;
  target_language?: string;
  proficiency_level?: 'Beginner' | 'Intermediate' | 'Advanced';
  wants_notifications?: boolean;
  discovery_source?: string | null;
  selected_plan_id?: string | null;
  has_active_subscription?: boolean;
  // Legacy fields for backward compatibility
  learning_area?: string;
  subjects?: string[];
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
        .maybeSingle(); // Use maybeSingle() instead of single() for new users

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        console.log('📋 No user profile found for user:', userId);
        return null;
      }

      console.log('📋 User profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Create a new user profile
   */
  static async createUserProfile(profileData: CreateProfileData): Promise<UserProfile> {
    try {
      console.log('📝 Creating user profile with data:', profileData);
      
      // Get the current user from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const insertData = {
        id: profileData.id || user.id,
        email: profileData.email || user.email,
        name: profileData.name,
        native_language: profileData.native_language,
        target_language: profileData.target_language,
        // Only include fields that definitely exist in your database
        subjects: profileData.subjects || (profileData.learning_area ? [profileData.learning_area] : []),
        level: profileData.level || profileData.proficiency_level?.toLowerCase() as 'beginner' | 'intermediate' | 'expert',
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
      
      if (profileData.name !== undefined) {
        updateData.name = profileData.name;
      }
      
      if (profileData.native_language !== undefined) {
        updateData.native_language = profileData.native_language;
      }
      
      if (profileData.target_language !== undefined) {
        updateData.target_language = profileData.target_language;
      }
      
      if (profileData.proficiency_level !== undefined) {
        updateData.proficiency_level = profileData.proficiency_level;
        // Also update legacy level field for backward compatibility
        updateData.level = profileData.proficiency_level.toLowerCase();
      }
      
      
      if (profileData.wants_notifications !== undefined) {
        updateData.wants_notifications = profileData.wants_notifications;
      }
      
      if (profileData.discovery_source !== undefined) {
        updateData.discovery_source = profileData.discovery_source;
      }
      
      if (profileData.selected_plan_id !== undefined) {
        updateData.selected_plan_id = profileData.selected_plan_id;
      }
      
      if (profileData.has_active_subscription !== undefined) {
        updateData.has_active_subscription = profileData.has_active_subscription;
      }
      
      // Legacy field handling
      if (profileData.learning_area !== undefined) {
        updateData.subjects = [profileData.learning_area];
      }
      
      if (profileData.subjects !== undefined) {
        updateData.subjects = profileData.subjects;
      }
      
      if (profileData.level !== undefined) {
        updateData.level = profileData.level;
      }
      
      updateData.updated_at = new Date().toISOString();
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
   * Track onboarding step completion
   */
  static async trackOnboardingStep(userId: string, stepName: string, stepData?: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .insert({
          user_id: userId,
          step_name: stepName,
          step_data: stepData || null,
        });

      if (error) {
        console.error('❌ Error tracking onboarding step:', error);
        throw error;
      }

      console.log('✅ Onboarding step tracked:', stepName);
    } catch (error) {
      console.error('❌ Error tracking onboarding step:', error);
      throw error;
    }
  }

  /**
   * Get onboarding completion status
   */
  static async getOnboardingStatus(userId: string): Promise<{
    hasProfile: boolean;
    isComplete: boolean;
    completedSteps: string[];
    profile?: UserProfile;
  }> {
    try {
      // Get user profile
      const profile = await this.getUserProfile(userId);
      
      // Get completed onboarding steps
      const { data: steps, error: stepsError } = await supabase
        .from('onboarding_progress')
        .select('step_name')
        .eq('user_id', userId);

      if (stepsError) {
        console.error('❌ Error fetching onboarding steps:', stepsError);
        throw stepsError;
      }

      const completedSteps = steps?.map(step => step.step_name) || [];
      
      // Check if onboarding is complete
      const isComplete = !!(
        profile &&
        profile.native_language &&
        profile.target_language &&
        profile.proficiency_level &&
        profile.name
      );

      return {
        hasProfile: profile !== null,
        isComplete,
        completedSteps,
        profile: profile || undefined,
      };
    } catch (error) {
      console.error('❌ Error getting onboarding status:', error);
      return {
        hasProfile: false,
        isComplete: false,
        completedSteps: [],
      };
    }
  }

  /**
   * Check if user has completed profile setup
   */
  static async hasCompletedProfile(userId: string): Promise<boolean> {
    try {
      const status = await this.getOnboardingStatus(userId);
      return status.isComplete;
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
