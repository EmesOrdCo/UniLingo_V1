import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConsistentHeader from '../components/ConsistentHeader';
import ArcadeSection from '../components/arcade/ArcadeSection';

export default function ArcadeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ConsistentHeader 
        pageName="Arcade"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <ArcadeSection />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});
