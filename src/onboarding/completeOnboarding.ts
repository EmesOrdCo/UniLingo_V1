import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { OnboardingData } from './state';

const ONBOARDING_COMPLETE_KEY = 'onboarding:v1:complete';

export interface OnboardingCompletionResult {
  ok: true;
}

export interface OnboardingCompletionError {
  ok: false;
  error: string;
}

export type OnboardingCompletionResponse = OnboardingCompletionResult | OnboardingCompletionError;

/**
 * Completes the onboarding process by:
 * 1. Marking onboarding as complete in AsyncStorage
 * 2. Optionally syncing data to Supabase if authenticated
 * 3. Returns success result
 */
export async function completeOnboarding({ 
  data 
}: { 
  data: OnboardingData 
}): Promise<OnboardingCompletionResponse> {
  try {
    if (__DEV__) {
      console.log('🎯 Completing onboarding with data:', data);
    }

    // 1. Mark onboarding as complete
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    if (__DEV__) {
      console.log('✅ Onboarding marked as complete');
    }

    // 2. Optionally sync to Supabase if available and authenticated
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        if (__DEV__) {
          console.log('ℹ️ No authenticated user, skipping Supabase sync');
        }
        return { ok: true };
      }

      if (__DEV__) {
        console.log('🔄 Syncing onboarding data to Supabase for user:', user.id);
      }

      // Map proficiency to valid level values
      const mapProficiencyToLevel = (proficiency: string | undefined) => {
        switch (proficiency) {
          case 'Beginner': return 'beginner';
          case 'Intermediate': return 'intermediate';
          case 'Advanced': return 'advanced';
          default: return null;
        }
      };

      // Upsert profile data
      const profileData = {
        id: user.id,
        name: data.firstName || '', // Use 'name' column instead of 'first_name'
        email: data.email || null,
        native_language: data.nativeLanguage || null,
        target_language: data.targetLanguage || null,
        level: mapProficiencyToLevel(data.proficiency) || null, // Map to valid level values
        subjects: [], // Initialize empty subjects array
        how_did_you_hear: data.discoverySource || null, // Use existing 'how_did_you_hear' column
        wants_notifications: data.wantsNotifications || false,
        payment_tier: null, // Let website handle plan selection
        has_active_subscription: false, // Set to false initially - will be updated after payment
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('users')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        if (__DEV__) {
          console.error('❌ Error upserting profile:', profileError);
        }
        // Don't fail onboarding for profile sync errors
      } else {
        if (__DEV__) {
          console.log('✅ Profile data synced to Supabase');
        }
      }

      // Upsert profile goals
      if (data.goals && data.goals.length > 0) {
        const goalInserts = data.goals.map(goal => ({
          user_id: user.id,
          goal_key: goal,
          created_at: new Date().toISOString(),
        }));

        // First, delete existing goals for this user
        const { error: deleteError } = await supabase
          .from('profile_goals')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          if (__DEV__) {
            console.error('❌ Error deleting existing goals:', deleteError);
          }
        }

        // Then insert new goals
        const { error: goalsError } = await supabase
          .from('profile_goals')
          .insert(goalInserts);

        if (goalsError) {
          if (__DEV__) {
            console.error('❌ Error inserting goals:', goalsError);
          }
          // Don't fail onboarding for goals sync errors
        } else {
          if (__DEV__) {
            console.log('✅ Profile goals synced to Supabase');
          }
        }
      }

    } catch (supabaseError) {
      if (__DEV__) {
        console.log('ℹ️ Supabase not available or error occurred, skipping sync:', supabaseError);
      }
      // Don't fail onboarding if Supabase sync fails
    }

    if (__DEV__) {
      console.log('🎉 Onboarding completed successfully');
    }
    return { ok: true };

  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error completing onboarding:', error);
    }
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Checks if onboarding has been completed
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const isComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return isComplete === 'true';
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error checking onboarding completion status:', error);
    }
    return false;
  }
}

/**
 * Resets onboarding completion status (useful for testing or re-onboarding)
 */
export async function resetOnboardingCompletion(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    if (__DEV__) {
      console.log('🔄 Onboarding completion status reset');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error resetting onboarding completion:', error);
    }
    throw error;
  }
}

