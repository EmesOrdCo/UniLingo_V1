import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { useNavigation } from '@react-navigation/native';
import { completeOnboarding } from '../completeOnboarding';

export function ReviewScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { data, resetOnboarding } = useOnboardingStore();

  const handleComplete = async () => {
    try {
      await completeOnboarding({ data });
      resetOnboarding();
      // Navigation will be handled by the parent component
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleEdit = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  const reviewItems = [
    {
      title: 'Languages',
      value: `${data.nativeLanguage || 'Not selected'} → ${data.targetLanguage || 'Not selected'}`,
      screen: 'Languages',
    },
    {
      title: 'Goals',
      value: data.goals?.join(', ') || 'Not selected',
      screen: 'Goals',
    },
    {
      title: 'Proficiency Level',
      value: data.proficiency || 'Not selected',
      screen: 'Proficiency',
    },
    {
      title: 'Notifications',
      value: data.wantsNotifications ? 'Enabled' : 'Disabled',
      screen: 'Notifications',
    },
    {
      title: 'Age Range',
      value: data.ageRange || 'Not selected',
      screen: 'AgeRange',
    },
    {
      title: 'Discovery Source',
      value: data.discoverySource || 'Not selected',
      screen: 'DiscoverySource',
    },
    {
      title: 'Name',
      value: data.firstName || 'Not provided',
      screen: 'Name',
    },
    {
      title: 'Email',
      value: data.email || 'Not provided',
      screen: 'Email',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Review Your Information
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Please review your information before completing the onboarding process.
        </Text>

        <View style={styles.reviewList}>
          {reviewItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.reviewItem, { borderBottomColor: theme.colors.border.primary }]}
              onPress={() => handleEdit(item.screen)}
            >
              <View style={styles.reviewItemContent}>
                <Text style={[styles.reviewItemTitle, { color: theme.colors.text.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.reviewItemValue, { color: theme.colors.text.secondary }]}>
                  {item.value}
                </Text>
              </View>
              <Text style={[styles.editButton, { color: theme.colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleComplete}
        >
          <Text style={[styles.completeButtonText, { color: theme.colors.text.inverse }]}>
            Complete Onboarding
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  reviewList: {
    marginBottom: 32,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewItemContent: {
    flex: 1,
  },
  reviewItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewItemValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
