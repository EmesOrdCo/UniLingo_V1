import { AppState } from 'react-native';

interface SessionTimerCallbacks {
  onBreakReminder: () => void;
}

class SessionTimerService {
  private static instance: SessionTimerService;
  private isActive = false;
  private sessionStartTime: number | null = null;
  private accumulatedTime = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: SessionTimerCallbacks | null = null;
  private appStateSubscription: any = null;

  private constructor() {}

  static getInstance(): SessionTimerService {
    if (!SessionTimerService.instance) {
      SessionTimerService.instance = new SessionTimerService();
    }
    return SessionTimerService.instance;
  }

  // Start tracking session time
  startSession(callbacks: SessionTimerCallbacks) {
    if (this.isActive) return;

    this.callbacks = callbacks;
    this.isActive = true;
    this.sessionStartTime = Date.now();
    this.accumulatedTime = 0;

    console.log('🕐 Session timer started');

    // Check every minute for 30-minute intervals
    this.intervalId = setInterval(() => {
      this.checkBreakReminder();
    }, 60000); // Check every minute

    // Handle app state changes (background/foreground)
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && this.sessionStartTime) {
        // App went to background - pause timer
        const sessionDuration = Date.now() - this.sessionStartTime;
        this.accumulatedTime += sessionDuration;
        this.sessionStartTime = null;
        console.log('⏸️ Session timer paused (app backgrounded)');
      } else if (nextAppState === 'active' && !this.sessionStartTime) {
        // App came to foreground - resume timer
        this.sessionStartTime = Date.now();
        console.log('▶️ Session timer resumed (app foregrounded)');
      }
    });
  }

  // Stop tracking session time
  stopSession() {
    if (!this.isActive) return;

    this.isActive = false;
    this.sessionStartTime = null;
    this.accumulatedTime = 0;
    this.callbacks = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    console.log('🛑 Session timer stopped');
  }

  // Check if it's time for a break reminder
  private checkBreakReminder() {
    if (!this.isActive || !this.sessionStartTime) return;

    const currentSessionTime = Date.now() - this.sessionStartTime;
    const totalTime = this.accumulatedTime + currentSessionTime;
    const totalMinutes = Math.floor(totalTime / (1000 * 60));

    // Trigger break reminder every 30 minutes
    if (totalMinutes > 0 && totalMinutes % 30 === 0) {
      console.log(`⏰ Break reminder triggered at ${totalMinutes} minutes`);
      this.callbacks?.onBreakReminder();
    }
  }

  // Get current session time in minutes
  getCurrentSessionTime(): number {
    if (!this.isActive || !this.sessionStartTime) return 0;

    const currentSessionTime = Date.now() - this.sessionStartTime;
    const totalTime = this.accumulatedTime + currentSessionTime;
    return Math.floor(totalTime / (1000 * 60));
  }
}

export default SessionTimerService;
