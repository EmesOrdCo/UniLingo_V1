// Centralized logging utility for UniLingo
// Controls log verbosity and provides consistent formatting

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO; // Default to INFO level
  private isDevelopment: boolean = __DEV__;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isDevelopment && level <= this.logLevel;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  // Special methods for common patterns
  auth(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`🔐 ${message}`, ...args);
    }
  }

  navigation(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`🧭 ${message}`, ...args);
    }
  }

  api(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`🌐 ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  // Disable all logging (useful for production)
  disable(): void {
    this.logLevel = LogLevel.ERROR;
  }

  // Enable debug logging
  enableDebug(): void {
    this.logLevel = LogLevel.DEBUG;
  }
}

export const logger = Logger.getInstance();

// Export convenience methods
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logAuth = (message: string, ...args: any[]) => logger.auth(message, ...args);
export const logNavigation = (message: string, ...args: any[]) => logger.navigation(message, ...args);
export const logApi = (message: string, ...args: any[]) => logger.api(message, ...args);
export const logSuccess = (message: string, ...args: any[]) => logger.success(message, ...args);
