/**
 * Error Logger
 * Tracks and stores recent errors for monitoring
 */

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.errorTypes = {
      pronunciation: 0,
      openai: 0,
      azureOcr: 0,
      general: 0
    };
  }

  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || error.toString(),
      stack: error.stack,
      type: context.type || 'general',
      service: context.service || 'unknown',
      endpoint: context.endpoint || 'unknown',
      statusCode: context.statusCode || 500,
      userId: context.userId || 'anonymous',
      ip: context.ip || 'unknown',
      details: context.details || {}
    };

    this.errors.unshift(errorEntry);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Track error types
    const type = errorEntry.type;
    if (this.errorTypes.hasOwnProperty(type)) {
      this.errorTypes[type]++;
    } else {
      this.errorTypes.general++;
    }

    // Log to console for Railway logs
    console.error(`[ERROR] [${type}] ${errorEntry.message}`, {
      endpoint: errorEntry.endpoint,
      service: errorEntry.service,
      statusCode: errorEntry.statusCode
    });

    return errorEntry;
  }

  getRecentErrors(limit = 50, type = null) {
    let errors = this.errors;
    
    if (type) {
      errors = errors.filter(e => e.type === type);
    }
    
    return errors.slice(0, limit);
  }

  getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentErrors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > oneHourAgo
    );

    const dailyErrors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > oneDayAgo
    );

    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      last24Hours: dailyErrors.length,
      byType: this.errorTypes,
      recentErrors: this.getRecentErrors(10)
    };
  }

  clearErrors() {
    const count = this.errors.length;
    this.errors = [];
    this.errorTypes = {
      pronunciation: 0,
      openai: 0,
      azureOcr: 0,
      general: 0
    };
    return count;
  }

  searchErrors(query) {
    const lowerQuery = query.toLowerCase();
    return this.errors.filter(error => 
      error.message.toLowerCase().includes(lowerQuery) ||
      error.service.toLowerCase().includes(lowerQuery) ||
      error.endpoint.toLowerCase().includes(lowerQuery)
    );
  }
}

module.exports = new ErrorLogger();
