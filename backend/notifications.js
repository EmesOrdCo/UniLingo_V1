/**
 * Job Notification System
 * Server-Sent Events (SSE) for real-time job updates
 * 
 * Features:
 * - Real-time job completion notifications
 * - Multiple clients can subscribe to same job
 * - Automatic cleanup of old connections
 * - Heartbeat to keep connections alive
 * 
 * Issue #9: SSE notifications for job completion
 */

const EventEmitter = require('events');

class NotificationManager extends EventEmitter {
  constructor() {
    super();
    
    // Active SSE connections
    // Map<jobId, Set<response objects>>
    this.connections = new Map();
    
    // Heartbeat interval to keep connections alive
    this.heartbeatInterval = 30000; // 30 seconds
    
    // Start heartbeat
    this.startHeartbeat();
    
    console.log('📡 Notification manager initialized');
  }

  /**
   * Subscribe client to job updates via SSE
   * 
   * @param {string} jobId - Job ID to subscribe to
   * @param {object} res - Express response object
   */
  subscribe(jobId, res) {
    console.log(`📡 SSE: Client subscribed to job ${jobId}`);
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });
    
    // Send initial connection confirmation
    this.sendEvent(res, 'connected', {
      jobId,
      message: 'Connected to job updates',
      timestamp: new Date().toISOString(),
    });
    
    // Add to connections map
    if (!this.connections.has(jobId)) {
      this.connections.set(jobId, new Set());
    }
    this.connections.get(jobId).add(res);
    
    // Clean up on client disconnect
    res.on('close', () => {
      this.unsubscribe(jobId, res);
    });
    
    res.on('error', (error) => {
      console.error(`📡 SSE: Connection error for job ${jobId}:`, error.message);
      this.unsubscribe(jobId, res);
    });
  }

  /**
   * Unsubscribe client from job updates
   * 
   * @param {string} jobId - Job ID
   * @param {object} res - Express response object
   */
  unsubscribe(jobId, res) {
    const clients = this.connections.get(jobId);
    if (clients) {
      clients.delete(res);
      console.log(`📡 SSE: Client unsubscribed from job ${jobId} (${clients.size} remaining)`);
      
      // Clean up empty sets
      if (clients.size === 0) {
        this.connections.delete(jobId);
      }
    }
  }

  /**
   * Notify all subscribers of a job update
   * 
   * @param {string} jobId - Job ID
   * @param {string} eventType - Event type (progress, completed, failed)
   * @param {object} data - Event data
   */
  notify(jobId, eventType, data) {
    const clients = this.connections.get(jobId);
    
    if (!clients || clients.size === 0) {
      console.log(`📡 SSE: No subscribers for job ${jobId} (event: ${eventType})`);
      return;
    }
    
    console.log(`📡 SSE: Notifying ${clients.size} client(s) for job ${jobId}: ${eventType}`);
    
    const deadClients = [];
    
    for (const res of clients) {
      try {
        this.sendEvent(res, eventType, {
          jobId,
          ...data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`📡 SSE: Failed to send to client:`, error.message);
        deadClients.push(res);
      }
    }
    
    // Remove dead connections
    deadClients.forEach(res => this.unsubscribe(jobId, res));
    
    // If job is completed or failed, close all connections after sending
    if (eventType === 'completed' || eventType === 'failed') {
      setTimeout(() => {
        this.closeAllConnections(jobId);
      }, 1000); // Give clients 1 second to receive the event
    }
  }

  /**
   * Send SSE event to client
   * 
   * @param {object} res - Express response object
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  sendEvent(res, eventType, data) {
    const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(eventData);
  }

  /**
   * Close all connections for a job
   * 
   * @param {string} jobId - Job ID
   */
  closeAllConnections(jobId) {
    const clients = this.connections.get(jobId);
    
    if (clients) {
      console.log(`📡 SSE: Closing ${clients.size} connection(s) for job ${jobId}`);
      
      for (const res of clients) {
        try {
          res.end();
        } catch (error) {
          // Ignore errors on close
        }
      }
      
      this.connections.delete(jobId);
    }
  }

  /**
   * Send heartbeat to all connections to keep them alive
   */
  startHeartbeat() {
    setInterval(() => {
      let totalConnections = 0;
      
      for (const [jobId, clients] of this.connections.entries()) {
        totalConnections += clients.size;
        
        for (const res of clients) {
          try {
            this.sendEvent(res, 'heartbeat', {
              jobId,
              connections: clients.size,
            });
          } catch (error) {
            // Will be cleaned up on next notify
          }
        }
      }
      
      if (totalConnections > 0) {
        console.log(`💓 SSE: Heartbeat sent to ${totalConnections} connection(s)`);
      }
    }, this.heartbeatInterval);
  }

  /**
   * Get current connection statistics
   * 
   * @returns {object} - Connection stats
   */
  getStats() {
    let totalConnections = 0;
    const jobsWithSubscribers = [];
    
    for (const [jobId, clients] of this.connections.entries()) {
      totalConnections += clients.size;
      jobsWithSubscribers.push({
        jobId,
        subscribers: clients.size,
      });
    }
    
    return {
      totalConnections,
      activeJobs: this.connections.size,
      jobsWithSubscribers,
    };
  }

  /**
   * Clean up (for graceful shutdown)
   */
  close() {
    console.log('📡 SSE: Closing all connections...');
    
    for (const [jobId, clients] of this.connections.entries()) {
      for (const res of clients) {
        try {
          res.end();
        } catch (error) {
          // Ignore
        }
      }
    }
    
    this.connections.clear();
    console.log('✅ SSE: All connections closed');
  }
}

// Export singleton instance
const notificationManager = new NotificationManager();

module.exports = notificationManager;

