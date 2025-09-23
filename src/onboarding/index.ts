// Main onboarding components

// State management
export { 
  useOnboardingStore, 
  useOnboardingProgress, 
  useOnboardingData, 
  useOnboardingActions,
  TOTAL_ONBOARDING_STEPS 
} from './state';

// Validation schemas
export { 
  validateStep, 
  validateCompleteOnboarding,
  LANGUAGE_OPTIONS,
  AGE_OPTIONS,
  TIME_COMMITMENT_OPTIONS,
  LEVEL_OPTIONS,
  LEARNING_GOALS_OPTIONS,
  HEAR_ABOUT_OPTIONS,
  SUBSCRIPTION_PLANS,
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
export type { 
  LanguageSelectionData,
  TimeCommitmentData,
  AgeData,
  CurrentLevelData,
  LearningGoalsData,
  EmailData,
  NameData,
  NotificationsData,
  SubscriptionPlanData,
  TrialOfferData,
  CompleteOnboardingData,
} from './schema';

