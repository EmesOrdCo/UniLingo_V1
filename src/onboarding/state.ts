import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import { AgeRange, DiscoverySource } from './constants';

// Onboarding step definitions
export const TOTAL_ONBOARDING_STEPS = 12; // 10 child + 2 parent screens

// Step indices
export const CHILD_ONBOARDING_STEPS = {
  LANGUAGE_SELECTION: 0,
  TIME_COMMITMENT: 1,
  AGE: 2,
  CURRENT_LEVEL: 3,
  LEARNING_GOALS: 4,
  HOW_DID_YOU_HEAR: 5,
  EMAIL: 6,
  NAME: 7,
  NOTIFICATIONS: 8,
} as const;

export const PARENT_ONBOARDING_STEPS = {
  PLANS: 9,
  TRIAL_OFFER: 10,
} as const;

// Onboarding data interface
export type OnboardingData = {
  nativeLanguage?: string;
  targetLanguage?: string;
  goals: string[];
  proficiency?: 'none' | 'basic' | 'advanced';
  dailyCommitmentMinutes?: 5 | 15 | 30 | 60;
  wantsNotifications?: boolean;
  ageRange?: AgeRange;
  discoverySource?: DiscoverySource;
  firstName?: string;
  email?: string;
  selectedPlanId?: 'annual' | 'lifetime';
  hasActiveSubscription?: boolean;
};

// Onboarding state interface
export interface OnboardingState {
  // Current state
  currentStep: number;
  isCompleted: boolean;
  data: OnboardingData;
  
  // Step completion tracking
  completedSteps: Set<number>;
  
  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void;
  toggleGoal: (key: string) => void;
  markStepCompleted: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  getProgressPercentage: () => number;
  getData: () => OnboardingData;
  completeOnboarding: () => void;
  reset: () => void;
  hydrateFromStorage: () => Promise<void>;
  persistToStorage: () => Promise<void>;
}

// Default onboarding data
const defaultOnboardingData: OnboardingData = {
  goals: [],
  wantsNotifications: true,
  hasActiveSubscription: false,
};

// Debounced persist function
const debouncedPersist = debounce(async (data: OnboardingData, isCompleted: boolean) => {
  try {
    await AsyncStorage.setItem('onboarding:v1:data', JSON.stringify(data));
    await AsyncStorage.setItem('onboarding:v1:complete', JSON.stringify(isCompleted));
  } catch (error) {
    console.error('Failed to persist onboarding data:', error);
  }
}, 500);

// Create the onboarding store
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      isCompleted: false,
      data: defaultOnboardingData,
      completedSteps: new Set(),
      
      // Navigation actions
      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < TOTAL_ONBOARDING_STEPS - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },
      
      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      goToStep: (step: number) => {
        if (step >= 0 && step < TOTAL_ONBOARDING_STEPS) {
          set({ currentStep: step });
        }
      },
      
      // Data update actions
      setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
        set((state) => {
          const newData = {
            ...state.data,
            [field]: value,
          };
          
          // Debounced persist
          debouncedPersist(newData, state.isCompleted);
          
          return { data: newData };
        });
      },
      
      // Goal management with max 3 constraint
      toggleGoal: (key: string) => {
        set((state) => {
          const currentGoals = state.data.goals || [];
          const newGoals = currentGoals.includes(key)
            ? currentGoals.filter(goal => goal !== key)
            : currentGoals.length < 3
              ? [...currentGoals, key]
              : currentGoals; // Don't add if already at max
          
          const newData = {
            ...state.data,
            goals: newGoals,
          };
          
          // Debounced persist
          debouncedPersist(newData, state.isCompleted);
          
          return { data: newData };
        });
      },
      
      // Step completion tracking
      markStepCompleted: (step: number) => {
        set((state) => {
          const newCompletedSteps = new Set(state.completedSteps);
          newCompletedSteps.add(step);
          return { completedSteps: newCompletedSteps };
        });
      },
      
      isStepCompleted: (step: number) => {
        return get().completedSteps.has(step);
      },
      
      // Progress calculation
      getProgressPercentage: () => {
        const { completedSteps } = get();
        return Math.round((completedSteps.size / TOTAL_ONBOARDING_STEPS) * 100);
      },
      
      // Data access
      getData: () => {
        return get().data;
      },
      
      // Completion actions
      completeOnboarding: () => {
        set({ isCompleted: true, currentStep: TOTAL_ONBOARDING_STEPS });
        // Persist completion status
        debouncedPersist(get().data, true);
      },
      
      reset: () => {
        set({
          currentStep: 0,
          isCompleted: false,
          data: defaultOnboardingData,
          completedSteps: new Set(),
        });
        // Clear storage
        AsyncStorage.multiRemove(['onboarding:v1:data', 'onboarding:v1:complete']);
      },
      
      // Storage management
      hydrateFromStorage: async () => {
        try {
          const [dataStr, completeStr] = await AsyncStorage.multiGet([
            'onboarding:v1:data',
            'onboarding:v1:complete'
          ]);
          
          const data = dataStr[1] ? JSON.parse(dataStr[1]) : defaultOnboardingData;
          const isCompleted = completeStr[1] ? JSON.parse(completeStr[1]) : false;
          
          set({ data, isCompleted });
        } catch (error) {
          console.error('Failed to hydrate onboarding data:', error);
        }
      },
      
      persistToStorage: async () => {
        const { data, isCompleted } = get();
        await debouncedPersist(data, isCompleted);
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
        data: state.data,
        completedSteps: Array.from(state.completedSteps),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert completedSteps array back to Set
          state.completedSteps = new Set(state.completedSteps as any);
        }
      },
    }
  )
);

// Selectors for common use cases
export const useOnboardingData = () => useOnboardingStore((state) => state.data);
export const useOnboardingProgress = () => useOnboardingStore((state) => ({
  currentStep: state.currentStep,
  totalSteps: TOTAL_ONBOARDING_STEPS,
  progress: state.getProgressPercentage(),
  isCompleted: state.isCompleted,
}));
export const useOnboardingNavigation = () => useOnboardingStore((state) => ({
  nextStep: state.nextStep,
  previousStep: state.previousStep,
  goToStep: state.goToStep,
  canGoNext: state.currentStep < TOTAL_ONBOARDING_STEPS - 1,
  canGoPrevious: state.currentStep > 0,
}));

// Additional selectors
export const useOnboardingGoals = () => useOnboardingStore((state) => ({
  goals: state.data.goals || [],
  toggleGoal: state.toggleGoal,
  canAddMore: (state.data.goals || []).length < 3,
}));

export const useOnboardingField = <K extends keyof OnboardingData>(field: K) => 
  useOnboardingStore((state) => ({
    value: state.data[field],
    setValue: (value: OnboardingData[K]) => state.setField(field, value),
  }));