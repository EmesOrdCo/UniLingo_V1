# UniLingo Email Templates

This directory contains custom HTML email templates for UniLingo's authentication system, designed to work with Brevo SMTP and Supabase.

## 📧 Templates Included

### 1. **confirmation-email.html**
- **Purpose**: Email confirmation for new user signups
- **Features**: 
  - Welcome message with UniLingo branding
  - Feature highlights preview
  - Security note about link expiration
  - Mobile-responsive design
  - Brand colors: Purple gradient (#6366f1 to #8b5cf6)

### 2. **password-reset-email.html**
- **Purpose**: Password reset requests
- **Features**:
  - Clear security messaging
  - Red/orange gradient theme (#ef4444 to #f97316)
  - 1-hour expiration notice
  - Security warning for unauthorized requests

### 3. **magic-link-email.html**
- **Purpose**: Magic link authentication
- **Features**:
  - Green gradient theme (#10b981 to #059669)
  - Simple, clean design
  - 1-hour expiration notice
  - Passwordless sign-in messaging

### 4. **email-change-email.html**
- **Purpose**: Email address change confirmation
- **Features**:
  - Purple gradient theme (#8b5cf6 to #7c3aed)
  - Email change confirmation
  - 24-hour expiration notice
  - Security warning for unauthorized changes

## 🎨 Design Features

### **Visual Elements**
- **Gradient Headers**: Each template uses a unique gradient color scheme
- **Modern Typography**: System fonts for optimal rendering across devices
- **Responsive Design**: Mobile-first approach with media queries
- **Brand Consistency**: UniLingo logo and consistent styling
- **Call-to-Action Buttons**: Prominent, accessible buttons with hover effects

### **Security Features**
- **Expiration Notices**: Clear time limits for each link type
- **Security Warnings**: Appropriate warnings for each email type
- **Fallback Links**: Plain text links for accessibility
- **Unauthorized Request Alerts**: Clear messaging for suspicious activity

### **Accessibility**
- **High Contrast**: Readable text colors and backgrounds
- **Alt Text**: Proper image descriptions
- **Keyboard Navigation**: Accessible button designs
- **Screen Reader Friendly**: Semantic HTML structure

## 🔧 Supabase Integration

### **Template Variables**
All templates use Supabase's Mustache-like syntax:
- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - The recipient's email address

### **Template Configuration in Supabase**
1. Go to **Authentication** → **Templates**
2. Select the email type (Confirm Signup, Reset Password, etc.)
3. Copy the HTML content from the corresponding template file
4. Paste into the Supabase template editor
5. Save the template

## 📱 Mobile Optimization

### **Responsive Features**
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Readable Text**: Appropriate font sizes for mobile
- **Optimized Images**: Proper sizing and loading

### **Email Client Compatibility**
- **Gmail**: Full support for gradients and modern CSS
- **Outlook**: Fallback styles for older versions
- **Apple Mail**: Native support for all features
- **Mobile Clients**: Optimized for iOS and Android mail apps

## 🚀 Brevo SMTP Setup

### **SMTP Configuration**
```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP User: [Your Brevo Email]
SMTP Password: [Your Brevo SMTP Key]
Sender Email: [Your Verified Domain Email]
Sender Name: UniLingo
```

### **Domain Verification**
1. Verify your domain in Brevo
2. Set up SPF, DKIM, and DMARC records
3. Test email delivery
4. Monitor delivery rates and reputation

## 🧪 Testing

### **Test Checklist**
- [ ] Email renders correctly in major email clients
- [ ] Links work properly and redirect correctly
- [ ] Mobile responsiveness on various devices
- [ ] Template variables populate correctly
- [ ] Security messages are clear and appropriate
- [ ] Branding is consistent across all templates

### **Testing Tools**
- **Litmus**: Email client testing
- **Email on Acid**: Cross-client compatibility
- **Mail Tester**: Spam score and deliverability
- **Brevo Dashboard**: Delivery statistics and analytics

## 📊 Analytics & Monitoring

### **Brevo Analytics**
- **Delivery Rates**: Monitor successful deliveries
- **Open Rates**: Track email engagement
- **Click Rates**: Measure link interaction
- **Bounce Rates**: Identify delivery issues
- **Spam Complaints**: Monitor reputation

### **Supabase Monitoring**
- **Auth Events**: Track authentication flows
- **Error Logs**: Monitor failed email sends
- **User Analytics**: Track signup completion rates

## 🔄 Updates & Maintenance

### **Regular Updates**
- **Brand Changes**: Update colors, logos, and messaging
- **Security Updates**: Review and update security messaging
- **Feature Updates**: Add new features to confirmation emails
- **A/B Testing**: Test different designs and messaging

### **Version Control**
- Keep templates in version control
- Document changes and updates
- Test thoroughly before deployment
- Maintain backup templates

## 📞 Support

For issues with email templates or delivery:
- **Email**: support@unilingo.co.uk
- **Documentation**: [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- **Brevo Support**: [Brevo Documentation](https://help.brevo.com/)

---

**Note**: Always test email templates in a staging environment before deploying to production. Email rendering can vary significantly across different clients and devices.
