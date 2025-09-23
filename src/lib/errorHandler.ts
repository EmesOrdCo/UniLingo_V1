// React Native Error Handling Utility
// Provides safe error handling for production and development environments

interface ErrorHandlerOptions {
  showUserMessage?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Safely handle errors with appropriate logging and user feedback
   */
  handleError(
    error: Error | any,
    context: string = 'Unknown',
    options: ErrorHandlerOptions = {}
  ): string {
    const {
      showUserMessage = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred. Please try again.'
    } = options;

    // Log error safely in development only
    if (logError && __DEV__) {
      console.error(`❌ Error in ${context}:`, error);
    }

    // Return user-friendly error message
    if (showUserMessage) {
      if (error?.message) {
        // Return sanitized error message for user
        return this.sanitizeErrorMessage(error.message);
      }
      return fallbackMessage;
    }

    return '';
  }

  /**
   * Handle async operations with proper error catching
   */
  async safeAsync<T>(
    asyncOperation: () => Promise<T>,
    context: string = 'Async Operation',
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await asyncOperation();
    } catch (error) {
      this.handleError(error, context);
      return fallbackValue;
    }
  }

  /**
   * Sanitize error messages to remove sensitive information
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove common sensitive patterns
    const sensitivePatterns = [
      /password/gi,
      /token/gi,
      /key/gi,
      /secret/gi,
      /auth/gi,
      /credential/gi
    ];

    let sanitized = message;
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(sanitized)) {
        sanitized = 'An authentication error occurred. Please check your credentials.';
      }
    });

    return sanitized;
  }

  /**
   * Setup global error handling for React Native
   */
  setupGlobalErrorHandling(): void {
    // Override console.error to prevent error overlays
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      if (__DEV__) {
        originalConsoleError.apply(console, args);
      }
      // In production, silently handle errors
    };

    // Setup React Native ErrorUtils handler
    try {
      const ErrorUtils = require('ErrorUtils');
      const originalGlobalHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        if (__DEV__) {
          console.error('🚨 Global Error Handler:', error, 'isFatal:', isFatal);
        }
        // In production, silently handle the error to prevent crashes
      });
    } catch (error) {
      // ErrorUtils might not be available in all React Native versions
      if (__DEV__) {
        console.warn('ErrorUtils not available for global error handling');
      }
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: Error | any, context?: string, options?: ErrorHandlerOptions) => 
  errorHandler.handleError(error, context, options);

export const safeAsync = <T>(
  asyncOperation: () => Promise<T>,
  context?: string,
  fallbackValue?: T
) => errorHandler.safeAsync(asyncOperation, context, fallbackValue);

export const setupGlobalErrorHandling = () => errorHandler.setupGlobalErrorHandling();
