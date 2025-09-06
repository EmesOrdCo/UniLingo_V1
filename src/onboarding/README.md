# Onboarding System

A complete, theme-matched onboarding system for UniLingo with two stacks: ChildOnboardingStack (10 Babbel-style screens) and ParentOnboardingStack (2 paywall screens).

## Features

- ✅ **Theme-matched**: Uses existing app colors, spacing, and typography
- ✅ **State Management**: Zustand with AsyncStorage persistence
- ✅ **Validation**: Zod schemas for all form inputs
- ✅ **Billing Integration**: MockBillingClient interface (ready for real billing)
- ✅ **TypeScript**: Fully typed with comprehensive interfaces
- ✅ **Accessibility**: Proper touch targets and screen reader support

## Quick Start

### 1. Import and Use in Your App

```tsx
import { OnboardingGate } from './src/onboarding';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <OnboardingGate 
        onComplete={() => setShowOnboarding(false)} 
      />
    );
  }

  return <YourMainApp />;
}
```

### 2. Check Onboarding Status

```tsx
import { useOnboardingStore } from './src/onboarding';

function MyComponent() {
  const { isCompleted, currentStep } = useOnboardingStore();
  
  if (!isCompleted) {
    return <OnboardingGate />;
  }
  
  return <YourMainContent />;
}
```

## Architecture

### State Management (`state.ts`)
- **Zustand store** with AsyncStorage persistence
- **12 total steps**: 10 child + 2 parent screens
- **Progress tracking** with completion percentage
- **Data validation** at each step

### Validation (`schema.ts`)
- **Zod schemas** for each step
- **Type-safe** validation with error messages
- **Step-by-step** and complete validation functions

### Billing (`billing.ts`)
- **BillingClient interface** for subscription management
- **MockBillingClient** for development/testing
- **Ready for integration** with real billing providers

### Theme System (`../theme/useThemeTokens.ts`)
- **Extracted tokens** from existing app design
- **Consistent colors, spacing, typography**
- **No new design tokens** - reuses existing values

## Screens

### ChildOnboardingStack (Steps 0-8)
1. **Language Selection** - Native language + target languages
2. **Time Commitment** - Daily learning time preference
3. **Age** - Age range selection
4. **Current Level** - Existing knowledge level
5. **Learning Goals** - What user wants to achieve
6. **How Did You Hear** - Marketing attribution
7. **Email** - User email address
8. **Name** - User's first name
9. **Notifications** - Permission for learning reminders

### ParentOnboardingStack (Steps 9-10)
10. **Plans** - Subscription plan selection
11. **Trial Offer** - Free trial or skip option

## Usage Examples

### Access Onboarding Data

```tsx
import { useOnboardingData } from './src/onboarding';

function ProfileComponent() {
  const data = useOnboardingData();
  
  return (
    <View>
      <Text>Name: {data.name}</Text>
      <Text>Email: {data.email}</Text>
      <Text>Learning: {data.targetLanguages.join(', ')}</Text>
    </View>
  );
}
```

### Track Progress

```tsx
import { useOnboardingProgress } from './src/onboarding';

function ProgressBar() {
  const { progress, currentStep, totalSteps } = useOnboardingProgress();
  
  return (
    <View>
      <Text>Step {currentStep + 1} of {totalSteps}</Text>
      <ProgressBar progress={progress} />
    </View>
  );
}
```

### Validate Data

```tsx
import { validateStep, validateCompleteOnboarding } from './src/onboarding';

// Validate individual step
const result = validateStep(0, { nativeLanguage: 'English', targetLanguages: ['Spanish'] });
if (!result.success) {
  console.log('Validation errors:', result.errors);
}

// Validate complete onboarding
const completeResult = validateCompleteOnboarding(allData);
if (completeResult.success) {
  // Ready to proceed
}
```

## Customization

### Adding New Steps
1. Add screen component to appropriate stack
2. Update `TOTAL_ONBOARDING_STEPS` in `state.ts`
3. Add validation schema in `schema.ts`
4. Update step navigation logic

### Modifying Theme
The theme system reads from your existing app design. To modify:
1. Update colors/spacing in your main app
2. The `useThemeTokens` hook will automatically reflect changes
3. No need to modify onboarding-specific theme files

### Billing Integration
Replace `MockBillingClient` with real implementation:

```tsx
import { BillingClient } from './src/onboarding';

class RealBillingClient implements BillingClient {
  async initialize() {
    // Initialize your billing SDK
  }
  
  async purchasePlan(planId: string) {
    // Handle real purchase
  }
  
  // ... implement other methods
}

export const billingClient: BillingClient = new RealBillingClient();
```

## Testing

Run the included tests:

```bash
npm test src/onboarding/__tests__/onboarding.test.ts
```

Tests cover:
- Validation schemas
- State management
- Step navigation
- Progress calculation

## File Structure

```
src/onboarding/
├── components/           # Reusable UI components
│   ├── OnboardingLayout.tsx
│   ├── OnboardingButton.tsx
│   └── OnboardingOption.tsx
├── screens/             # Individual onboarding screens
│   ├── LanguageSelectionScreen.tsx
│   ├── TimeCommitmentScreen.tsx
│   ├── AgeScreen.tsx
│   ├── CurrentLevelScreen.tsx
│   ├── LearningGoalsScreen.tsx
│   ├── HowDidYouHearScreen.tsx
│   ├── EmailScreen.tsx
│   ├── NameScreen.tsx
│   ├── NotificationsScreen.tsx
│   ├── PlansScreen.tsx
│   └── TrialOfferScreen.tsx
├── ChildOnboardingStack.tsx    # 10 child screens
├── ParentOnboardingStack.tsx   # 2 parent screens
├── OnboardingGate.tsx          # Main entry point
├── state.ts                    # Zustand state management
├── schema.ts                   # Zod validation schemas
├── billing.ts                  # Billing client interface
├── index.ts                    # Exports
└── __tests__/                  # Unit tests
    └── onboarding.test.ts
```

## Integration Notes

- **No modifications** to existing app navigation required
- **Drop-in replacement** for current onboarding
- **Persistence** handled automatically via AsyncStorage
- **Type-safe** throughout with comprehensive TypeScript support
- **Accessible** with proper touch targets and screen reader support

