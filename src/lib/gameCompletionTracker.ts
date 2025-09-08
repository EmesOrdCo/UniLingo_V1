// Global game completion tracker to prevent double logging
class GameCompletionTracker {
  private static instance: GameCompletionTracker;
  private completedGames: Set<string> = new Set();

  private constructor() {}

  static getInstance(): GameCompletionTracker {
    if (!GameCompletionTracker.instance) {
      GameCompletionTracker.instance = new GameCompletionTracker();
    }
    return GameCompletionTracker.instance;
  }

  isCompleted(gameKey: string): boolean {
    return this.completedGames.has(gameKey);
  }

  markCompleted(gameKey: string): void {
    this.completedGames.add(gameKey);
    console.log(`🔒 GameCompletionTracker: Marked ${gameKey} as completed`);
  }

  clear(): void {
    this.completedGames.clear();
    console.log(`🧹 GameCompletionTracker: Cleared all completions`);
  }

  getCompletedGames(): string[] {
    return Array.from(this.completedGames);
  }
}

export default GameCompletionTracker;
