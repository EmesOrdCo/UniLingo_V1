/**
 * File Cleanup Manager
 * Handles robust file cleanup with monitoring and error recovery
 */

const fs = require('fs');
const path = require('path');

class FileCleanupManager {
  constructor() {
    this.cleanupInterval = null;
    this.cleanupStats = {
      totalCleaned: 0,
      totalErrors: 0,
      lastCleanup: null
    };
    
    this.startPeriodicCleanup();
  }

  startPeriodicCleanup() {
    // Clean up old files every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldFiles();
    }, 300000); // 5 minutes
    
    console.log('[FileCleanup] Periodic cleanup started (every 5 minutes)');
  }

  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[FileCleanup] Periodic cleanup stopped');
    }
  }

  async cleanupOldFiles() {
    const uploadsDir = 'uploads/';
    
    try {
      if (!fs.existsSync(uploadsDir)) {
        return;
      }

      const files = fs.readdirSync(uploadsDir);
      const now = Date.now();
      const maxAge = 300000; // 5 minutes
      let cleanedCount = 0;
      let errorCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        
        try {
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            cleanedCount++;
            console.log(`[FileCleanup] Cleaned up old file: ${file}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`[FileCleanup] Failed to cleanup file ${file}:`, error);
        }
      }

      this.cleanupStats.totalCleaned += cleanedCount;
      this.cleanupStats.totalErrors += errorCount;
      this.cleanupStats.lastCleanup = new Date().toISOString();

      if (cleanedCount > 0 || errorCount > 0) {
        console.log(`[FileCleanup] Cleanup completed: ${cleanedCount} files cleaned, ${errorCount} errors`);
      }
    } catch (error) {
      console.error('[FileCleanup] Periodic cleanup failed:', error);
    }
  }

  async safeCleanup(filePath, maxRetries = 3) {
    if (!filePath) {
      return;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[FileCleanup] Successfully cleaned up: ${filePath}`);
          this.cleanupStats.totalCleaned++;
          return true;
        }
        return true; // File doesn't exist, consider it cleaned
      } catch (error) {
        console.error(`[FileCleanup] Cleanup attempt ${attempt} failed for ${filePath}:`, error);
        
        if (attempt === maxRetries) {
          this.cleanupStats.totalErrors++;
          // Schedule for later cleanup
          setTimeout(() => {
            console.log(`[FileCleanup] Scheduling delayed cleanup for: ${filePath}`);
            this.safeCleanup(filePath, 1);
          }, 60000); // Try again in 1 minute
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return false;
  }

  async cleanupMultiple(files) {
    const results = await Promise.allSettled(
      files.map(file => this.safeCleanup(file))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    
    console.log(`[FileCleanup] Batch cleanup completed: ${successful} successful, ${failed} failed`);
    
    return { successful, failed };
  }

  getStorageStats() {
    const uploadsDir = 'uploads/';
    
    try {
      if (!fs.existsSync(uploadsDir)) {
        return {
          totalFiles: 0,
          totalSize: 0,
          oldestFile: null,
          newestFile: null
        };
      }

      const files = fs.readdirSync(uploadsDir);
      let totalSize = 0;
      let oldestTime = Infinity;
      let newestTime = 0;
      let oldestFile = null;
      let newestFile = null;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        
        try {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
          
          if (stats.mtime.getTime() < oldestTime) {
            oldestTime = stats.mtime.getTime();
            oldestFile = file;
          }
          
          if (stats.mtime.getTime() > newestTime) {
            newestTime = stats.mtime.getTime();
            newestFile = file;
          }
        } catch (error) {
          console.error(`[FileCleanup] Error reading file stats for ${file}:`, error);
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        oldestFile: oldestFile ? {
          name: oldestFile,
          age: Date.now() - oldestTime,
          ageMinutes: Math.floor((Date.now() - oldestTime) / 60000)
        } : null,
        newestFile: newestFile ? {
          name: newestFile,
          age: Date.now() - newestTime,
          ageMinutes: Math.floor((Date.now() - newestTime) / 60000)
        } : null
      };
    } catch (error) {
      console.error('[FileCleanup] Error getting storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        error: error.message
      };
    }
  }

  getStats() {
    return {
      ...this.cleanupStats,
      storage: this.getStorageStats()
    };
  }

  // Emergency cleanup - remove all files older than specified age
  async emergencyCleanup(maxAgeMinutes = 10) {
    const uploadsDir = 'uploads/';
    const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    try {
      if (!fs.existsSync(uploadsDir)) {
        return { cleaned: 0, errors: 0 };
      }

      const files = fs.readdirSync(uploadsDir);
      const now = Date.now();
      let cleanedCount = 0;
      let errorCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        
        try {
          const stats = fs.statSync(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(filePath);
            cleanedCount++;
            console.log(`[FileCleanup] Emergency cleanup: ${file}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`[FileCleanup] Emergency cleanup failed for ${file}:`, error);
        }
      }

      this.cleanupStats.totalCleaned += cleanedCount;
      this.cleanupStats.totalErrors += errorCount;

      console.log(`[FileCleanup] Emergency cleanup completed: ${cleanedCount} files cleaned, ${errorCount} errors`);
      
      return { cleaned: cleanedCount, errors: errorCount };
    } catch (error) {
      console.error('[FileCleanup] Emergency cleanup failed:', error);
      return { cleaned: 0, errors: 1 };
    }
  }
}

module.exports = FileCleanupManager;
