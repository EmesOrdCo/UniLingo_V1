const { randomUUID } = require('crypto');

class NetworkLogger {
  constructor() {
    this.errorCodes = {
      // DNS and Resolution Errors
      DNS_RESOLVE_ERROR: 'DNS_RESOLVE_ERROR',
      DNS_LOOKUP_TIMEOUT: 'DNS_LOOKUP_TIMEOUT',
      
      // TCP Connection Errors
      TCP_CONNECT_TIMEOUT: 'TCP_CONNECT_TIMEOUT',
      TCP_CONNECT_REFUSED: 'TCP_CONNECT_REFUSED',
      TCP_CONNECT_RESET: 'TCP_CONNECT_RESET',
      TCP_CONNECT_ABORTED: 'TCP_CONNECT_ABORTED',
      
      // TLS/SSL Errors
      TLS_HANDSHAKE_FAILED: 'TLS_HANDSHAKE_FAILED',
      TLS_CERT_ERROR: 'TLS_CERT_ERROR',
      TLS_VERSION_MISMATCH: 'TLS_VERSION_MISMATCH',
      
      // Socket Errors
      SOCKET_RESET: 'SOCKET_RESET',
      SOCKET_TIMEOUT: 'SOCKET_TIMEOUT',
      SOCKET_CLOSED: 'SOCKET_CLOSED',
      
      // Request/Response Errors
      REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
      RESPONSE_TIMEOUT: 'RESPONSE_TIMEOUT',
      REQUEST_ABORTED: 'REQUEST_ABORTED',
      
      // HTTP Errors
      HTTP_ERROR: 'HTTP_ERROR',
      HTTP_TIMEOUT: 'HTTP_TIMEOUT',
      
      // Network Infrastructure Errors
      NETWORK_UNREACHABLE: 'NETWORK_UNREACHABLE',
      HOST_UNREACHABLE: 'HOST_UNREACHABLE',
      NO_ROUTE_TO_HOST: 'NO_ROUTE_TO_HOST',
      
      // Generic Network Errors
      NETWORK_ERROR: 'NETWORK_ERROR',
      CONNECTION_ERROR: 'CONNECTION_ERROR',
      UNKNOWN_NETWORK_ERROR: 'UNKNOWN_NETWORK_ERROR'
    };

    this.phases = {
      DNS_LOOKUP: 'dns_lookup',
      TCP_CONNECT: 'tcp_connect',
      TLS_HANDSHAKE: 'tls_handshake',
      REQUEST_SEND: 'request_send',
      RESPONSE_WAIT: 'response_wait',
      RESPONSE_RECEIVE: 'response_receive',
      CONNECTION_ESTABLISH: 'connection_establish',
      UNKNOWN: 'unknown'
    };
  }

  /**
   * Generate a unique request ID
   */
  generateRequestId() {
    return randomUUID().substring(0, 8);
  }

  /**
   * Log a network error with standardized format
   */
  logError(errorCode, phase, message, target, error, additionalData = {}) {
    const logEntry = {
      level: 'error',
      timestamp: new Date().toISOString(),
      request_id: this.generateRequestId(),
      phase: phase,
      error_code: errorCode,
      message: message,
      target: target,
      stack: error?.stack || null,
      error_message: error?.message || null,
      error_name: error?.name || null,
      error_code: error?.code || null,
      ...additionalData
    };

    // Log to console with formatting
    console.error('\n' + '🚨'.repeat(20));
    console.error('🚨 NETWORK ERROR LOGGED');
    console.error('🚨'.repeat(20));
    console.error(JSON.stringify(logEntry, null, 2));
    console.error('🚨'.repeat(20) + '\n');

    return logEntry;
  }

  /**
   * Log a network success event
   */
  logSuccess(phase, target, responseTime, additionalData = {}) {
    const logEntry = {
      level: 'info',
      timestamp: new Date().toISOString(),
      request_id: this.generateRequestId(),
      phase: phase,
      status: 'success',
      target: target,
      response_time_ms: responseTime,
      ...additionalData
    };

    console.log('\n' + '✅'.repeat(20));
    console.log('✅ NETWORK SUCCESS LOGGED');
    console.log('✅'.repeat(20));
    console.log(JSON.stringify(logEntry, null, 2));
    console.log('✅'.repeat(20) + '\n');

    return logEntry;
  }

  /**
   * Log a network timeout
   */
  logTimeout(errorCode, phase, target, timeoutMs, additionalData = {}) {
    return this.logError(
      errorCode,
      phase,
      `Operation timed out after ${timeoutMs}ms`,
      target,
      new Error(`Timeout after ${timeoutMs}ms`),
      { timeout_ms: timeoutMs, ...additionalData }
    );
  }

  /**
   * Log a connection refused error
   */
  logConnectionRefused(target, additionalData = {}) {
    return this.logError(
      this.errorCodes.TCP_CONNECT_REFUSED,
      this.phases.TCP_CONNECT,
      'Connection refused by target host',
      target,
      new Error('ECONNREFUSED'),
      { error_code: 'ECONNREFUSED', ...additionalData }
    );
  }

  /**
   * Log a DNS resolution error
   */
  logDnsError(hostname, error, additionalData = {}) {
    return this.logError(
      this.errorCodes.DNS_RESOLVE_ERROR,
      this.phases.DNS_LOOKUP,
      `Failed to resolve hostname: ${hostname}`,
      hostname,
      error,
      { hostname, ...additionalData }
    );
  }

  /**
   * Log a TLS handshake failure
   */
  logTlsError(target, error, additionalData = {}) {
    return this.logError(
      this.errorCodes.TLS_HANDSHAKE_FAILED,
      this.phases.TLS_HANDSHAKE,
      'TLS handshake failed',
      target,
      error,
      { ...additionalData }
    );
  }

  /**
   * Log a socket timeout
   */
  logSocketTimeout(target, timeoutMs, additionalData = {}) {
    return this.logError(
      this.errorCodes.SOCKET_TIMEOUT,
      this.phases.RESPONSE_WAIT,
      `Socket timeout after ${timeoutMs}ms`,
      target,
      new Error(`Socket timeout: ${timeoutMs}ms`),
      { timeout_ms: timeoutMs, ...additionalData }
    );
  }

  /**
   * Log a generic network error
   */
  logGenericNetworkError(phase, target, error, additionalData = {}) {
    let errorCode = this.errorCodes.UNKNOWN_NETWORK_ERROR;
    
    // Try to determine error code from error properties
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          errorCode = this.errorCodes.TCP_CONNECT_REFUSED;
          break;
        case 'ECONNRESET':
          errorCode = this.errorCodes.TCP_CONNECT_RESET;
          break;
        case 'ENOTFOUND':
          errorCode = this.errorCodes.DNS_RESOLVE_ERROR;
          break;
        case 'ETIMEDOUT':
          errorCode = this.errorCodes.TCP_CONNECT_TIMEOUT;
          break;
        case 'ENETUNREACH':
          errorCode = this.errorCodes.NETWORK_UNREACHABLE;
          break;
        case 'EHOSTUNREACH':
          errorCode = this.errorCodes.HOST_UNREACHABLE;
          break;
        default:
          errorCode = this.errorCodes.NETWORK_ERROR;
      }
    }

    return this.logError(
      errorCode,
      phase,
      `Network error: ${error.message || 'Unknown network error'}`,
      target,
      error,
      { error_code: error.code, ...additionalData }
    );
  }
}

module.exports = NetworkLogger;
