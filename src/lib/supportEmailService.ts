import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface SupportTicket {
  subject: string;
  description: string;
  userEmail: string;
  userName: string;
  appVersion: string;
  deviceInfo: string;
  reportId: string;
}

export class SupportEmailService {
  // Generate a unique report ID
  private static generateReportId(): string {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  }

  // Get device and app information
  private static getDeviceInfo(): string {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      deviceName: Constants.deviceName || 'Unknown',
      deviceYearClass: Constants.deviceYearClass || 'Unknown',
    };
    
    return JSON.stringify(deviceInfo, null, 2);
  }

  // Create a support ticket and send email via Supabase Edge Function
  static async createSupportTicket(data: {
    subject: string;
    description: string;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const reportId = this.generateReportId();
      const userName = profile?.name || user?.email?.split('@')[0] || 'Anonymous';
      const userEmail = user?.email || 'Not provided';
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      const deviceInfo = this.getDeviceInfo();

      const ticketData: SupportTicket = {
        subject: data.subject,
        description: data.description,
        userEmail,
        userName,
        appVersion,
        deviceInfo,
        reportId,
      };

      // Call Supabase Edge Function to send email
      const { data: result, error } = await supabase.functions.invoke('send-support-email', {
        body: ticketData
      });

      if (error) {
        console.error('Error calling email function:', error);
        throw error;
      }

      console.log('✅ Support email sent successfully via Supabase Edge Function');
    } catch (error) {
      console.error('Support email error:', error);
      throw error;
    }
  }
}
