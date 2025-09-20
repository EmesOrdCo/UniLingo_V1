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
          <Text style={styles.title}>TERMS OF SERVICE</Text>
          <Text style={styles.lastUpdated}>Last updated: September 20, 2025</Text>
        </View>

        {/* Content will be added here */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AGREEMENT TO OUR LEGAL TERMS</Text>
          <Text style={styles.paragraph}>
            We are EmesOrd Ltd ('Company', 'we', 'us', or 'our'), a company registered in England at 50 Westfield Avenue, Watford, Hertfordshire WD24 7EH.
          </Text>
          <Text style={styles.paragraph}>
            We operate the mobile application UniLingo (the 'App'), as well as any other related products and services that refer or link to these legal terms (the 'Legal Terms') (collectively, the 'Services').
          </Text>
          <Text style={styles.paragraph}>
            This app helps university students turn their own course notes into personalized study tools. By extracting key terminology and concepts, it creates interactive lessons, flashcards, and games that make learning more engaging, effective, and exam-ready.
          </Text>
          <Text style={styles.paragraph}>
            You can contact us by email at emesordco@gmail.com or by mail to 50 Westfield Avenue, Watford, Hertfordshire WD24 7EH, England.
          </Text>
          <Text style={styles.paragraph}>
            These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ('you'), and EmesOrd Ltd, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </Text>
          <Text style={styles.paragraph}>
            Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Legal Terms from time to time. We will alert you about any changes by updating the 'Last updated' date of these Legal Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Legal Terms to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Legal Terms by your continued use of the Services after the date such revised Legal Terms are posted.
          </Text>
          <Text style={styles.paragraph}>
            All users who are minors in the jurisdiction in which they reside (generally under the age of 18) must have the permission of, and be directly supervised by, their parent or guardian to use the Services. If you are a minor, you must have your parent or guardian read and agree to these Legal Terms prior to you using the Services.
          </Text>
          <Text style={styles.paragraph}>
            We recommend that you print a copy of these Legal Terms for your records.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TABLE OF CONTENTS</Text>
          <Text style={styles.paragraph}>
            1. OUR SERVICES{'\n'}
            2. INTELLECTUAL PROPERTY RIGHTS{'\n'}
            3. USER REPRESENTATIONS{'\n'}
            4. USER REGISTRATION{'\n'}
            5. PURCHASES AND PAYMENT{'\n'}
            6. SUBSCRIPTIONS{'\n'}
            7. PROHIBITED ACTIVITIES{'\n'}
            8. USER GENERATED CONTRIBUTIONS{'\n'}
            9. CONTRIBUTION LICENCE{'\n'}
            10. MOBILE APPLICATION LICENCE{'\n'}
            11. SERVICES MANAGEMENT{'\n'}
            12. PRIVACY POLICY{'\n'}
            13. TERM AND TERMINATION{'\n'}
            14. MODIFICATIONS AND INTERRUPTIONS{'\n'}
            15. GOVERNING LAW{'\n'}
            16. DISPUTE RESOLUTION{'\n'}
            17. CORRECTIONS{'\n'}
            18. DISCLAIMER{'\n'}
            19. LIMITATIONS OF LIABILITY{'\n'}
            20. INDEMNIFICATION{'\n'}
            21. USER DATA{'\n'}
            22. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES{'\n'}
            23. CALIFORNIA USERS AND RESIDENTS{'\n'}
            24. MISCELLANEOUS{'\n'}
            25. CONTACT US
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. OUR SERVICES</Text>
          <Text style={styles.paragraph}>
            The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.
          </Text>
          <Text style={styles.paragraph}>
            The Services are not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. INTELLECTUAL PROPERTY RIGHTS</Text>
          <Text style={styles.subSectionTitle}>Our intellectual property</Text>
          <Text style={styles.paragraph}>
            We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the 'Content'), as well as the trademarks, service marks, and logos contained therein (the 'Marks').
          </Text>
          <Text style={styles.paragraph}>
            Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties in the United States and around the world.
          </Text>
          <Text style={styles.paragraph}>
            The Content and Marks are provided in or through the Services 'AS IS' for your personal, non-commercial use only.
          </Text>
          
          <Text style={styles.subSectionTitle}>Your use of our Services</Text>
          <Text style={styles.paragraph}>
            Subject to your compliance with these Legal Terms, including the 'PROHIBITED ACTIVITIES' section below, we grant you a non-exclusive, non-transferable, revocable licence to:{'\n'}
            - access the Services; and{'\n'}
            - download or print a copy of any portion of the Content to which you have properly gained access,{'\n'}
            {'\n'}solely for your personal, non-commercial use.
          </Text>
          <Text style={styles.paragraph}>
            Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.
          </Text>
          <Text style={styles.paragraph}>
            If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: emesordco@gmail.com. If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.
          </Text>
          <Text style={styles.paragraph}>
            We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.
          </Text>
          <Text style={styles.paragraph}>
            Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. USER REPRESENTATIONS</Text>
          <Text style={styles.paragraph}>
            By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Services; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorised purpose; and (7) your use of the Services will not violate any applicable law or regulation.
          </Text>
          <Text style={styles.paragraph}>
            If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. USER REGISTRATION</Text>
          <Text style={styles.paragraph}>
            You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. PURCHASES AND PAYMENT</Text>
          <Text style={styles.paragraph}>
            We accept the following forms of payment:{'\n'}
            - Visa{'\n'}
            - Mastercard{'\n'}
            - American Express
          </Text>
          <Text style={styles.paragraph}>
            You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in GBP.
          </Text>
          <Text style={styles.paragraph}>
            You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorise us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.
          </Text>
          <Text style={styles.paragraph}>
            We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgement, appear to be placed by dealers, resellers, or distributors.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. SUBSCRIPTIONS</Text>
          <Text style={styles.subSectionTitle}>Billing and Renewal</Text>
          <Text style={styles.paragraph}>
            Your subscription will continue and automatically renew unless cancelled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle is monthly.
          </Text>
          
          <Text style={styles.subSectionTitle}>Free Trial</Text>
          <Text style={styles.paragraph}>
            We offer a 7-day free trial to new users who register with the Services. The account will be charged according to the user's chosen subscription at the end of the free trial.
          </Text>
          
          <Text style={styles.subSectionTitle}>Cancellation</Text>
          <Text style={styles.paragraph}>
            All purchases are non-refundable. You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at emesordco@gmail.com.
          </Text>
          
          <Text style={styles.subSectionTitle}>Fee Changes</Text>
          <Text style={styles.paragraph}>
            We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. PROHIBITED ACTIVITIES</Text>
          <Text style={styles.paragraph}>
            You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavours except those that are specifically endorsed or approved by us.
          </Text>
          <Text style={styles.paragraph}>
            As a user of the Services, you agree not to:{'\n'}
            - Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.{'\n'}
            - Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.{'\n'}
            - Circumvent, disable, or otherwise interfere with security-related features of the Services, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Services and/or the Content contained therein.{'\n'}
            - Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.{'\n'}
            - Use any information obtained from the Services in order to harass, abuse, or harm another person.{'\n'}
            - Make improper use of our support services or submit false reports of abuse or misconduct.{'\n'}
            - Use the Services in a manner inconsistent with any applicable laws or regulations.{'\n'}
            - Engage in unauthorised framing of or linking to the Services.{'\n'}
            - Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material, including excessive use of capital letters and spamming (continuous posting of repetitive text), that interferes with any party's uninterrupted use and enjoyment of the Services or modifies, impairs, disrupts, alters, or interferes with the use, features, functions, operation, or maintenance of the Services.{'\n'}
            - Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.{'\n'}
            - Delete the copyright or other proprietary rights notice from any Content.{'\n'}
            - Attempt to impersonate another user or person or use the username of another user.{'\n'}
            - Upload or transmit (or attempt to upload or to transmit) any material that acts as a passive or active information collection or transmission mechanism, including without limitation, clear graphics interchange formats ('gifs'), 1×1 pixels, web bugs, cookies, or other similar devices (sometimes referred to as 'spyware' or 'passive collection mechanisms' or 'pcms').{'\n'}
            - Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.{'\n'}
            - Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.{'\n'}
            - Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.{'\n'}
            - Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.{'\n'}
            - Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.{'\n'}
            - Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system, including without limitation, any spider, robot, cheat utility, scraper, or offline reader that accesses the Services, or use or launch any unauthorised script or other software.{'\n'}
            - Use a buying agent or purchasing agent to make purchases on the Services.{'\n'}
            - Make any unauthorised use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretences.{'\n'}
            - Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavour or commercial enterprise.{'\n'}
            - Use the Services to advertise or offer to sell goods and services.{'\n'}
            - Sell or otherwise transfer your profile.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. PRIVACY POLICY</Text>
          <Text style={styles.paragraph}>
            We care about data privacy and security. Please review our Privacy Policy: https://www.unilingo.co.uk. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United Kingdom. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United Kingdom, then through your continued use of the Services, you are transferring your data to the United Kingdom, and you expressly consent to have your data transferred to and processed in the United Kingdom.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. GOVERNING LAW</Text>
          <Text style={styles.paragraph}>
            These Legal Terms are governed by and interpreted following the laws of England and Wales, and the use of the United Nations Convention of Contracts for the International Sales of Goods is expressly excluded. If your habitual residence is in the EU, and you are a consumer, you additionally possess the protection provided to you by obligatory provisions of the law in your country to residence. EmesOrd Ltd and yourself both agree to submit to the non-exclusive jurisdiction of the courts of London, which means that you may make a claim to defend your consumer protection rights in regards to these Legal Terms in England, or in the EU country in which you reside.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>18. DISCLAIMER</Text>
          <Text style={styles.paragraph}>
            THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORISED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES. AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGEMENT AND EXERCISE CAUTION WHERE APPROPRIATE.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>19. LIMITATIONS OF LIABILITY</Text>
          <Text style={styles.paragraph}>
            IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE THREE (3) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING. CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>25. CONTACT US</Text>
          <Text style={styles.paragraph}>
            In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>EmesOrd Ltd</Text>{'\n'}
            <Text style={styles.bold}>50 Westfield Avenue</Text>{'\n'}
            <Text style={styles.bold}>Watford, Hertfordshire WD24 7EH</Text>{'\n'}
            <Text style={styles.bold}>England</Text>{'\n'}
            <Text style={styles.bold}>emesordco@gmail.com</Text>
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
    fontSize: 28,
    fontWeight: '700',
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
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  bold: {
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});


