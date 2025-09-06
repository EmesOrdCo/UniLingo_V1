import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔔 Checking current notification permissions...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔔 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📱 Permission request result:', status);
      } else {
        console.log('✅ Notifications already granted');
      }

      const granted = finalStatus === 'granted';
      console.log('🔔 Final permission status:', granted ? 'GRANTED' : 'DENIED');
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a daily reminder notification with random time between 13:00-15:00
   */
  static async scheduleDailyReminder(
    content?: NotificationContent
  ): Promise<boolean> {
    try {
      // Cancel any existing daily reminders
      await this.cancelDailyReminders();

      // Generate random time between 13:00 (1 PM) and 15:00 (3 PM)
      const randomHour = 13; // Start at 1 PM
      const randomMinute = Math.floor(Math.random() * 120); // 0-119 minutes (2 hours)
      
      // Convert to proper hour:minute format
      const hour = randomHour + Math.floor(randomMinute / 60);
      const minute = randomMinute % 60;

      const defaultContent: NotificationContent = {
        title: "🌅 Time to learn!",
        body: "Don't break your streak! Complete your daily goals and keep learning.",
        data: { type: 'daily_reminder' }
      };

      const notificationContent = content || defaultContent;

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          hour,
          minute,
          repeats: true, // Daily
        },
      });

      console.log(`✅ Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, '0')} (random time between 13:00-15:00)`);
      return true;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return false;
    }
  }

  /**
   * Schedule a motivational reminder based on user's streak
   */
  static async scheduleStreakReminder(
    streakDays: number
  ): Promise<boolean> {
    try {
      const streakMessages = [
        "🔥 Keep the fire burning! Your streak is looking amazing!",
        "⭐ You're on fire! Don't let your streak die out!",
        "🚀 Amazing progress! Keep up the momentum!",
        "💪 You're unstoppable! Continue your learning journey!",
        "🎯 Consistency is key! You're doing great!"
      ];

      const message = streakMessages[Math.min(streakDays - 1, streakMessages.length - 1)];

      return await this.scheduleDailyReminder({
        title: `🔥 ${streakDays} Day Streak!`,
        body: message,
        data: { type: 'streak_reminder', streakDays }
      });
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
      return false;
    }
  }

  /**
   * Schedule a goal reminder for users who haven't completed their daily goals
   */
  static async scheduleGoalReminder(): Promise<boolean> {
    try {
      return await this.scheduleDailyReminder({
        title: "🎯 Daily Goals Reminder",
        body: "You still have goals to complete today! Don't miss out on your progress.",
        data: { type: 'goal_reminder' }
      });
    } catch (error) {
      console.error('Error scheduling goal reminder:', error);
      return false;
    }
  }

  /**
   * Cancel all daily reminder notifications
   */
  static async cancelDailyReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Cancel notifications that are daily reminders
      const dailyReminderIds = scheduledNotifications
        .filter(notification => 
          notification.content.data?.type === 'daily_reminder' ||
          notification.content.data?.type === 'streak_reminder' ||
          notification.content.data?.type === 'goal_reminder'
        )
        .map(notification => notification.identifier);

      for (const id of dailyReminderIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }

      console.log(`✅ Cancelled ${dailyReminderIds.length} daily reminder notifications`);
    } catch (error) {
      console.error('Error cancelling daily reminders:', error);
    }
  }

  /**
   * Send an immediate notification (for testing)
   */
  static async sendImmediateNotification(content: NotificationContent): Promise<boolean> {
    try {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: null, // Immediate
      });
      return true;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get detailed permission status for debugging
   */
  static async getPermissionStatus(): Promise<{
    status: string;
    granted: boolean;
    canAskAgain: boolean;
    details: any;
  }> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      return {
        status: permissions.status,
        granted: permissions.status === 'granted',
        canAskAgain: permissions.canAskAgain || false,
        details: permissions
      };
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        status: 'unknown',
        granted: false,
        canAskAgain: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Setup notification listeners for handling notification interactions
   */
  static setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    // Handle notification tap/interaction
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data?.type === 'daily_reminder') {
        // Navigate to dashboard or daily goals
        console.log('📅 Daily reminder tapped - navigate to dashboard');
      } else if (data?.type === 'streak_reminder') {
        // Navigate to streak details
        console.log('🔥 Streak reminder tapped - navigate to streak details');
      } else if (data?.type === 'goal_reminder') {
        // Navigate to daily goals
        console.log('🎯 Goal reminder tapped - navigate to daily goals');
      }
    });

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }
}
