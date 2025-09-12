// Logging configuration for UniLingo
// Set the desired log level here

import { LogLevel, logger } from '../lib/logger';

// Configure logging level
// LogLevel.ERROR = 0 (only errors)
// LogLevel.WARN = 1 (warnings and errors)  
// LogLevel.INFO = 2 (info, warnings, errors) - DEFAULT
// LogLevel.DEBUG = 3 (all logs)

// For production: Use LogLevel.ERROR or LogLevel.WARN
// For development: Use LogLevel.INFO (default)
// For debugging: Use LogLevel.DEBUG

logger.setLogLevel(LogLevel.INFO); // Change this to control verbosity

export { logger };
