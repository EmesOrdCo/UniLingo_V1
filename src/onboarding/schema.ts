import { z } from 'zod';
import { LanguageCode, TargetLanguageCode, GoalKey, ProficiencyLevel, TimeCommitment, AgeRange, DiscoverySource } from './constants';

// Language validation schemas
export const zNativeTarget = z.object({
  nativeLanguage: z.string().min(1, 'Please select your native language'),
  targetLanguage: z.string().min(1, 'Please select a target language'),
});

// Goals validation (1-3 goals required)
export const zGoals = z.object({
  goals: z.array(z.string())
    .min(1, 'Please select at least one learning goal')
    .max(3, 'You can select up to 3 learning goals'),
});

// Proficiency level validation
export const zProficiency = z.object({
  proficiency: z.enum(['none', 'basic', 'advanced'], {
    required_error: 'Please select your proficiency level',
  }),
});

// Time commitment validation
export const zCommitment = z.object({
  dailyCommitmentMinutes: z.enum([5, 15, 30, 60], {
    required_error: 'Please select your daily commitment',
  }),
});

// Age range validation
export const zAgeRange = z.object({
  ageRange: z.enum([
    'under_18',
    '18_24', 
    '25_34',
    '35_44',
    '45_54',
    '55_64',
    '65_plus'
  ], {
    required_error: 'Please select your age range',
  }),
});

// Discovery source validation
export const zDiscovery = z.object({
  discoverySource: z.enum([
    'facebook_instagram',
    'search',
    'podcast',
    'tv',
    'friends_family',
    'youtube',
    'app_store',
    'website_ad',
    'radio',
    'other'
  ], {
    required_error: 'Please select how you heard about us',
  }),
});

// Name validation (trimmed, 1-50 characters)
export const zName = z.object({
  firstName: z.string()
    .trim()
    .min(1, 'Please enter your first name')
    .max(50, 'Name must be 50 characters or less'),
});

// Email validation
export const zEmail = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Please enter your email address'),
});

// Final comprehensive schema combining all fields
export const zFinal = z.object({
  nativeLanguage: z.string().min(1, 'Native language is required'),
  targetLanguage: z.string().min(1, 'Target language is required'),
  goals: z.array(z.string())
    .min(1, 'At least one learning goal is required')
    .max(3, 'Maximum 3 learning goals allowed'),
  proficiency: z.enum(['none', 'basic', 'advanced'], {
    required_error: 'Proficiency level is required',
  }),
  dailyCommitmentMinutes: z.enum([5, 15, 30, 60], {
    required_error: 'Daily commitment is required',
  }),
  wantsNotifications: z.boolean().optional(),
  ageRange: z.enum([
    'under_18',
    '18_24',
    '25_34', 
    '35_44',
    '45_54',
    '55_64',
    '65_plus'
  ], {
    required_error: 'Age range is required',
  }),
  discoverySource: z.enum([
    'facebook_instagram',
    'search',
    'podcast',
    'tv',
    'friends_family',
    'youtube',
    'app_store',
    'website_ad',
    'radio',
    'other'
  ], {
    required_error: 'Discovery source is required',
  }),
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'Name must be 50 characters or less'),
  email: z.string()
    .email('Valid email address is required')
    .min(1, 'Email address is required'),
  selectedPlanId: z.enum(['annual', 'lifetime']).optional(),
  hasActiveSubscription: z.boolean().optional(),
});

// Screen-specific validation schemas
const screenSchemas = {
  'language-selection': zNativeTarget,
  'time-commitment': zCommitment,
  'age': zAgeRange,
  'current-level': zProficiency,
  'learning-goals': zGoals,
  'how-did-you-hear': zDiscovery,
  'email': zEmail,
  'name': zName,
  'notifications': z.object({
    wantsNotifications: z.boolean(),
  }),
  'plans': z.object({
    selectedPlanId: z.enum(['annual', 'lifetime'], {
      required_error: 'Please select a plan',
    }),
  }),
  'trial-offer': z.object({
    hasActiveSubscription: z.boolean(),
  }),
} as const;

// Validation result type
export type ValidationResult = {
  valid: boolean;
  errors?: Record<string, string>;
};

// Helper function to validate individual screens
export function validateScreen(screenName: keyof typeof screenSchemas, data: any): ValidationResult {
  try {
    const schema = screenSchemas[screenName];
    if (!schema) {
      return {
        valid: false,
        errors: { general: `Unknown screen: ${screenName}` },
      };
    }

    schema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        valid: false,
        errors,
      };
    }
    
    return {
      valid: false,
      errors: { general: 'Validation failed' },
    };
  }
}

// Helper function to validate complete onboarding data
export function validateCompleteOnboarding(data: any): ValidationResult {
  try {
    zFinal.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return {
        valid: false,
        errors,
      };
    }
    
    return {
      valid: false,
      errors: { general: 'Complete validation failed' },
    };
  }
}

// Helper function to get field-specific validation
export function validateField(fieldName: string, value: any): ValidationResult {
  try {
    let schema: z.ZodSchema;
    
    switch (fieldName) {
      case 'nativeLanguage':
      case 'targetLanguage':
        schema = z.string().min(1, `${fieldName} is required`);
        break;
      case 'goals':
        schema = z.array(z.string())
          .min(1, 'At least one goal is required')
          .max(3, 'Maximum 3 goals allowed');
        break;
      case 'proficiency':
        schema = z.enum(['none', 'basic', 'advanced'], {
          required_error: 'Proficiency level is required',
        });
        break;
      case 'dailyCommitmentMinutes':
        schema = z.enum([5, 15, 30, 60], {
          required_error: 'Daily commitment is required',
        });
        break;
      case 'ageRange':
        schema = z.enum([
          'under_18', '18_24', '25_34', '35_44', 
          '45_54', '55_64', '65_plus'
        ], {
          required_error: 'Age range is required',
        });
        break;
      case 'discoverySource':
        schema = z.enum([
          'facebook_instagram', 'search', 'podcast', 'tv',
          'friends_family', 'youtube', 'app_store', 
          'website_ad', 'radio', 'other'
        ], {
          required_error: 'Discovery source is required',
        });
        break;
      case 'firstName':
        schema = z.string()
          .trim()
          .min(1, 'First name is required')
          .max(50, 'Name must be 50 characters or less');
        break;
      case 'email':
        schema = z.string()
          .email('Valid email address is required')
          .min(1, 'Email address is required');
        break;
      case 'wantsNotifications':
        schema = z.boolean();
        break;
      case 'selectedPlanId':
        schema = z.enum(['annual', 'lifetime'], {
          required_error: 'Please select a plan',
        });
        break;
      case 'hasActiveSubscription':
        schema = z.boolean();
        break;
      default:
        return {
          valid: false,
          errors: { [fieldName]: `Unknown field: ${fieldName}` },
        };
    }
    
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        errors[fieldName] = err.message;
      });
      return {
        valid: false,
        errors,
      };
    }
    
    return {
      valid: false,
      errors: { [fieldName]: 'Validation failed' },
    };
  }
}

// Export all schemas for direct use if needed
export {
  zNativeTarget,
  zGoals,
  zProficiency,
  zCommitment,
  zAgeRange,
  zDiscovery,
  zName,
  zEmail,
  zFinal,
};