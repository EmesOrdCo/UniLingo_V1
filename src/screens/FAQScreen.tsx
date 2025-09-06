import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is UniLingo?',
    answer: 'UniLingo is a language learning app designed specifically for university students. It helps you learn languages through interactive lessons, games, and AI-powered conversations tailored to academic contexts.'
  },
  {
    id: '2',
    question: 'How do I create lessons from my course materials?',
    answer: 'Upload PDF files of your course notes or textbooks through the "Create Lesson" feature. Our AI will analyze the content and generate interactive vocabulary exercises and comprehension questions based on your specific subject matter.'
  },
  {
    id: '3',
    question: 'What languages can I learn?',
    answer: 'Currently, UniLingo focuses on helping you learn English as your target language. You can select your native language during setup, and all lessons and exercises will be tailored to help you learn English effectively.'
  },
  {
    id: '4',
    question: 'How does the AI conversation practice work?',
    answer: 'The AI conversation feature allows you to practice speaking and writing in English through realistic conversations. The AI adapts to your level and can discuss topics related to your university studies, helping you improve both general and academic English.'
  },
  {
    id: '5',
    question: 'What are the different game types available?',
    answer: 'UniLingo offers various games including Word Scramble, Sentence Scramble, Memory Match, Hangman, Speed Challenge, Gravity Game, and Type What You Hear. Each game focuses on different language skills like vocabulary, grammar, listening, and spelling.'
  },
  {
    id: '6',
    question: 'How does the AI usage tracking work?',
    answer: 'UniLingo tracks your monthly AI usage to ensure fair access for all users. You have a monthly allowance for AI-powered features like lesson generation and conversation practice. The usage is displayed as a percentage on your dashboard.'
  },
  {
    id: '7',
    question: 'Can I track my learning progress?',
    answer: 'Yes! UniLingo provides comprehensive progress tracking including daily goals, streak counters, level progression, and detailed analytics. You can see your improvement over time and identify areas that need more practice.'
  },
  {
    id: '8',
    question: 'How do daily reminders work?',
    answer: 'You can enable daily study reminders during onboarding. These notifications will appear at random times between 1:00 PM and 3:00 PM to encourage consistent study habits. You can manage these in your device settings.'
  },
  {
    id: '9',
    question: 'What subjects are supported for lesson creation?',
    answer: 'UniLingo supports lesson creation for a wide range of university subjects including Business, Engineering, Medicine, Law, Psychology, Computer Science, Literature, History, and many more. The AI adapts vocabulary and content to your specific field of study.'
  },
  {
    id: '10',
    question: 'How do I change my profile picture?',
    answer: 'Go to your Profile page and tap "Change profile picture". You can select a photo from your device\'s photo library. The app will automatically crop it to a square format suitable for your profile.'
  },
  {
    id: '11',
    question: 'What if I exceed my AI usage limit?',
    answer: 'If you exceed your monthly AI usage limit, you\'ll see a message indicating that AI features are temporarily unavailable. Your limit resets monthly on the anniversary of your account creation date.'
  },
  {
    id: '12',
    question: 'How do I invite friends to UniLingo?',
    answer: 'Use the "Invite friends" feature in your Profile page. You can share an invitation link with friends, and both you and your friends may receive benefits when they join using your referral link.'
  },
  {
    id: '13',
    question: 'Can I use UniLingo offline?',
    answer: 'Some features like reviewing previously downloaded lessons and playing games can work offline. However, AI-powered features like conversation practice and lesson generation require an internet connection.'
  },
  {
    id: '14',
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Settings in your Profile page and select "Delete account". This action is permanent and will remove all your data, progress, and account information.'
  },
  {
    id: '15',
    question: 'What should I do if I\'m having technical issues?',
    answer: 'If you\'re experiencing technical problems, try restarting the app first. If issues persist, use the "Contact Support" feature in your Profile page to reach our support team with details about your problem.'
  }
];

export default function FAQScreen() {
  const navigation = useNavigation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {faqData.map((faq) => (
          <View key={faq.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpanded(faq.id)}
            >
              <Text style={styles.question}>{faq.question}</Text>
              <Ionicons
                name={expandedItems.has(faq.id) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
            
            {expandedItems.has(faq.id) && (
              <View style={styles.answerContainer}>
                <Text style={styles.answer}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
        
        {/* Contact Support Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            If you can't find the answer you're looking for, our support team is here to help.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => navigation.navigate('Profile' as never)}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  answerContainer: {
    paddingBottom: 16,
  },
  answer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 32,
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
