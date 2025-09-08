// Global completion lock to prevent ANY duplicate calls
class GlobalCompletionLock {
  private static instance: GlobalCompletionLock;
  private lockedCompletions: Map<string, number> = new Map();
  private readonly LOCK_DURATION = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): GlobalCompletionLock {
    if (!GlobalCompletionLock.instance) {
      GlobalCompletionLock.instance = new GlobalCompletionLock();
    }
    return GlobalCompletionLock.instance;
  }

  isLocked(gameKey: string): boolean {
    const lockTime = this.lockedCompletions.get(gameKey);
    if (!lockTime) return false;
    
    const now = Date.now();
    if (now - lockTime > this.LOCK_DURATION) {
      this.lockedCompletions.delete(gameKey);
      return false;
    }
    
    return true;
  }

  lockCompletion(gameKey: string): void {
    this.lockedCompletions.set(gameKey, Date.now());
    console.log(`🔒 GlobalCompletionLock: LOCKED ${gameKey} for ${this.LOCK_DURATION}ms`);
  }

  clear(): void {
    this.lockedCompletions.clear();
    console.log(`🧹 GlobalCompletionLock: Cleared all locks`);
  }
}

export default GlobalCompletionLock;
