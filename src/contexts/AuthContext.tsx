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

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        // For sign in, we'll let fetchUserProfile handle the isNewUser flag
        // since this is an existing user, they should have a profile
        if (user?.id) {
          // Fetch user profile after successful sign in
          await fetchUserProfile(user.id);
        }
      }

      return { error };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('🚀 Starting sign up process for:', email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!error) {
        console.log('✅ Sign up successful, setting isNewUser = true');
        setIsNewUser(true); // Set flag to true if sign up is successful
      } else {
        console.log('❌ Sign up failed:', error);
      }

      return { error };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setIsNewUser(false); // Clear new user flag on sign out
      console.log('👋 User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return { error };
    }
  };

  const createTestUser = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123',
      });

      if (error) {
        console.error('❌ Error creating test user:', error);
      } else {
        console.log('✅ Test user created successfully');
      }
    } catch (error) {
      console.error('❌ Error creating test user:', error);
    }
  };

  const clearNewUserFlag = () => {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

