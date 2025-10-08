const { supabase } = require('./supabaseClient');

/**
 * IP Whitelist Manager
 * Manages dynamic IP whitelisting for monitoring endpoints with database backing
 */
class IPWhitelistManager {
  constructor() {
    this.allowedIPs = new Set();
    this.lastReloadTime = null;
    this.reloadIntervalMs = 5 * 60 * 1000; // Reload every 5 minutes
    this.isInitialized = false;
    
    // Default fallback IPs if database is unavailable
    this.fallbackIPs = [
      '127.0.0.1',
      '::1',
      '::ffff:127.0.0.1',
      '146.198.140.69',
      '148.252.147.103',
      '192.76.8.161'
    ];
  }

  /**
   * Initialize the manager and load IPs from database
   */
  async initialize() {
    console.log('🔐 [IP Whitelist] Initializing IP whitelist manager...');
    
    try {
      await this.reloadFromDatabase();
      this.isInitialized = true;
      
      // Set up periodic reload
      setInterval(() => {
        this.reloadFromDatabase().catch(err => {
          console.error('🔐 [IP Whitelist] Periodic reload failed:', err);
        });
      }, this.reloadIntervalMs);
      
      console.log(`🔐 [IP Whitelist] Initialized with ${this.allowedIPs.size} allowed IPs`);
      console.log(`🔐 [IP Whitelist] Auto-reload every ${this.reloadIntervalMs / 1000 / 60} minutes`);
      
    } catch (error) {
      console.error('🔐 [IP Whitelist] Failed to initialize from database, using fallback IPs:', error);
      this.allowedIPs = new Set(this.fallbackIPs);
      this.isInitialized = true;
    }
  }

  /**
   * Reload allowed IPs from database
   */
  async reloadFromDatabase() {
    try {
      const { data, error } = await supabase
        .from('allowed_monitoring_ips')
        .select('ip_address, description')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      const newIPs = new Set(data.map(row => row.ip_address));
      const added = [...newIPs].filter(ip => !this.allowedIPs.has(ip));
      const removed = [...this.allowedIPs].filter(ip => !newIPs.has(ip));
      
      this.allowedIPs = newIPs;
      this.lastReloadTime = new Date();

      if (added.length > 0 || removed.length > 0) {
        console.log(`🔐 [IP Whitelist] Reloaded from database at ${this.lastReloadTime.toISOString()}`);
        if (added.length > 0) {
          console.log(`  ✅ Added: ${added.join(', ')}`);
        }
        if (removed.length > 0) {
          console.log(`  ❌ Removed: ${removed.join(', ')}`);
        }
      }

      return {
        success: true,
        count: this.allowedIPs.size,
        added,
        removed,
        timestamp: this.lastReloadTime
      };

    } catch (error) {
      console.error('🔐 [IP Whitelist] Failed to reload from database:', error);
      
      // Keep existing IPs if reload fails
      if (this.allowedIPs.size === 0) {
        console.warn('🔐 [IP Whitelist] No IPs loaded, falling back to default IPs');
        this.allowedIPs = new Set(this.fallbackIPs);
      }
      
      throw error;
    }
  }

  /**
   * Check if an IP is allowed
   */
  isAllowed(ip) {
    return this.allowedIPs.has(ip);
  }

  /**
   * Add a new IP to the whitelist
   */
  async addIP(ipAddress, description = '') {
    try {
      const { data, error } = await supabase
        .from('allowed_monitoring_ips')
        .insert({
          ip_address: ipAddress,
          description: description,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(`IP address ${ipAddress} already exists in whitelist`);
        }
        throw error;
      }

      // Immediately add to in-memory set
      this.allowedIPs.add(ipAddress);
      
      console.log(`🔐 [IP Whitelist] ✅ Added IP: ${ipAddress} (${description})`);
      
      return {
        success: true,
        ip: data,
        message: `IP ${ipAddress} added successfully`
      };

    } catch (error) {
      console.error('🔐 [IP Whitelist] Failed to add IP:', error);
      throw error;
    }
  }

  /**
   * Remove an IP from the whitelist (soft delete by setting is_active = false)
   */
  async removeIP(ipAddress) {
    try {
      const { data, error } = await supabase
        .from('allowed_monitoring_ips')
        .update({ is_active: false, updated_at: new Date() })
        .eq('ip_address', ipAddress)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(`IP address ${ipAddress} not found in whitelist`);
      }

      // Immediately remove from in-memory set
      this.allowedIPs.delete(ipAddress);
      
      console.log(`🔐 [IP Whitelist] ❌ Removed IP: ${ipAddress}`);
      
      return {
        success: true,
        message: `IP ${ipAddress} removed successfully`
      };

    } catch (error) {
      console.error('🔐 [IP Whitelist] Failed to remove IP:', error);
      throw error;
    }
  }

  /**
   * Update the last_used_at timestamp for an IP
   */
  async recordIPUsage(ipAddress) {
    try {
      // Fire and forget - don't wait for this
      supabase
        .from('allowed_monitoring_ips')
        .update({ last_used_at: new Date() })
        .eq('ip_address', ipAddress)
        .then(() => {
          // Success - no logging needed
        })
        .catch(err => {
          console.error('🔐 [IP Whitelist] Failed to record IP usage:', err);
        });
    } catch (error) {
      // Silently fail - this is not critical
    }
  }

  /**
   * Get all allowed IPs with metadata
   */
  async getAllIPs() {
    try {
      const { data, error } = await supabase
        .from('allowed_monitoring_ips')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        ips: data,
        activeCount: data.filter(ip => ip.is_active).length,
        inactiveCount: data.filter(ip => !ip.is_active).length
      };

    } catch (error) {
      console.error('🔐 [IP Whitelist] Failed to get all IPs:', error);
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      allowedIPCount: this.allowedIPs.size,
      allowedIPs: Array.from(this.allowedIPs),
      lastReloadTime: this.lastReloadTime,
      nextReloadIn: this.lastReloadTime 
        ? this.reloadIntervalMs - (Date.now() - this.lastReloadTime.getTime())
        : null,
      reloadIntervalMs: this.reloadIntervalMs
    };
  }
}

// Create singleton instance
const ipWhitelistManager = new IPWhitelistManager();

module.exports = ipWhitelistManager;
