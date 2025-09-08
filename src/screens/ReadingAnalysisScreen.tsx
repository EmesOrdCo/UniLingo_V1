import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ReadingAnalysisScreen() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const navigation = useNavigation();

  const sampleTexts = [
    {
      title: 'Medical Case Study',
      content: 'The patient presented with symptoms of myocardial infarction, including chest pain, shortness of breath, and elevated cardiac enzymes. Immediate intervention was required to prevent further cardiac damage.',
      subject: 'Medicine'
    },
    {
      title: 'Engineering Problem',
      content: 'The thermodynamic analysis revealed that entropy increased significantly during the process, indicating irreversible energy losses that need to be addressed in the system design.',
      subject: 'Engineering'
    },
    {
      title: 'Physics Research',
      content: 'The wave function collapse phenomenon demonstrates the fundamental uncertainty principle in quantum mechanics, challenging our classical understanding of reality.',
      subject: 'Physics'
    }
  ];

  const analyzeText = () => {
    if (!text.trim()) {
      setAnalysis('Please enter some text to analyze.');
      return;
    }

    // Mock analysis - in a real app, this would call an AI service
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length - 1;
    const complexWords = text.split(/\s+/).filter(word => word.length > 6).length;
    
    setAnalysis(`Analysis Results:
• Word Count: ${wordCount}
• Sentence Count: ${sentenceCount}
• Complex Words (>6 letters): ${complexWords}
• Reading Level: ${wordCount > 20 ? 'Advanced' : 'Intermediate'}

Key terms identified:
• Medical terminology
• Academic vocabulary
• Subject-specific concepts

Recommendations:
• Create flashcards for complex terms
• Practice pronunciation of medical terms
• Review related subject materials`);
  };

  const useSampleText = (sample: any) => {
    setText(sample.content);
    setAnalysis('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Analysis</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>AI-Powered Text Analysis</Text>
          <Text style={styles.introSubtitle}>
            Upload or paste your academic text to get instant analysis, vocabulary extraction, and learning recommendations
          </Text>
        </View>

        <View style={styles.sampleSection}>
          <Text style={styles.sectionTitle}>Sample Texts</Text>
          <View style={styles.sampleGrid}>
            {sampleTexts.map((sample, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sampleCard}
                onPress={() => useSampleText(sample)}
              >
                <View style={styles.sampleHeader}>
                  <Text style={styles.sampleTitle}>{sample.title}</Text>
                  <View style={styles.subjectTag}>
                    <Text style={styles.subjectText}>{sample.subject}</Text>
                  </View>
                </View>
                <Text style={styles.sampleContent} numberOfLines={3}>
                  {sample.content}
                </Text>
                <Text style={styles.useSampleText}>Tap to use this sample</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Your Text</Text>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Paste your academic text here for analysis..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.analyzeButton} onPress={analyzeText}>
            <Ionicons name="analytics" size={20} color="#ffffff" />
            <Text style={styles.analyzeButtonText}>Analyze Text</Text>
          </TouchableOpacity>
        </View>

        {analysis && (
          <View style={styles.analysisSection}>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            <View style={styles.analysisCard}>
              <Text style={styles.analysisText}>{analysis}</Text>
            </View>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  sampleSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  sampleGrid: {
    gap: 16,
  },
  sampleCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  subjectTag: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subjectText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  sampleContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  useSampleText: {
    fontSize: 12,
    color: '#6366f1',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 16,
    minHeight: 120,
  },
  analyzeButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
});
