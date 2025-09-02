# 📧 **Professional Email Support System Setup**

## 🎯 **What We've Built:**

A professional email support system that sends properly formatted emails without URL encoding issues:

- ✅ **Supabase Edge Function** - Handles email sending server-side
- ✅ **Professional formatting** - Clean, readable email content
- ✅ **No URL encoding** - Emails sent directly via email service
- ✅ **Database logging** - Optional support request tracking
- ✅ **Reliable delivery** - Uses professional email service

## 🚀 **Setup Steps:**

### **Step 1: Choose Email Service**

You can use any of these email services:

#### **Option A: Resend (Recommended)**
- **Free tier**: 3,000 emails/month
- **Easy setup**: API key integration
- **Professional**: Reliable delivery

#### **Option B: SendGrid**
- **Free tier**: 100 emails/day
- **Good for**: High volume

#### **Option C: Mailgun**
- **Free tier**: 5,000 emails/month
- **Good for**: High volume

### **Step 2: Set Up Email Service**

#### **For Resend:**
1. **Sign up** at [resend.com](https://resend.com)
2. **Get API key** from dashboard
3. **Verify domain** (optional but recommended)

#### **For SendGrid:**
1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Get API key** from Settings → API Keys
3. **Verify sender** email address

### **Step 3: Deploy Supabase Edge Function**

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Deploy the function:**
   ```bash
   supabase functions deploy send-support-email
   ```

### **Step 4: Set Environment Variables**

In your Supabase dashboard, go to Settings → Edge Functions and add:

```
RESEND_API_KEY=your_resend_api_key_here
```

### **Step 5: Create Database Table (Optional)**

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  app_version TEXT,
  device_info TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📧 **Email Format:**

When users submit support requests, you'll receive clean emails like:

```
To: unilingo.help@gmail.com
Subject: UniLingo Support Request - 20250901T192147

Hello UniLingo Support Team,

A new issue has been reported through the app. Details are below:

Report ID: 20250901T192147
User Name: Harry Emes
User Email: harry.emes@hotmail.com
App Version: 1.0.0
Device/Platform: {"platform":"ios","version":"18.5","appVersion":"1.0.0","deviceName":"iPhone 15","deviceYearClass":"2023"}

Issue Description:
Demo

Steps to Reproduce (if provided):
Not provided

Screenshot/Attachment:
Not provided

Thank you,
UniLingo Automated Issue Reporter
```

## 🎯 **Benefits:**

- ✅ **Professional** - Clean, readable email content
- ✅ **No encoding issues** - Direct email sending
- ✅ **Reliable** - Professional email service
- ✅ **Trackable** - Database logging (optional)
- ✅ **Scalable** - Handles any number of users
- ✅ **Secure** - Server-side processing

## 📱 **User Experience:**

1. **User enters description**
2. **User taps "Send Support Request"**
3. **Email sent automatically** via Edge Function
4. **User gets confirmation** message
5. **You receive email** in your inbox

## 🔧 **Customization:**

### **Change Email Service:**
In `supabase/functions/send-support-email/index.ts`, replace the Resend API call with your preferred service.

### **Modify Email Format:**
Update the `emailContent` template in the Edge Function.

### **Add Features:**
- **Email templates** - HTML formatting
- **Attachments** - Screenshot support
- **Priority levels** - Urgent/High/Medium/Low
- **Categories** - Bug/Feature/General

**This is a professional, scalable solution that eliminates all URL encoding issues!** 🚀
