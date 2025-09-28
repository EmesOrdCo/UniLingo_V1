// Main onboarding components

// State management
export { 
  useOnboardingStore, 
  useOnboardingProgress, 
  useOnboardingData, 
  useOnboardingNavigation,
  useOnboardingGoals,
  useOnboardingField,
  TOTAL_ONBOARDING_STEPS 
} from './state';

// Validation schemas
export { 
  validateScreen, 
  validateCompleteOnboarding,
  validateField,
} from './schema';

// Billing
export { 
  billingClient, 
  MockBillingClient,
  type BillingClient,
  type SubscriptionPlan,
  type PurchaseResult,
  type TrialResult,
  type SubscriptionStatus,
} from './billing';

// Theme
export { useThemeTokens, type ThemeTokens } from '../theme/useThemeTokens';

// Components
export { OnboardingLayout } from './components/OnboardingLayout';
export { OnboardingButton } from './components/OnboardingButton';
export { OnboardingOption } from './components/OnboardingOption';

// Types
export type { OnboardingData, OnboardingState } from './state';
export type { ValidationResult } from './schema';

