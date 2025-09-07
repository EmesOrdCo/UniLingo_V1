import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TermsAndConditionsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms and Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Unilingo End User Terms</Text>
          <Text style={styles.lastUpdated}>Last updated: 7 September 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. General | Scope</Text>
          <Text style={styles.paragraph}>
            1.1 These Terms govern your personal (non-business) use of Unilingo apps, sites, and services (the "Services") provided by EmesOrdCo (company number 07501099455) ("Unilingo", "we", "us").
          </Text>
          <Text style={styles.paragraph}>
            1.2 If you access or purchase via a third party (e.g., Apple App Store or Google Play), their terms also apply (including for billing, renewals, cancellations, and refunds).
          </Text>
          <Text style={styles.paragraph}>
            1.3 By creating an account or using the Services, you accept these Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Services | Free & Paid | Updates | Trials | Beta | AI Functions</Text>
          <Text style={styles.paragraph}>
            2.1 We offer Free and Paid tiers as described at sign-up/checkout. We may reasonably modify features or content for usability, technical, or legal reasons; for material changes we'll give reasonable notice and your options.
          </Text>
          <Text style={styles.paragraph}>
            2.2 We may release updates and improvements from time to time.
          </Text>
          <Text style={styles.paragraph}>
            2.3 Free Services may be changed, limited, or discontinued at any time.
          </Text>
          <Text style={styles.paragraph}>
            2.4 Trials: Some plans start with a time-limited trial. Unless stated otherwise, trials may auto-convert to a paid plan at the stated price when the trial ends; you can cancel beforehand.
          </Text>
          <Text style={styles.paragraph}>
            2.5 Beta features may be unstable, provided "as is," and can be withdrawn at any time.
          </Text>
          <Text style={styles.paragraph}>
            2.6 AI Functions: Some features use AI models. AI outputs ("AI Output") can be incorrect, incomplete, or inappropriate. Do not rely on AI Output as factual or as professional advice; review before using or sharing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Accounts | Age</Text>
          <Text style={styles.paragraph}>
            3.1 You must create an account with accurate information and keep it updated. Keep your credentials secure and tell us about unauthorized use.
          </Text>
          <Text style={styles.paragraph}>
            3.2 You must be 13+ to use the Services. If you are 13–17, you need parental/guardian consent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Ordering | App-Store Purchases</Text>
          <Text style={styles.paragraph}>
            4.1 Web purchases are with Unilingo; we'll confirm by email.
          </Text>
          <Text style={styles.paragraph}>
            4.2 App-store purchases are with the relevant store. Manage and cancel through the store's subscription settings. Refunds for store purchases are handled by the store under its policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Fees | Billing | Renewal | Cancellation | Refunds</Text>
          <Text style={styles.paragraph}>
            5.1 Prices/taxes appear at checkout. Subscriptions auto-renew for the same term unless you cancel before renewal. We'll send any legally required renewal reminders.
          </Text>
          <Text style={styles.paragraph}>
            5.2 You can cancel any time, effective at the end of the current billing period. Except as required by law or expressly stated below, payments are non-refundable.
          </Text>
          <Text style={styles.paragraph}>
            5.3 Refund policy (web purchases only):
          </Text>
          <Text style={styles.subParagraph}>
            Unused access: If you have not used the product after purchase, you may request a 70% refund within 14 days of purchase.
          </Text>
          <Text style={styles.subParagraph}>
            After use: No refunds once the product has been used. "Used" means any access to paid features after purchase (e.g., logging in to the paid tier, starting or completing a paid lesson/module, generating AI Output, or redeeming a code that unlocks paid access).
          </Text>
          <Text style={styles.subParagraph}>
            How to request: email unilingo.help@gmail.com from your account email with your order info. We may ask for reasonable verification.
          </Text>
          <Text style={styles.subParagraph}>
            App-store purchases: refunds (if any) must be requested via the app store and are subject to the store's policies.
          </Text>
          <Text style={styles.paragraph}>
            5.4 Failed or late payments may result in suspension.
          </Text>
          <Text style={styles.paragraph}>
            5.5 If laws in your country mandate additional refund rights, those rights apply.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. SMS and Email One-Time Passcodes (OTP)</Text>
          <Text style={styles.paragraph}>
            6.1 You may receive 6-digit OTPs by email or SMS for sign-in/security. By choosing SMS, you consent to receive authentication and account-related texts. Message/data rates may apply.
          </Text>
          <Text style={styles.paragraph}>
            6.2 Delivery depends on carriers/providers; we aren't liable for delays or failures outside our control.
          </Text>
          <Text style={styles.paragraph}>
            6.3 You can switch channels or opt out of non-essential messaging in settings; essential security messages may still be sent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree not to: (a) misuse or disrupt the Services; (b) upload unlawful, infringing, harmful, or abusive content (including hate speech, harassment, sexual content involving minors, or instructions facilitating wrongdoing); (c) reverse engineer except where permitted by law; (d) use the Services to commercially train or improve non-Unilingo AI models or build a competing service; (e) collect others' personal data without consent; or (f) attempt to bypass technical protections. We may suspend or terminate for violations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property | License</Text>
          <Text style={styles.paragraph}>
            8.1 We grant you a personal, non-exclusive, non-transferable license to use the Services for your own learning.
          </Text>
          <Text style={styles.paragraph}>
            8.2 The Services (software, content, models, and branding) are owned by Unilingo and our licensors.
          </Text>
          <Text style={styles.paragraph}>
            8.3 User Content: You retain rights to prompts, messages, uploads, and other content you submit ("User Content"). You grant us a worldwide, royalty-free license to host, process, transmit, display, and adapt User Content solely to provide the Services and keep them safe (including abuse prevention, analytics, and service quality).
          </Text>
          <Text style={styles.paragraph}>
            8.4 Model improvement (opt-in): We will not use your content to improve our models unless you explicitly opt in in settings ("Help Improve Unilingo"). You can change this anytime.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Privacy</Text>
          <Text style={styles.paragraph}>
            Our handling of personal data is described in the Unilingo Privacy Policy (available in-app and on our website), including what we collect, why, legal bases, retention, international transfers, and your rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Availability | Maintenance | Support</Text>
          <Text style={styles.paragraph}>
            10.1 We use commercially reasonable efforts to keep Services available but do not guarantee uninterrupted operation.
          </Text>
          <Text style={styles.paragraph}>
            10.2 Maintenance (planned or emergency) may occur.
          </Text>
          <Text style={styles.paragraph}>
            10.3 Support is available via unilingo.help@gmail.com (UK business hours unless stated otherwise).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Services and Terms</Text>
          <Text style={styles.paragraph}>
            11.1 We may change features/content for legitimate reasons (usability, technical, legal).
          </Text>
          <Text style={styles.paragraph}>
            11.2 We may update these Terms. For material changes, we'll provide notice (e.g., in-app or email). Continued use after the effective date constitutes acceptance; where required by law, we'll seek your consent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Third-Party Services & Links</Text>
          <Text style={styles.paragraph}>
            Third-party services (e.g., app stores, payment processors, SMS/email providers) have their own terms and privacy notices. We are not responsible for them.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. AI Output Disclaimers</Text>
          <Text style={styles.paragraph}>
            13.1 No guarantee of accuracy or outcomes: AI Output may be wrong or unsuitable.
          </Text>
          <Text style={styles.paragraph}>
            13.2 No professional advice: AI Output is not medical, legal, immigration, exam, or other professional advice.
          </Text>
          <Text style={styles.paragraph}>
            13.3 You are responsible for reviewing AI Output before relying on it or sharing it.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Term | Termination</Text>
          <Text style={styles.paragraph}>
            14.1 Your subscription runs for the purchased term and renews per Section 5.
          </Text>
          <Text style={styles.paragraph}>
            14.2 We may suspend or terminate for material breach (including non-payment or abuse) after notice where required by law.
          </Text>
          <Text style={styles.paragraph}>
            14.3 Upon termination, your license ends and access ceases. Sections that by nature survive (IP, limitations, governing law, etc.) will survive.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Indemnity (User)</Text>
          <Text style={styles.paragraph}>
            To the extent permitted by law, you will defend and indemnify Unilingo against third-party claims arising from your unlawful use of the Services or breach of Section 7 (Acceptable Use).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            16.1 Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or other liability that cannot be excluded by law.
          </Text>
          <Text style={styles.paragraph}>
            16.2 Subject to 16.1, we are not liable for: (a) loss of profits, revenues, or data; (b) indirect or consequential loss; (c) reliance on AI Output.
          </Text>
          <Text style={styles.paragraph}>
            16.3 Subject to 16.1, our total aggregate liability for all claims in any 12-month period is limited to the amount you paid to Unilingo in that period (or £50 if you only used Free Services).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. Export | Sanctions</Text>
          <Text style={styles.paragraph}>
            You will comply with applicable export control and sanctions laws and not use the Services where prohibited.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>18. Notices | Contact</Text>
          <Text style={styles.paragraph}>
            We may contact you via the email on your account or in-app notices. You can contact us at unilingo.help@gmail.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>19. Consumer Rights (UK/EU) — Digital Content Cooling-Off</Text>
          <Text style={styles.paragraph}>
            19.1 If you are a UK/EU consumer purchasing directly from Unilingo on the web, you typically have a 14-day right to cancel.
          </Text>
          <Text style={styles.paragraph}>
            19.2 Immediate access waiver: By choosing immediate access to digital content, you expressly consent to delivery during the cancellation period and acknowledge you lose the right to cancel once delivery begins.
          </Text>
          <Text style={styles.paragraph}>
            19.3 If you cancel within 14 days before delivery begins, we will refund in line with law (see Section 5 for our commercial refund policy). App-store purchases follow the store's rules.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>20. Governing Law | Jurisdiction</Text>
          <Text style={styles.paragraph}>
            20.1 If you reside in the UK or EU, these Terms are governed by the laws of England and Wales, and the courts of England and Wales have non-exclusive jurisdiction. Mandatory consumer protections of your home country still apply.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>21. Miscellaneous</Text>
          <Text style={styles.paragraph}>
            21.1 If any provision is invalid, the rest remain effective; a valid substitute reflecting the original intent applies.
          </Text>
          <Text style={styles.paragraph}>
            21.2 You may not assign these Terms without our consent; we may assign to an affiliate or as part of a merger, acquisition, or asset transfer.
          </Text>
          <Text style={styles.paragraph}>
            21.3 These Terms are the entire agreement regarding your consumer use of the Services.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 12,
  },
  subParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
    marginLeft: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});
