# Supabase Onboarding Integration

This document outlines the complete integration of the onboarding flow with Supabase database.

## ✅ **Files Created/Updated**

### **Core Dependencies**
- `@supabase/supabase-js` - Supabase client library
- `zod` - Schema validation
- `@types/react` & `@types/react-native` - TypeScript types

### **Core Files**
1. **`src/lib/supabase.ts`** - Supabase client configuration
2. **`src/lib/auth.ts`** - Authentication functions (signUp, signIn, signOut)
3. **`src/lib/users.ts`** - User data types and database operations
4. **`src/onboarding/useOnboardingStore.ts`** - Client-side state management
5. **`src/onboarding/actions.ts`** - Onboarding action functions
6. **`src/onboarding/guards.ts`** - Navigation guards for onboarding flow
7. **`src/types/global.d.ts`** - TypeScript environment declarations

### **Example Files**
8. **`src/screens/examples/OnboardingExamples.tsx`** - Example onboarding screens
9. **`src/screens/examples/Home.tsx`** - Example home screen

### **Environment**
10. **`.env`** - Updated with Supabase configuration

## 🗄️ **Database Schema Requirements**

Your Supabase `public.users` table should have these columns:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  native_language TEXT,
  target_language TEXT,
  subjects TEXT[],
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  aim TEXT,
  time_commit TEXT,
  how_did_you_hear TEXT,
  payment_tier TEXT,
  reminders_opt_in BOOLEAN
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 🔧 **Environment Variables**

Your `.env` file should contain:

```env
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional defaults
EXPO_PUBLIC_DEFAULT_PAYMENT_TIER=free
```

## 🚀 **Usage Examples**

### **1. Basic Onboarding Flow**

```typescript
import { setLanguages, setLevel, setTimeCommit, createAccount } from '../onboarding/actions';

// Set languages
await setLanguages("English", "Spanish");

// Set proficiency level
await setLevel("Beginner");

// Set time commitment
await setTimeCommit("15 min/day");

// Create user account
await createAccount("John Doe", "john@example.com", "password123");
```

### **2. Check Onboarding Status**

```typescript
import { getMyUser, isOnboardingIncomplete } from '../lib/users';

const user = await getMyUser();
const needsOnboarding = isOnboardingIncomplete(user);

if (needsOnboarding) {
  // Navigate to onboarding
  navigation.navigate('Onboarding');
} else {
  // Navigate to main app
  navigation.navigate('Home');
}
```

### **3. Navigation Guards**

```typescript
import { requireOnboardingOrHome } from '../onboarding/guards';

// After app startup
await requireOnboardingOrHome((route) => {
  navigation.navigate(route);
});
```

## 📱 **Integration with Existing UI**

To integrate with your existing `OnboardingFlowScreen.tsx`:

1. **Replace the current `handleComplete` function** with calls to the new action functions
2. **Use the new `UserRow` type** for type safety
3. **Implement the navigation guards** in your main app component

### **Example Integration**

```typescript
// In your OnboardingFlowScreen.tsx
import { createAccount, setLanguages, setLevel, setTimeCommit } from '../onboarding/actions';

const handleComplete = async () => {
  try {
    // Create account
    await createAccount(formData.firstName, formData.email, formData.password);
    
    // Set onboarding data
    await setLanguages(formData.nativeLanguage, formData.targetLanguage);
    await setLevel(formData.proficiency);
    await setTimeCommit(formData.timeCommitment);
    
    // Navigate to main app
    navigation.replace('Home');
  } catch (error) {
    console.error('Onboarding failed:', error);
    Alert.alert('Error', 'Failed to complete onboarding');
  }
};
```

## 🔒 **Security Features**

- **Row Level Security (RLS)** - Users can only access their own data
- **Authentication Required** - All operations require valid user session
- **Type Safety** - Full TypeScript support with proper types
- **Input Validation** - Zod schemas for data validation (optional)

## 🧪 **Testing**

Use the example screens in `src/screens/examples/` to test the integration:

1. **LanguagesScreen** - Test language selection
2. **LevelScreen** - Test proficiency level
3. **TimeCommitScreen** - Test time commitment
4. **CreateAccountScreen** - Test account creation
5. **Home** - Test user data retrieval

## 🚨 **Important Notes**

1. **Restart Development Server** - After updating `.env`, run `npx expo start -c`
2. **Database Schema** - Ensure your Supabase table matches the expected schema
3. **RLS Policies** - Verify Row Level Security is properly configured
4. **Error Handling** - Implement proper error handling in your UI
5. **Type Safety** - Use the provided TypeScript types for better development experience

## 🔄 **Migration from Existing Code**

If you have existing onboarding code:

1. **Keep your UI components** - The new system works with existing React Native components
2. **Replace data persistence** - Use the new action functions instead of direct Supabase calls
3. **Update types** - Use the new `UserRow` and `OnboardingData` types
4. **Test thoroughly** - Verify all onboarding steps work correctly

## 📞 **Support**

If you encounter issues:

1. Check Supabase dashboard for database errors
2. Verify environment variables are set correctly
3. Ensure RLS policies are configured properly
4. Check browser/app console for error messages
5. Test with the example screens first

The integration is now complete and ready for use! 🎉
