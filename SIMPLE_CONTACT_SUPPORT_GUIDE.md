# 📧 **Simple Contact Support System**

## 🎯 **How It Works:**

1. **User taps "Contact Support"** in Profile page
2. **User fills out form** - Subject and description
3. **User taps "Send Support Request"**
4. **Native share sheet opens** - User chooses email app
5. **Formatted email is created** with all user details
6. **User sends email** to your support email
7. **You receive email** and reply to help

## 📋 **Email Format:**

When users submit support requests, you'll receive emails like:

```
Subject: [UniLingo Support] App crashes when opening lessons

📧 **UniLingo Support Request**

**User:** John Doe (john@email.com)
**App Version:** 1.0.0
**Platform:** ios 17.0

**Subject:** App crashes when opening lessons

**Description:**
The app keeps crashing whenever I try to open a lesson. 
This happens on both iPhone and iPad. I've tried restarting 
the app but the issue persists.

---
*This support request was sent from the UniLingo mobile app.*

Please reply to this email to help with this issue.
```

## 🎉 **Benefits:**

- ✅ **Simple** - just check your email
- ✅ **Familiar** - uses native email apps
- ✅ **No hosting** - no URLs or dashboards needed
- ✅ **Easy to manage** - reply, forward, organize as you like
- ✅ **Works everywhere** - phone, laptop, tablet
- ✅ **Professional** - formatted with all user details
- ✅ **No backend** - uses device's native sharing
- ✅ **Reliable** - works with any email app

## 📱 **User Experience:**

1. **User opens app** → Profile → Contact Support
2. **Fills out form** → Subject and description
3. **Taps "Send Support Request"**
4. **Share sheet opens** → User chooses email app
5. **Email is pre-filled** → User sends to your email
6. **You receive email** → Reply to handle the issue

## 🚀 **Setup:**

### **Step 1: Update Support Email**
In `src/components/ContactSupportModal.tsx`, update the email address:

```typescript
// Change this line to your support email
const supportEmail = 'unilingo.help@gmail.com';
```

### **Step 2: Test the System**
1. **Open the mobile app**
2. **Go to Profile page**
3. **Tap "Contact Support"**
4. **Fill out the form**
5. **Send a test request**

## 🎯 **Features:**

- **Professional formatting** - Easy to read and respond
- **User details included** - Name, email, app version, platform
- **Native sharing** - Works with any email app
- **No complex setup** - Just update the email address
- **Mobile-friendly** - Optimized for mobile devices

## 📧 **Email Management:**

- **Create email filters** - Filter by "[UniLingo Support]" subject
- **Set up auto-replies** - Acknowledge receipt
- **Forward to team** - Share with other support staff
- **Organize by priority** - Use email labels/folders

**This is exactly what you wanted - simple and practical!** 📧

The system uses the same native sharing approach as the friend invitations, so it's reliable and familiar to users.
