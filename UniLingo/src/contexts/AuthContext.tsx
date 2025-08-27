import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserProfileService, UserProfile } from '../lib/userProfileService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  isNewUser: boolean; // Added to track if user just signed up
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  createTestUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearNewUserFlag: () => void; // Added to clear the flag after profile setup
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false); // State for new user flag

  useEffect(() => {
    // Debug table structure on app start
    UserProfileService.debugTableStructure();

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session ? 'Session found' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // For existing sessions, fetch profile and clear new user flag if profile exists
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, session ? 'Session updated' : 'Session cleared');
      console.log('👤 User:', session?.user?.email || 'No user');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If user is authenticated, fetch their profile
      if (session?.user) {
        // Don't clear isNewUser flag here - let it persist for new users
        // Only clear it if we find an existing profile
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setIsNewUser(false); // Clear new user flag when no user
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const userProfile = await UserProfileService.getUserProfile(userId);
      setProfile(userProfile);
      
      // If we found an existing profile, clear the new user flag
      if (userProfile) {
        setIsNewUser(false);
        console.log('📋 Existing profile found, clearing new user flag');
      } else {
        console.log('📋 No existing profile found, keeping new user flag if set');
      }
      
      console.log('📋 User profile fetched:', userProfile ? 'Profile found' : 'No profile');
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        return { error };
      }

      console.log('✅ Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('📝 Attempting sign up for:', email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign up error:', error.message);
        return { error };
      }

      console.log('✅ Sign up successful, setting new user flag');
      setIsNewUser(true); // Set flag for new user
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error.message);
      } else {
        console.log('✅ Sign out successful');
        setProfile(null);
        setIsNewUser(false); // Clear new user flag on sign out
      }
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔑 Attempting password reset for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'unilingo://reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error.message);
        return { error };
      }

      console.log('✅ Password reset email sent');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected password reset error:', error);
      return { error };
    }
  };

  const createTestUser = async () => {
    try {
      console.log('🧪 Creating test user...');
      const testEmail = 'test@example.com';
      const testPassword = 'testpassword123';

      // First try to sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signUpError && !signUpError.message.includes('already registered')) {
        console.error('❌ Test user sign up error:', signUpError.message);
        return;
      }

      // Then try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.error('❌ Test user sign in error:', signInError.message);
        return;
      }

      console.log('✅ Test user created and signed in successfully');
      setIsNewUser(true); // Set flag for new test user
    } catch (error) {
      console.error('❌ Error creating test user:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const clearNewUserFlag = () => {
    console.log('🚩 Clearing new user flag');
    setIsNewUser(false);
  };

  const value = {
    user,
    session,
    loading,
    profile,
    profileLoading,
    isNewUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    createTestUser,
    refreshProfile,
    clearNewUserFlag,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}





