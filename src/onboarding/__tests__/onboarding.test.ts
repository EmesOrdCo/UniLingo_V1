import { validateStep, validateCompleteOnboarding } from '../schema';
import { useOnboardingStore } from '../state';

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Onboarding System', () => {
  describe('Validation Schemas', () => {
    it('should validate language selection correctly', () => {
      const validData = {
        nativeLanguage: 'English',
        targetLanguages: ['Spanish', 'French'],
      };
      
      const result = validateStep(0, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid language selection', () => {
      const invalidData = {
        nativeLanguage: '',
        targetLanguages: [],
      };
      
      const result = validateStep(0, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate email correctly', () => {
      const validData = {
        email: 'test@example.com',
      };
      
      const result = validateStep(6, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
      };
      
      const result = validateStep(6, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors?.email).toBeDefined();
    });

    it('should validate complete onboarding data', () => {
      const completeData = {
        nativeLanguage: 'English',
        targetLanguages: ['Spanish'],
        name: 'John Doe',
        email: 'john@example.com',
        age: '25-34',
        timeCommitment: '15 min / day',
        currentLevel: 'I know the basics',
        learningGoals: ['Have conversations'],
        notificationsEnabled: true,
        selectedPlan: 'yearly',
        trialStarted: false,
      };
      
      const result = validateCompleteOnboarding(completeData);
      expect(result.success).toBe(true);
    });
  });

  describe('Onboarding Store', () => {
    beforeEach(() => {
      // Reset store state before each test
      useOnboardingStore.getState().resetOnboarding();
    });

    it('should initialize with default values', () => {
      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.isCompleted).toBe(false);
      expect(state.nativeLanguage).toBe('');
    });

    it('should update fields correctly', () => {
      const { updateField } = useOnboardingStore.getState();
      
      updateField('name', 'John Doe');
      updateField('email', 'john@example.com');
      
      const state = useOnboardingStore.getState();
      expect(state.name).toBe('John Doe');
      expect(state.email).toBe('john@example.com');
    });

    it('should navigate steps correctly', () => {
      const { nextStep, previousStep, goToStep } = useOnboardingStore.getState();
      
      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);
      
      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
      
      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);
      
      goToStep(5);
      expect(useOnboardingStore.getState().currentStep).toBe(5);
    });

    it('should mark steps as completed', () => {
      const { markStepCompleted, isStepCompleted } = useOnboardingStore.getState();
      
      markStepCompleted(0);
      markStepCompleted(1);
      
      expect(isStepCompleted(0)).toBe(true);
      expect(isStepCompleted(1)).toBe(true);
      expect(isStepCompleted(2)).toBe(false);
    });

    it('should calculate progress correctly', () => {
      const { markStepCompleted, getProgressPercentage } = useOnboardingStore.getState();
      
      markStepCompleted(0);
      markStepCompleted(1);
      markStepCompleted(2);
      
      const progress = getProgressPercentage();
      expect(progress).toBe(25); // 3 out of 12 steps = 25%
    });
  });
});

