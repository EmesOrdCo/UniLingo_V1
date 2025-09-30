/**
 * Performance Monitoring System
 * Tracks server performance, request metrics, and system health
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      startTime: Date.now(),
      pronunciationRequests: 0,
      pronunciationErrors: 0,
      pronunciationAvgTime: 0,
      pronunciationTotalTime: 0,
      openaiRequests: 0,
      openaiErrors: 0,
      openaiAvgTime: 0,
      openaiTotalTime: 0,
      azureOcrRequests: 0,
      azureOcrErrors: 0,
      azureOcrAvgTime: 0,
      azureOcrTotalTime: 0
    };
    
    this.recentRequests = [];
    this.maxRecentRequests = 100;
  }

  recordRequest(responseTime, success, service = 'general') {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.requests;
    
    if (!success) {
      this.metrics.errors++;
    }

    // Record service-specific metrics
    if (service === 'pronunciation') {
      this.metrics.pronunciationRequests++;
      this.metrics.pronunciationTotalTime += responseTime;
      this.metrics.pronunciationAvgTime = this.metrics.pronunciationTotalTime / this.metrics.pronunciationRequests;
      if (!success) {
        this.metrics.pronunciationErrors++;
      }
    } else if (service === 'openai') {
      this.metrics.openaiRequests++;
      this.metrics.openaiTotalTime += responseTime;
      this.metrics.openaiAvgTime = this.metrics.openaiTotalTime / this.metrics.openaiRequests;
      if (!success) {
        this.metrics.openaiErrors++;
      }
    } else if (service === 'azure-ocr') {
      this.metrics.azureOcrRequests++;
      this.metrics.azureOcrTotalTime += responseTime;
      this.metrics.azureOcrAvgTime = this.metrics.azureOcrTotalTime / this.metrics.azureOcrRequests;
      if (!success) {
        this.metrics.azureOcrErrors++;
      }
    }

    // Track recent requests
    this.recentRequests.push({
      timestamp: Date.now(),
      responseTime,
      success,
      service
    });

    // Keep only recent requests
    if (this.recentRequests.length > this.maxRecentRequests) {
      this.recentRequests = this.recentRequests.slice(-this.maxRecentRequests);
    }
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const uptimeHours = uptime / (1000 * 60 * 60);
    
    return {
      ...this.metrics,
      uptime,
      uptimeHours,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      requestsPerMinute: (this.metrics.requests / uptime) * 60000,
      requestsPerHour: (this.metrics.requests / uptime) * 3600000,
      pronunciationErrorRate: this.metrics.pronunciationRequests > 0 ? (this.metrics.pronunciationErrors / this.metrics.pronunciationRequests) * 100 : 0,
      openaiErrorRate: this.metrics.openaiRequests > 0 ? (this.metrics.openaiErrors / this.metrics.openaiRequests) * 100 : 0,
      azureOcrErrorRate: this.metrics.azureOcrRequests > 0 ? (this.metrics.azureOcrErrors / this.metrics.azureOcrRequests) * 100 : 0,
      recentRequests: this.recentRequests.slice(-10) // Last 10 requests
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const status = {
      overall: 'healthy',
      services: {
        pronunciation: 'healthy',
        openai: 'healthy',
        azureOcr: 'healthy'
      },
      issues: []
    };

    // Check overall error rate
    if (metrics.errorRate > 10) {
      status.overall = 'degraded';
      status.issues.push(`High error rate: ${metrics.errorRate.toFixed(2)}%`);
    }

    // Check service-specific error rates
    if (metrics.pronunciationErrorRate > 15) {
      status.services.pronunciation = 'degraded';
      status.issues.push(`Pronunciation service error rate: ${metrics.pronunciationErrorRate.toFixed(2)}%`);
    }

    if (metrics.openaiErrorRate > 10) {
      status.services.openai = 'degraded';
      status.issues.push(`OpenAI service error rate: ${metrics.openaiErrorRate.toFixed(2)}%`);
    }

    if (metrics.azureOcrErrorRate > 15) {
      status.services.azureOcr = 'degraded';
      status.issues.push(`Azure OCR service error rate: ${metrics.azureOcrErrorRate.toFixed(2)}%`);
    }

    // Check response times
    if (metrics.avgResponseTime > 10000) {
      status.overall = 'degraded';
      status.issues.push(`High average response time: ${metrics.avgResponseTime.toFixed(0)}ms`);
    }

    if (metrics.pronunciationAvgTime > 15000) {
      status.services.pronunciation = 'degraded';
      status.issues.push(`Slow pronunciation processing: ${metrics.pronunciationAvgTime.toFixed(0)}ms`);
    }

    return status;
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0,
      startTime: Date.now(),
      pronunciationRequests: 0,
      pronunciationErrors: 0,
      pronunciationAvgTime: 0,
      pronunciationTotalTime: 0,
      openaiRequests: 0,
      openaiErrors: 0,
      openaiAvgTime: 0,
      openaiTotalTime: 0,
      azureOcrRequests: 0,
      azureOcrErrors: 0,
      azureOcrAvgTime: 0,
      azureOcrTotalTime: 0
    };
    this.recentRequests = [];
  }
}

module.exports = PerformanceMonitor;
