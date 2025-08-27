# UniLingo User Profile Setup

This document explains how to set up the new user profile system in UniLingo, which collects additional user information after signup.

## 🗄️ Database Setup

### 1. Create User Profiles Table

Run the following SQL script in your Supabase SQL editor:

```sql
-- Create user profiles table to store additional user information
-- This table will be linked to the auth.users table via user_id

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    native_language VARCHAR(50) NOT NULL,
    study_subject VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### 2. Verify Table Creation

After running the SQL script, you should see:
- A new `user_profiles` table in your Supabase dashboard
- Row Level Security (RLS) enabled
- Policies created for user access control
- Proper permissions granted

## 🔄 New User Flow

### Before Profile Setup
1. User signs up with email/password
2. User is redirected to Profile Setup screen
3. User cannot access main app until profile is complete

### Profile Setup Screen
The Profile Setup screen collects:
- **Native Language**: 25+ language options
- **Field of Study**: 25+ academic subjects
- **Proficiency Level**: Beginner, Intermediate, or Expert

### After Profile Setup
1. Profile data is saved to `user_profiles` table
2. User is redirected to main Dashboard
3. Profile information is displayed in Settings tab

## 📱 New Files Added

### 1. `src/screens/ProfileSetupScreen.tsx`
- Complete profile setup form
- Language, subject, and proficiency selection
- Progress indicator
- Form validation

### 2. `src/lib/userProfileService.ts`
- Service class for profile operations
- CRUD operations for user profiles
- Profile completion checking
- Error handling

### 3. `setup_user_profiles.sql`
- SQL script for database setup
- Table creation with proper constraints
- RLS policies and permissions

## 🔧 Updated Files

### 1. `src/contexts/AuthContext.tsx`
- Added profile state management
- Profile fetching on auth state change
- Profile completion checking

### 2. `App.tsx`
- Added ProfileSetupScreen to navigation
- Profile completion routing logic
- Conditional rendering based on profile status

### 3. `src/screens/DashboardScreen.tsx`
- Display user profile information in Settings tab
- Profile details section with native language, study subject, and proficiency level

### 4. `src/screens/RegisterScreen.tsx`
- Simplified registration (removed name field)
- Cleaner UI and form handling

## 🚀 How It Works

### 1. User Registration
```typescript
// User signs up with email/password
const { error } = await signUp(email, password);
```

### 2. Profile Setup Check
```typescript
// App checks if user has completed profile
if (user && !profile) {
  // Show ProfileSetupScreen
} else if (user && profile) {
  // Show main app
}
```

### 3. Profile Creation
```typescript
// User fills out profile form
const profileData = {
  native_language: 'English',
  study_subject: 'Medicine',
  proficiency_level: 'beginner'
};

// Profile is saved to database
await UserProfileService.createUserProfile(userId, profileData);
```

### 4. Profile Display
```typescript
// Profile info is shown in Settings tab
<Text>Native Language: {profile.native_language}</Text>
<Text>Field of Study: {profile.study_subject}</Text>
<Text>Proficiency Level: {profile.proficiency_level}</Text>
```

## 🧪 Testing

### 1. Test New User Flow
1. Sign up with new email
2. Verify redirect to Profile Setup
3. Complete profile form
4. Verify redirect to Dashboard
5. Check Settings tab for profile info

### 2. Test Existing User Flow
1. Sign in with existing account
2. Verify direct access to Dashboard
3. Check Settings tab for profile info

### 3. Test Profile Updates
1. Navigate to Settings
2. Verify profile information is displayed
3. Check that profile data persists

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only access their own profile
- **Policy-based Access**: Granular control over CRUD operations
- **User ID Linking**: Profiles are linked to auth.users via user_id
- **Cascade Deletion**: Profile is deleted when user account is deleted

## 📊 Database Schema

```sql
user_profiles
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key to auth.users)
├── native_language (VARCHAR(50))
├── study_subject (VARCHAR(100))
├── proficiency_level (VARCHAR(20))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🚨 Troubleshooting

### Common Issues

1. **Profile not saving**
   - Check RLS policies are enabled
   - Verify user authentication
   - Check console for error messages

2. **Profile not loading**
   - Verify table exists in Supabase
   - Check RLS policies
   - Verify user permissions

3. **Navigation issues**
   - Check profile completion logic
   - Verify routing configuration
   - Check console logs

### Debug Commands

```typescript
// Check profile status
console.log('User:', user?.id);
console.log('Profile:', profile);

// Check profile completion
const status = await UserProfileService.getProfileCompletionStatus(userId);
console.log('Profile Status:', status);
```

## 🔮 Future Enhancements

- Profile editing capabilities
- Profile picture upload
- Additional profile fields
- Profile sharing options
- Profile analytics and insights


